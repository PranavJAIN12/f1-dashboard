"""Streaming client for Ollama's /api/chat endpoint."""
from __future__ import annotations

import json
import os
from typing import Any, AsyncIterator

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:20b")
# Ollama's own default context is 4096 tokens and it silently drops the oldest messages beyond that,
# which would cut off large tool results. Keep this high enough for the data being sent.
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "32768"))


class OllamaError(Exception):
    pass


def new_client() -> httpx.AsyncClient:
    # No read timeout: a local model can take a long time to load and to think between tokens.
    return httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=httpx.Timeout(None, connect=5))


async def list_models(client: httpx.AsyncClient) -> list[str]:
    try:
        res = await client.get("/api/tags", timeout=5)
        res.raise_for_status()
    except httpx.HTTPError as e:
        raise OllamaError(f"Ollama is not reachable at {OLLAMA_BASE_URL}. Start it with `ollama serve`.") from e
    return [m["name"] for m in res.json().get("models", [])]


async def stream_chat(client: httpx.AsyncClient, model: str, messages: list[dict[str, Any]],
                      tools: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
    """Yield Ollama's streamed chunks. Each has `message` (content / thinking / tool_calls) and `done`."""
    payload = {"model": model, "messages": messages, "tools": tools, "stream": True,
               "options": {"num_ctx": OLLAMA_NUM_CTX}}
    try:
        async with client.stream("POST", "/api/chat", json=payload) as res:
            if res.status_code >= 400:
                body = (await res.aread()).decode(errors="replace")
                try:
                    body = json.loads(body).get("error", body)
                except ValueError:
                    pass
                raise OllamaError(f"Ollama returned {res.status_code}: {body}")
            async for line in res.aiter_lines():
                if not line.strip():
                    continue
                chunk = json.loads(line)
                if chunk.get("error"):
                    raise OllamaError(str(chunk["error"]))
                yield chunk
    except httpx.ConnectError as e:
        raise OllamaError(f"Ollama is not reachable at {OLLAMA_BASE_URL}. Start it with `ollama serve`.") from e
