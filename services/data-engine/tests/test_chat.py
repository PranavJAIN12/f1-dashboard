"""Tests for the streaming chat endpoint, with Ollama replaced by a scripted fake."""
import json

import pytest
from fastapi.testclient import TestClient

from app import ollama
from app.main import app

client = TestClient(app)

RACE_REF = {
    "year": 2024, "round": 1, "meeting_key": 1229, "event_name": "Bahrain Grand Prix",
    "country": "Bahrain", "location": "Sakhir", "date": "2024-03-02T17:00:00+00:00",
    "session": {"name": "Race", "type": "R", "session_key": 9472},
}
ROW = {"position": 1, "driver_id": "VER", "abbreviation": "VER", "full_name": "Max Verstappen",
       "headshot_url": None, "team": "Red Bull Racing", "grid": 1, "points": 25.0,
       "status": "Finished", "laps": 57, "fastest_lap": 91.2, "result_time": 5400.1}


def parse_sse(body: str):
    events = []
    for block in body.strip().split("\n\n"):
        name, data = block.split("\n", 1)
        events.append((name.removeprefix("event: "), json.loads(data.removeprefix("data: "))))
    return events


def scripted_ollama(monkeypatch, rounds):
    """Each stream_chat call yields the next scripted list of chunks; the sent messages are recorded."""
    sent = []

    async def fake_stream(http, model, messages, tools):
        sent.append({"model": model, "messages": [dict(m) for m in messages], "tools": tools})
        for chunk in rounds[len(sent) - 1]:
            yield chunk

    monkeypatch.setattr(ollama, "stream_chat", fake_stream)
    return sent


def test_chat_runs_tool_then_streams_answer_with_full_tool_output(monkeypatch):
    monkeypatch.setattr("app.api.routes.results", lambda y, r, code="R": (RACE_REF, [ROW]))
    sent = scripted_ollama(monkeypatch, [
        [{"message": {"tool_calls": [{"function": {"name": "get_session_results",
                                                  "arguments": {"year": 2024, "round_number": 1}}}]}}],
        [{"message": {"content": "Verstappen "}}, {"message": {"content": "won."}, "done": True}],
    ])
    res = client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": "Who won Bahrain 2024?"}]})
    assert res.headers["content-type"].startswith("text/event-stream")
    events = parse_sse(res.text)

    assert [e for e, _ in events] == ["tool_call", "tool_result", "token", "token", "done"]
    result = events[1][1]
    assert not result["is_error"] and json.loads(result["content"])["results"] == [ROW]
    assert "".join(d["content"] for e, d in events if e == "token") == "Verstappen won."
    # The model saw the complete tool output on the second round and the full tool catalogue.
    assert sent[1]["messages"][-1]["role"] == "tool" and json.loads(sent[1]["messages"][-1]["content"])["results"] == [ROW]
    assert "get_session_results" in {t["function"]["name"] for t in sent[0]["tools"]}


def test_tool_errors_are_fed_back_to_the_model(monkeypatch):
    sent = scripted_ollama(monkeypatch, [
        [{"message": {"tool_calls": [{"function": {"name": "get_race", "arguments": {"year": 2022, "round_number": 1}}}]}}],
        [{"message": {"content": "Data starts in 2023."}, "done": True}],
    ])
    events = parse_sse(client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": "2022?"}]}).text)
    assert events[1][1]["is_error"] and "2023" in events[1][1]["content"]
    assert events[-1][0] == "done"
    assert "2023" in sent[1]["messages"][-1]["content"]


def test_unknown_tool_does_not_crash_the_stream(monkeypatch):
    scripted_ollama(monkeypatch, [
        [{"message": {"tool_calls": [{"function": {"name": "nope", "arguments": {}}}]}}],
        [{"message": {"content": "Sorry."}, "done": True}],
    ])
    events = parse_sse(client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": "hi"}]}).text)
    assert events[1][1]["is_error"] and events[-1][0] == "done"


def test_unreachable_ollama_streams_an_error_event(monkeypatch):
    async def down(*args, **kwargs):
        raise ollama.OllamaError("Ollama is not reachable at http://localhost:11434. Start it with `ollama serve`.")
        yield

    monkeypatch.setattr(ollama, "stream_chat", down)
    events = parse_sse(client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": "hi"}]}).text)
    assert events == [("error", {"message": "Ollama is not reachable at http://localhost:11434. Start it with `ollama serve`."})]


@pytest.mark.parametrize("messages", [[], [{"role": "assistant", "content": "hi"}], [{"role": "user", "content": ""}]])
def test_invalid_chat_requests_are_rejected(messages):
    assert client.post("/api/v1/chat", json={"messages": messages}).status_code == 422
