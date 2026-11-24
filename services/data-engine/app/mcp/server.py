"""MCP tool definitions for the APEX F1 data engine.

Each tool is a thin wrapper around one (or a small, non-redundant group of) REST endpoint(s)
defined in app/api/routes.py, called in-process through app/mcp/client.py. This lets any MCP
client (e.g. a chatbot) query race, driver, team, analytics and telemetry data without needing
to know the HTTP API shape.

Run standalone with: python -m app.mcp
"""
from __future__ import annotations

from typing import Any

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

from app.mcp.client import ApiError, get, post
from app.openf1_service import FIRST_SEASON

mcp = MCPServer(
    name="apex-f1-data-engine",
    version="1.0.0",
    instructions=(
        "Tools for querying Formula 1 race, driver, team, analytics and telemetry data "
        f"sourced from OpenF1 (seasons {FIRST_SEASON} onwards). Rounds are 1-based race "
        "weekend numbers (testing excluded). Session codes: R, Q, S, SQ, FP1, FP2, FP3."
    ),
)


async def _call(path: str, *, method: str = "GET", params: dict[str, Any] | None = None,
                 json: dict[str, Any] | None = None) -> dict:
    try:
        if method == "POST":
            return await post(path, json=json, params=params)
        return await get(path, params=params)
    except ApiError as e:
        raise ToolError(f"{e.detail}") from e


# RACES

@mcp.tool()
async def list_races(year: int = 2024) -> dict:
    """List the race weekends scheduled for a season (year >= 2023)."""
    return await _call("/races", params={"year": year})


@mcp.tool()
async def get_race(year: int, round_number: int) -> dict:
    """Get race details (event name, location, circuit image) and session metadata for one race weekend."""
    return await _call(f"/races/{year}/{round_number}")


@mcp.tool()
async def get_race_results(year: int, round_number: int, session: str = "R") -> dict:
    """Get classified results (positions, points, status, fastest lap) for one session of a race weekend."""
    return await _call(f"/races/{year}/{round_number}/results", params={"session": session})


@mcp.tool()
async def get_race_laps(
    year: int, round_number: int, session: str = "R",
    driver: str | None = None, lap_from: int | None = None, lap_to: int | None = None,
) -> dict:
    """Get lap-by-lap data (times, sectors, compound, stint) for a session, optionally filtered
    to one driver (3-letter code, e.g. VER) and/or a lap number range."""
    return await _call(f"/races/{year}/{round_number}/laps", params={
        "session": session, "driver": driver, "lap_from": lap_from, "lap_to": lap_to,
    })


@mcp.tool()
async def get_pit_stops(year: int, round_number: int, session: str = "R") -> dict:
    """Get pit-stop records (lap, duration, stationary time) for a session."""
    return await _call(f"/races/{year}/{round_number}/pit-stops", params={"session": session})


@mcp.tool()
async def get_weather(year: int, round_number: int, session: str = "R") -> dict:
    """Get weather samples (air/track temperature, humidity, rainfall, wind) for a session."""
    return await _call(f"/races/{year}/{round_number}/weather", params={"session": session})


@mcp.tool()
async def get_race_sessions(year: int, round_number: int) -> dict:
    """List the sessions (practice, qualifying, sprint, race) held during one race weekend."""
    return await _call(f"/races/{year}/{round_number}/sessions")


# DRIVERS

@mcp.tool()
async def list_drivers(year: int = 2024, round_number: int = 8) -> dict:
    """List drivers and their race-session results for a given race weekend."""
    return await _call("/drivers", params={"year": year, "round": round_number})


@mcp.tool()
async def get_driver(driver_id: str, year: int = 2024, round_number: int = 8) -> dict:
    """Get one driver's profile and result (3-letter driver code, e.g. VER) for a race weekend."""
    return await _call(f"/drivers/{driver_id}", params={"year": year, "round": round_number})


@mcp.tool()
async def get_driver_results(driver_id: str, year: int = 2024, round_number: int = 8) -> dict:
    """Get a driver's session result for a race weekend."""
    return await _call(f"/drivers/{driver_id}/results", params={"year": year, "round": round_number})


@mcp.tool()
async def get_driver_laps(driver_id: str, year: int = 2024, round_number: int = 8) -> dict:
    """Get a driver's lap-by-lap race data for a race weekend."""
    return await _call(f"/drivers/{driver_id}/laps", params={"year": year, "round": round_number})


@mcp.tool()
async def get_driver_telemetry(
    driver_id: str, lap: int, session: str = "R", year: int = 2024, round_number: int = 8,
) -> dict:
    """Get a driver's car telemetry (speed, throttle, brake, gear, RPM, DRS, position) for one lap."""
    return await _call(f"/drivers/{driver_id}/telemetry", params={
        "lap": lap, "session": session, "year": year, "round": round_number,
    })


# TEAMS

@mcp.tool()
async def list_teams(year: int = 2024, round_number: int = 8) -> dict:
    """List teams and their drivers' results for a race weekend."""
    return await _call("/teams", params={"year": year, "round": round_number})


@mcp.tool()
async def get_team(team_id: str, year: int = 2024, round_number: int = 8) -> dict:
    """Get one team's drivers and results for a race weekend (team name, e.g. 'Red Bull Racing')."""
    return await _call(f"/teams/{team_id}", params={"year": year, "round": round_number})


@mcp.tool()
async def get_team_results(team_id: str, year: int = 2024, round_number: int = 8) -> dict:
    """Get one team's results for a race weekend."""
    return await _call(f"/teams/{team_id}/results", params={"year": year, "round": round_number})


# ANALYTICS

@mcp.tool()
async def get_pace_analysis(year: int = 2024, round_number: int = 8) -> dict:
    """Analyse race pace per driver: lap count, best/average/median lap time in seconds."""
    return await _call("/analytics/pace", params={"year": year, "round": round_number})


@mcp.tool()
async def compare_drivers(year: int, round_number: int, driver_a: str, driver_b: str) -> dict:
    """Compare two drivers' race-pace metrics (best/average/median lap time) for a race weekend."""
    return await _call("/analytics/driver-comparison", method="POST", json={
        "year": year, "round": round_number, "driver_a": driver_a, "driver_b": driver_b,
    })


@mcp.tool()
async def get_sector_times(year: int = 2024, round_number: int = 8) -> dict:
    """Get each driver's best sector 1/2/3 times for a race weekend."""
    return await _call("/analytics/sector-times", params={"year": year, "round": round_number})


@mcp.tool()
async def get_tyre_strategy(year: int = 2024, round_number: int = 8) -> dict:
    """Get each driver's tyre compound sequence (strategy) for a race weekend."""
    return await _call("/analytics/tyre-strategy", params={"year": year, "round": round_number})


@mcp.tool()
async def get_position_changes(year: int = 2024, round_number: int = 8) -> dict:
    """Get each driver's start vs. finish position and positions gained/lost for a race weekend."""
    return await _call("/analytics/position-changes", params={"year": year, "round": round_number})


@mcp.tool()
async def get_gap_analysis(year: int = 2024, round_number: int = 8) -> dict:
    """Get each driver's median-pace gap, in seconds, to the fastest driver in a race weekend."""
    return await _call("/analytics/gap-analysis", params={"year": year, "round": round_number})


# TELEMETRY

@mcp.tool()
async def compare_telemetry(
    driver_a: str, driver_b: str, lap_a: int, lap_b: int,
    session: str = "R", year: int = 2024, round_number: int = 8,
) -> dict:
    """Compare car telemetry traces for two drivers' laps (can be different lap numbers)."""
    return await _call("/telemetry/compare", params={
        "driver_a": driver_a, "driver_b": driver_b, "lap_a": lap_a, "lap_b": lap_b,
        "session": session, "year": year, "round": round_number,
    })


@mcp.tool()
async def get_track_coordinates(
    driver: str, lap: int, session: str = "R", year: int = 2024, round_number: int = 8,
) -> dict:
    """Get the (x, y) track-position coordinates for one driver's lap, for plotting a track map."""
    return await _call("/telemetry/track", params={
        "driver": driver, "lap": lap, "session": session, "year": year, "round": round_number,
    })


# AI ANALYST

@mcp.tool()
async def ask_f1_analyst(question: str, year: int | None = None, round_number: int | None = None) -> dict:
    """Ask a free-form F1 question. year/round_number scope the question to one race weekend."""
    return await _call("/ai/ask", method="POST", json={
        "question": question, "year": year, "round": round_number,
    })


@mcp.tool()
async def get_race_summary(year: int = 2024, round_number: int = 8) -> dict:
    """Generate a short natural-language summary of a race's outcome."""
    return await _call("/ai/race-summary", method="POST", params={"year": year, "round": round_number})


@mcp.tool()
async def get_driver_analysis(driver_id: str, year: int = 2024, round_number: int = 8) -> dict:
    """Generate a short natural-language analysis of a driver's result for a race weekend."""
    return await _call("/ai/driver-analysis", method="POST", params={
        "driver_id": driver_id, "year": year, "round": round_number,
    })


@mcp.tool()
async def get_strategy_analysis(year: int = 2024, round_number: int = 8) -> dict:
    """Generate strategy-analysis guidance, pointing to structured tyre-strategy evidence."""
    return await _call("/ai/strategy-analysis", method="POST", params={"year": year, "round": round_number})


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
