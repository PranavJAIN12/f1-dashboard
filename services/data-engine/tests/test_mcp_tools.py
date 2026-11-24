"""Tests for the MCP tool wrappers in app/mcp/server.py.

These assert that tools call the right OpenF1 service functions with the right arguments
(verifying the query/path/alias parameter mapping against the REST routes) and that failed
API calls surface as mcp.server.mcpserver.exceptions.ToolError rather than raw exceptions.
Service-layer functions are monkeypatched so no real OpenF1 network calls are made.
"""
import pytest
from mcp.server.mcpserver.exceptions import ToolError

from app.mcp.server import mcp

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


RACE_REF = {
    "year": 2024, "round": 1, "meeting_key": 1229, "event_name": "Bahrain Grand Prix",
    "country": "Bahrain", "location": "Sakhir", "date": "2024-03-02T17:00:00+00:00",
    "session": {"name": "Race", "type": "R", "session_key": 9472},
}

RESULT_ROW = {
    "position": 1, "driver_id": "VER", "abbreviation": "VER", "full_name": "Max Verstappen",
    "headshot_url": None, "team": "Red Bull Racing", "grid": 1, "points": 25.0,
    "status": "Finished", "laps": 57, "fastest_lap": 91.2, "result_time": 5400.1,
}


async def _ok_text(result):
    assert not result.is_error
    return result.content[0].text


async def test_list_races_calls_schedule_with_year(monkeypatch):
    monkeypatch.setattr("app.api.routes.schedule", lambda year: [{
        "round": 1, "meeting_key": 1229, "event_name": "Bahrain Grand Prix", "country": "Bahrain",
        "location": "Sakhir", "circuit_image": None, "date_start": "2024-02-29T11:30:00+00:00",
        "date": "2024-03-02T17:00:00+00:00",
    }])
    text = await _ok_text(await mcp.call_tool("list_races", {"year": 2024}))
    assert '"event_name": "Bahrain Grand Prix"' in text


async def test_get_race_results_forwards_session_query_param(monkeypatch):
    captured = {}

    def fake_results(year, round_number, code="R"):
        captured.update(year=year, round_number=round_number, code=code)
        return RACE_REF, [RESULT_ROW]

    monkeypatch.setattr("app.api.routes.results", fake_results)
    text = await _ok_text(await mcp.call_tool(
        "get_race_results", {"year": 2024, "round_number": 1, "session": "Q"},
    ))
    assert captured == {"year": 2024, "round_number": 1, "code": "Q"}
    assert '"driver_id": "VER"' in text


async def test_compare_drivers_builds_json_body_with_round_alias(monkeypatch):
    def fake_laps(year, round_number, code="R"):
        return RACE_REF, [
            {"driver": "VER", "lap_time_seconds": 90.0},
            {"driver": "VER", "lap_time_seconds": 91.0},
            {"driver": "PER", "lap_time_seconds": 92.0},
        ]

    monkeypatch.setattr("app.api.routes.laps", fake_laps)
    text = await _ok_text(await mcp.call_tool("compare_drivers", {
        "year": 2024, "round_number": 1, "driver_a": "ver", "driver_b": "per",
    }))
    assert '"VER"' in text and '"PER"' in text


async def test_get_driver_not_found_raises_tool_error(monkeypatch):
    monkeypatch.setattr(
        "app.api.routes.results", lambda year, round_number, code="R": (RACE_REF, [RESULT_ROW]),
    )
    with pytest.raises(ToolError, match="Driver not found"):
        await mcp.call_tool("get_driver", {"driver_id": "ZZZ", "year": 2024, "round_number": 1})
