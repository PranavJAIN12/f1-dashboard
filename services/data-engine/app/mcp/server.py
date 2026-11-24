"""MCP tool definitions for the APEX F1 data engine.

Each tool wraps one REST endpoint from app/api/routes.py, called in-process through
app/mcp/client.py, so any MCP client (e.g. the chat backend) gets the same validation and
response contracts as the HTTP API. Responses are returned in full, never truncated.

Round-level tools require `year` and `round_number` explicitly; there are no hidden defaults
that could make a model silently answer about the wrong race.

Run standalone with: python -m app.mcp
"""
from __future__ import annotations

from typing import Any, Literal

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

from app.mcp.client import ApiError, describe_detail, get, post
from app.openf1_service import FIRST_SEASON

SessionCode = Literal["R", "Q", "S", "SQ", "FP1", "FP2", "FP3"]

mcp = MCPServer(
    name="apex-f1-data-engine",
    version="1.0.0",
    instructions=(
        "Tools for querying Formula 1 race, driver, team, analytics and telemetry data "
        f"sourced from OpenF1 (seasons {FIRST_SEASON} onwards, completed sessions only). "
        "Rounds are 1-based race weekend numbers (testing excluded); use list_races to find a round. "
        "Session codes: R race, Q qualifying, S sprint, SQ sprint qualifying, FP1-FP3 practice."
    ),
)


async def _call(path: str, *, method: str = "GET", params: dict[str, Any] | None = None,
                json: dict[str, Any] | None = None) -> dict:
    try:
        if method == "POST":
            return await post(path, json=json, params=params)
        return await get(path, params=params)
    except ApiError as e:
        raise ToolError(describe_detail(e.detail)) from e


# RACES

@mcp.tool()
async def list_races(year: int) -> dict:
    """List the race weekends of a season with their round numbers (year >= 2023)."""
    return await _call("/races", params={"year": year})


@mcp.tool()
async def get_race(year: int, round_number: int) -> dict:
    """Get one race weekend: event name, country, location, circuit image and its sessions
    (practice, qualifying, sprint, race) with dates."""
    return await _call(f"/races/{year}/{round_number}")


@mcp.tool()
async def get_session_results(year: int, round_number: int, session: SessionCode = "R") -> dict:
    """Get the classification of one session: position, driver, team, grid, points, status,
    fastest lap and result time. Use session R for the race, Q for qualifying."""
    return await _call(f"/races/{year}/{round_number}/results", params={"session": session})


@mcp.tool()
async def get_laps(
    year: int, round_number: int, session: SessionCode = "R",
    driver: str | None = None, lap_from: int | None = None, lap_to: int | None = None,
) -> dict:
    """Get lap-by-lap data (lap time, sectors, tyre compound, stint, position, speeds) for a session.
    Optionally filter to one driver (3-letter code such as VER) and a lap range."""
    return await _call(f"/races/{year}/{round_number}/laps", params={
        "session": session, "driver": driver, "lap_from": lap_from, "lap_to": lap_to,
    })


@mcp.tool()
async def get_pit_stops(year: int, round_number: int, session: SessionCode = "R") -> dict:
    """Get pit-stop records (driver, lap, pit-lane duration, stationary time) for a session."""
    return await _call(f"/races/{year}/{round_number}/pit-stops", params={"session": session})


@mcp.tool()
async def get_weather(year: int, round_number: int, session: SessionCode = "R") -> dict:
    """Get weather samples (air/track temperature, humidity, pressure, rainfall, wind) for a session."""
    return await _call(f"/races/{year}/{round_number}/weather", params={"session": session})


# DRIVERS AND TEAMS

@mcp.tool()
async def list_drivers(year: int, round_number: int) -> dict:
    """List the drivers who took part in a race weekend, with team and race result."""
    return await _call("/drivers", params={"year": year, "round": round_number})


@mcp.tool()
async def get_driver(driver_id: str, year: int, round_number: int) -> dict:
    """Get one driver's race result for a weekend. driver_id is the 3-letter code, e.g. VER, HAM, LEC."""
    return await _call(f"/drivers/{driver_id}", params={"year": year, "round": round_number})


@mcp.tool()
async def list_teams(year: int, round_number: int) -> dict:
    """List the teams at a race weekend with each team's drivers and results."""
    return await _call("/teams", params={"year": year, "round": round_number})


@mcp.tool()
async def get_team(team_name: str, year: int, round_number: int) -> dict:
    """Get one team's drivers and results for a weekend. team_name is e.g. 'Red Bull Racing' (case-insensitive)."""
    return await _call(f"/teams/{team_name}", params={"year": year, "round": round_number})


# ANALYTICS

@mcp.tool()
async def get_pace_analysis(year: int, round_number: int) -> dict:
    """Race pace per driver: lap count and best, average and median lap time in seconds."""
    return await _call("/analytics/pace", params={"year": year, "round": round_number})


@mcp.tool()
async def compare_drivers(year: int, round_number: int, driver_a: str, driver_b: str) -> dict:
    """Compare two drivers' race pace (best, average, median lap time). Use 3-letter driver codes."""
    return await _call("/analytics/driver-comparison", method="POST", json={
        "year": year, "round": round_number, "driver_a": driver_a, "driver_b": driver_b,
    })


@mcp.tool()
async def get_sector_times(year: int, round_number: int) -> dict:
    """Each driver's best sector 1, 2 and 3 times in the race."""
    return await _call("/analytics/sector-times", params={"year": year, "round": round_number})


@mcp.tool()
async def get_tyre_strategy(year: int, round_number: int) -> dict:
    """Each driver's sequence of tyre compounds used in the race."""
    return await _call("/analytics/tyre-strategy", params={"year": year, "round": round_number})


@mcp.tool()
async def get_position_changes(year: int, round_number: int) -> dict:
    """Each driver's first-lap position, last-lap position and positions gained or lost."""
    return await _call("/analytics/position-changes", params={"year": year, "round": round_number})


@mcp.tool()
async def get_gap_analysis(year: int, round_number: int) -> dict:
    """Each driver's median race-pace gap in seconds to the fastest driver."""
    return await _call("/analytics/gap-analysis", params={"year": year, "round": round_number})


# TELEMETRY

@mcp.tool()
async def get_telemetry(driver_id: str, lap: int, year: int, round_number: int, session: SessionCode = "R") -> dict:
    """Full car telemetry for one lap (speed, throttle, brake, gear, RPM, DRS, x/y position). Large response."""
    return await _call(f"/telemetry/{driver_id}", params={
        "lap": lap, "session": session, "year": year, "round": round_number,
    })


@mcp.tool()
async def compare_telemetry(
    driver_a: str, driver_b: str, lap_a: int, lap_b: int, year: int, round_number: int,
    session: SessionCode = "R",
) -> dict:
    """Full telemetry of two drivers' laps side by side (laps may differ). Very large response."""
    return await _call("/telemetry/compare", params={
        "driver_a": driver_a, "driver_b": driver_b, "lap_a": lap_a, "lap_b": lap_b,
        "session": session, "year": year, "round": round_number,
    })


@mcp.tool()
async def get_track_coordinates(driver: str, lap: int, year: int, round_number: int, session: SessionCode = "R") -> dict:
    """The (x, y, distance) points of one driver's lap, enough to plot the track layout."""
    return await _call("/telemetry/track", params={
        "driver": driver, "lap": lap, "session": session, "year": year, "round": round_number,
    })


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
