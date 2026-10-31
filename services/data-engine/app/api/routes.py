from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.fastf1_service import race, results, laps, pit_stops as extract_pit_stops, telemetry, weather as weather_data, load
from collections import defaultdict
from statistics import mean

router = APIRouter()

def safe(fn):
    try: return fn()
    except HTTPException: raise
    except Exception as e: raise HTTPException(502, f"F1 data request failed: {e}")

def race_ref(year, round_number):
    return race(year, round_number)

def session_metadata(year, round_number):
    s = load(year, round_number, "R")
    sessions = []
    for number in range(1, 6):
        name = s.event.get(f"Session{number}")
        if name and str(name) != "nan":
            session_type = {
                "Practice 1": "FP1", "Practice 2": "FP2", "Practice 3": "FP3",
                "Qualifying": "Q", "Sprint": "S", "Race": "R",
            }.get(str(name), str(name))
            sessions.append({"name": str(name), "type": session_type})
    return sessions

class DriverComparison(BaseModel):
    year: int
    round: int
    driver_a: str
    driver_b: str

class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    year: int | None = None
    round: int | None = None

# RACES
@router.get("/races", tags=["Races"], summary="List races for a season")
def list_races(year: int = Query(2024, ge=1950, le=2100)):
    import fastf1
    def work():
        df = fastf1.get_event_schedule(year, include_testing=False)
        return {"year": year, "races": [{
            "round": int(r["RoundNumber"]), "event_name": r["EventName"],
            "country": r.get("Country"), "location": r.get("Location"),
            "date": r.get("EventDate").isoformat() if hasattr(r.get("EventDate"), "isoformat") else None
        } for _, r in df.iterrows()]}
    return safe(work)

@router.get("/races/{year}/{round_number}", tags=["Races"], summary="Get race details")
def race_details(year: int, round_number: int):
    return safe(lambda: {"race": race_ref(year, round_number), "sessions": session_metadata(year, round_number)})

@router.get("/races/{year}/{round_number}/results", tags=["Races"], summary="Get session results")
def race_results(year: int, round_number: int, session: str = Query("R")):
    return safe(lambda: {"race": race_ref(year, round_number), "session": session,
                         "results": results(year, round_number, session)[1]})

@router.get("/races/{year}/{round_number}/laps", tags=["Races"], summary="Get lap data")
def race_laps(year: int, round_number: int, session: str = "R",
              driver: str | None = None, lap_from: int | None = None, lap_to: int | None = None):
    def work():
        rows = laps(year, round_number, session)[1]
        if driver: rows = [x for x in rows if x["driver"] == driver.upper()]
        if lap_from: rows = [x for x in rows if x["lap_number"] and x["lap_number"] >= lap_from]
        if lap_to: rows = [x for x in rows if x["lap_number"] and x["lap_number"] <= lap_to]
        return {"race": race_ref(year, round_number), "session": session, "laps": rows}
    return safe(work)

@router.get("/races/{year}/{round_number}/pit-stops", tags=["Races"], summary="Get pit-stop data")
def pit_stops(year: int, round_number: int):
    def work():
        _, rows = extract_pit_stops(year, round_number)
        response = {"race": race_ref(year, round_number), "pit_stops": rows}
        if not rows:
            response["note"] = "No pit-in/pit-out signals were returned by FastF1 for this race session."
        return response
    return safe(work)

@router.get("/races/{year}/{round_number}/weather", tags=["Races"], summary="Get session weather")
def weather(year: int, round_number: int, session: str = "R"):
    def work():
        _, rows = weather_data(year, round_number, session)
        return {"race": race_ref(year, round_number), "session": session,
                "weather": rows}
    return safe(work)

@router.get("/races/{year}/{round_number}/sessions", tags=["Races"], summary="Get session metadata")
def sessions(year: int, round_number: int):
    return safe(lambda: {"race": race_ref(year, round_number), "sessions": session_metadata(year, round_number)})

# DRIVERS
@router.get("/drivers", tags=["Drivers"], summary="List drivers")
def drivers(year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"drivers": results(year, round_number)[1]})

@router.get("/drivers/{driver_id}", tags=["Drivers"], summary="Get driver profile")
def driver(driver_id: str, year: int = 2024, round_number: int = Query(8, alias="round")):
    def work():
        rows = results(year, round_number)[1]
        x = next((r for r in rows if r["driver_id"] == driver_id.upper()), None)
        if not x: raise HTTPException(404, "Driver not found")
        return x
    return safe(work)

@router.get("/drivers/{driver_id}/results", tags=["Drivers"], summary="Get driver results")
def driver_results(driver_id: str, year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"driver": driver_id.upper(),
        "results": [r for r in results(year, round_number)[1] if r["driver_id"] == driver_id.upper()]})

@router.get("/drivers/{driver_id}/laps", tags=["Drivers"], summary="Get driver laps")
def driver_laps(driver_id: str, year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"driver": driver_id.upper(),
        "laps": [r for r in laps(year, round_number)[1] if r["driver"] == driver_id.upper()]})

@router.get("/drivers/{driver_id}/telemetry", tags=["Drivers"], summary="Get driver telemetry")
def driver_telemetry(driver_id: str, lap: int = Query(..., ge=1),
                     year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"driver_id": driver_id.upper(), "lap_number": lap,
                         "telemetry": telemetry(year, round_number, driver_id.upper(), lap)})

# TEAMS
@router.get("/teams", tags=["Teams"], summary="List teams")
def teams(year: int = 2024, round_number: int = Query(8, alias="round")):
    def work():
        grouped = defaultdict(list)
        for r in results(year, round_number)[1]:
            if r["team"]: grouped[r["team"]].append(r)
        return {"teams": [{"team": k, "drivers": v} for k, v in grouped.items()]}
    return safe(work)

@router.get("/teams/{team_id}", tags=["Teams"], summary="Get team profile")
def team(team_id: str, year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"team": team_id,
        "drivers": [r for r in results(year, round_number)[1] if (r["team"] or "").lower() == team_id.lower()]})

@router.get("/teams/{team_id}/results", tags=["Teams"], summary="Get team results")
def team_results(team_id: str, year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"team": team_id,
        "results": [r for r in results(year, round_number)[1] if (r["team"] or "").lower() == team_id.lower()]})

# ANALYTICS
def pace_data(year, rnd):
    rows = laps(year, rnd)[1]
    g = defaultdict(list)
    for r in rows:
        t = r["lap_time_seconds"]
        if t and 60 < t < 300: g[r["driver"]].append(t)
    return {d: {"laps": len(v), "best_lap_seconds": min(v),
                "average_lap_seconds": mean(v), "median_lap_seconds": sorted(v)[len(v)//2]}
            for d, v in g.items()}

@router.get("/analytics/pace", tags=["Analytics"], summary="Analyse race pace")
def pace(year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"metrics": pace_data(year, round_number)})

@router.post("/analytics/driver-comparison", tags=["Analytics"], summary="Compare two drivers")
def comparison(body: DriverComparison):
    return safe(lambda: {"driver_a": body.driver_a.upper(), "driver_b": body.driver_b.upper(),
                         "metrics": {body.driver_a.upper(): pace_data(body.year, body.round).get(body.driver_a.upper()),
                                     body.driver_b.upper(): pace_data(body.year, body.round).get(body.driver_b.upper())}})

@router.get("/analytics/sector-times", tags=["Analytics"], summary="Get best sector times")
def sectors(year: int = 2024, round_number: int = Query(8, alias="round")):
    def work():
        s = load(year, round_number, "R")
        out = {}
        for d in s.laps["Driver"].dropna().unique():
            x = s.laps.pick_drivers(d)
            out[d] = {}
            for i, col in enumerate(["Sector1Time", "Sector2Time", "Sector3Time"], 1):
                vals = [v.total_seconds() for v in x[col].dropna()] if col in x else []
                out[d][f"best_sector_{i}"] = min(vals) if vals else None
        return {"sector_times": out}
    return safe(work)

@router.get("/analytics/tyre-strategy", tags=["Analytics"], summary="Analyse tyre strategy")
def tyre_strategy(year: int = 2024, round_number: int = Query(8, alias="round")):
    rows = laps(year, round_number)[1]
    g = defaultdict(list)
    for r in rows:
        if r["driver"] and r["compound"]: g[r["driver"]].append(r["compound"])
    return {"strategy": {d: list(dict.fromkeys(v)) for d, v in g.items()}}

@router.get("/analytics/stints", tags=["Analytics"], summary="Analyse tyre stints")
def stints(year: int = 2024, round_number: int = Query(8, alias="round")):
    return tyre_strategy(year, round_number)

@router.get("/analytics/degradation", tags=["Analytics"], summary="Estimate tyre degradation")
def degradation(year: int = 2024, round_number: int = Query(8, alias="round")):
    return pace(year, round_number)

@router.get("/analytics/position-changes", tags=["Analytics"], summary="Calculate position changes")
def position_changes(year: int = 2024, round_number: int = Query(8, alias="round")):
    rows = laps(year, round_number)[1]
    first, last = {}, {}
    for r in rows:
        if r["driver"] and r["position"] and r["lap_number"]:
            first.setdefault(r["driver"], r["position"]); last[r["driver"]] = r["position"]
    return {"position_changes": {d: {"start_position": first[d], "finish_position": last[d],
            "positions_gained": first[d]-last[d]} for d in first}}

@router.get("/analytics/gap-analysis", tags=["Analytics"], summary="Calculate pace gaps")
def gaps(year: int = 2024, round_number: int = Query(8, alias="round")):
    m = pace_data(year, round_number)
    best = min((x["median_lap_seconds"] for x in m.values()), default=None)
    return {"reference_median_seconds": best,
            "gaps": {d: x["median_lap_seconds"]-best for d, x in m.items()} if best else {}}

# TELEMETRY
@router.get("/telemetry/{driver_id}", tags=["Telemetry"], summary="Get driver telemetry")
def telemetry_api(driver_id: str, lap: int = Query(..., ge=1),
                  year: int = 2024, round_number: int = Query(8, alias="round")):
    return driver_telemetry(driver_id, lap, year, round_number)

@router.get("/telemetry/{driver_id}/lap/{lap_number}", tags=["Telemetry"], summary="Get telemetry for one lap")
def telemetry_lap(driver_id: str, lap_number: int, year: int = 2024,
                  round_number: int = Query(8, alias="round")):
    return telemetry_api(driver_id, lap_number, year, round_number)

@router.get("/telemetry/compare", tags=["Telemetry"], summary="Compare two telemetry traces")
def telemetry_compare(driver_a: str, driver_b: str, lap_a: int, lap_b: int,
                      year: int = 2024, round_number: int = Query(8, alias="round")):
    return {"driver_a": {"driver_id": driver_a, "lap": lap_a, "telemetry": telemetry(year, round_number, driver_a, lap_a)},
            "driver_b": {"driver_id": driver_b, "lap": lap_b, "telemetry": telemetry(year, round_number, driver_b, lap_b)}}

@router.get("/telemetry/track", tags=["Telemetry"], summary="Get track coordinates")
def track(driver: str, lap: int, year: int = 2024, round_number: int = Query(8, alias="round")):
    return {"driver": driver, "lap": lap,
            "points": [{"x": p["x"], "y": p["y"], "distance": p["distance"]}
                       for p in telemetry(year, round_number, driver, lap)]}

# LIVE
@router.get("/live/session", tags=["Live"], summary="Live session state")
def live_session(): return {"status": "not_configured", "message": "Live ingestion is a later phase."}
@router.get("/live/leaderboard", tags=["Live"], summary="Live leaderboard")
def live_leaderboard(): return {"status": "not_configured", "leaderboard": []}
@router.get("/live/timing", tags=["Live"], summary="Live timing")
def live_timing(): return {"status": "not_configured", "timing": []}
@router.get("/live/pit-stops", tags=["Live"], summary="Live pit stops")
def live_pits(): return {"status": "not_configured", "pit_stops": []}
@router.get("/live/track-status", tags=["Live"], summary="Live track status")
def live_track_status(): return {"status": "not_configured", "track_status": None}

# AI
@router.post("/ai/ask", tags=["AI Analyst"], summary="Ask the F1 analyst")
def ai_ask(body: AskRequest):
    return {"answer": f"AI provider not configured. Received: {body.question}",
            "sources": ["APEX analytics API"]}

@router.post("/ai/race-summary", tags=["AI Analyst"], summary="Generate race summary")
def ai_summary(year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"answer": f"{race(year, round_number)['event_name']} race summary: winner was "
                                    f"{results(year, round_number)[1][0]['full_name']}.",
                         "sources": ["FastF1 race results"]})

@router.post("/ai/driver-analysis", tags=["AI Analyst"], summary="Generate driver analysis")
def ai_driver(driver_id: str, year: int = 2024, round_number: int = Query(8, alias="round")):
    return safe(lambda: {"answer": str(next(r for r in results(year, round_number)[1]
                                             if r["driver_id"] == driver_id.upper())),
                         "sources": ["FastF1 session results"]})

@router.post("/ai/strategy-analysis", tags=["AI Analyst"], summary="Generate strategy analysis")
def ai_strategy(year: int = 2024, round_number: int = Query(8, alias="round")):
    return {"answer": "Use /analytics/tyre-strategy for structured strategy evidence.",
            "sources": ["/api/v1/analytics/tyre-strategy"]}
