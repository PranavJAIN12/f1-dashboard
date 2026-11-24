"""Streaming chat endpoint: Ollama model + the F1 MCP tools, delivered as server-sent events.

POST /api/v1/chat   body: {"messages": [{"role": "user", "content": "..."}], "model": optional}
GET  /api/v1/chat/status

The browser sends the conversation so far; the server runs the tool-calling loop against the
MCP server and streams everything as it happens. Event types (`event:` name, JSON `data:`):

  token        {"content": str}                         answer text delta
  thinking     {"content": str}                         reasoning delta (models that expose it)
  tool_call    {"id", "name", "arguments"}              the model asked for a tool
  tool_result  {"id", "name", "is_error", "content"}    full tool output (not truncated)
  done         {"model", "rounds"}                      finished
  error        {"message"}                              failed; the stream ends
"""
from __future__ import annotations

import json
import logging
from datetime import date
from typing import Any, AsyncIterator, Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from mcp import Client
from pydantic import BaseModel, Field, model_validator

from app import ollama
from app.mcp.server import mcp

log = logging.getLogger("apex.chat")
router = APIRouter()

MAX_TOOL_ROUNDS = 8

SYSTEM_PROMPT = """You are the APEX Formula 1 analyst. Today is {today}.
Answer using the tools provided; they return real OpenF1 data for completed sessions from 2023 onwards.
- Never invent results, lap times or statistics. If a tool cannot answer, say so.
- Rounds are race-weekend numbers within a season. If you only know a race name or date, call list_races first to find its round.
- Drivers are identified by 3-letter codes (VER, HAM, LEC, NOR, ...). Teams by name (e.g. Red Bull Racing).
- Prefer the smallest tool that answers the question. Telemetry tools return very large responses; use them only when the user asks about telemetry.
- If a tool returns an error, read it, fix the arguments and try again, or explain the limitation.
- Lap times are in seconds. Keep answers concise and cite the race and session you used."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=20000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=100)
    model: str | None = Field(None, description="Ollama model name; defaults to OLLAMA_MODEL.")

    @model_validator(mode="after")
    def last_is_user(self):
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user.")
        return self


def sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def ollama_tools(tools) -> list[dict[str, Any]]:
    return [{"type": "function", "function": {
        "name": t.name, "description": t.description or "", "parameters": t.input_schema,
    }} for t in tools]


def result_text(result) -> str:
    return "\n".join(c.text for c in result.content if getattr(c, "type", None) == "text")


async def run_chat(request: ChatRequest) -> AsyncIterator[dict[str, Any]]:
    """The tool-calling loop. Yields (event, data) pairs."""
    model = request.model or ollama.OLLAMA_MODEL
    convo: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT.format(today=date.today().isoformat())}]
    convo += [m.model_dump() for m in request.messages]

    async with Client(mcp) as tool_client, ollama.new_client() as http:
        tools = ollama_tools((await tool_client.list_tools()).tools)

        for round_number in range(1, MAX_TOOL_ROUNDS + 1):
            content, thinking, calls = "", "", []
            try:
                async for chunk in ollama.stream_chat(http, model, convo, tools):
                    msg = chunk.get("message") or {}
                    if msg.get("thinking"):
                        thinking += msg["thinking"]
                        yield "thinking", {"content": msg["thinking"]}
                    if msg.get("content"):
                        content += msg["content"]
                        yield "token", {"content": msg["content"]}
                    calls += msg.get("tool_calls") or []
            except ollama.OllamaError as e:
                # Handled here: raised inside the MCP client context it would surface as an ExceptionGroup.
                yield "error", {"message": str(e)}
                return

            if not calls:
                yield "done", {"model": model, "rounds": round_number}
                return

            assistant: dict[str, Any] = {"role": "assistant", "content": content, "tool_calls": calls}
            if thinking:
                assistant["thinking"] = thinking
            convo.append(assistant)

            for index, call in enumerate(calls):
                fn = call.get("function") or {}
                name, arguments = fn.get("name", ""), fn.get("arguments") or {}
                call_id = call.get("id") or f"call_{round_number}_{index}"
                yield "tool_call", {"id": call_id, "name": name, "arguments": arguments}
                try:
                    result = await tool_client.call_tool(name, arguments)
                    text, is_error = result_text(result), bool(result.is_error)
                except Exception as e:  # unknown tool, bad arguments from the model, etc.
                    text, is_error = f"Tool call failed: {e}", True
                yield "tool_result", {"id": call_id, "name": name, "is_error": is_error, "content": text}
                convo.append({"role": "tool", "tool_name": name, "content": text})

    yield "error", {"message": f"Stopped after {MAX_TOOL_ROUNDS} tool rounds without a final answer."}


async def event_stream(request: ChatRequest) -> AsyncIterator[str]:
    try:
        async for event, data in run_chat(request):
            yield sse(event, data)
    except ollama.OllamaError as e:
        yield sse("error", {"message": str(e)})
    except Exception:
        log.exception("chat stream failed")
        yield sse("error", {"message": "Unexpected error while generating the answer."})


@router.post("/chat", tags=["Chat"], summary="Chat with the F1 analyst (server-sent events stream)")
async def chat(body: ChatRequest):
    return StreamingResponse(event_stream(body), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/chat/status", tags=["Chat"], summary="Check Ollama connectivity and the configured model")
async def chat_status():
    async with ollama.new_client() as http:
        try:
            models = await ollama.list_models(http)
        except ollama.OllamaError as e:
            raise HTTPException(503, {"code": "ollama_unavailable", "message": str(e)})
    configured = ollama.OLLAMA_MODEL
    available = configured in models or f"{configured}:latest" in models
    return {"ollama_url": ollama.OLLAMA_BASE_URL, "model": configured, "model_available": available,
            "models": models, "num_ctx": ollama.OLLAMA_NUM_CTX}
