"""OpenF1 data access (https://openf1.org): free historical data from 2023, no account."""
import hashlib
import json
import os
import ssl
import threading
import time
from bisect import bisect_right
from collections import defaultdict, deque
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote

import httpx
import pandas as pd
import truststore
from fastapi import HTTPException

BASE_URL = os.getenv("OPENF1_BASE_URL", "https://api.openf1.org/v1")
CACHE = Path(os.getenv("OPENF1_CACHE_DIR", ".openf1-cache"))
CACHE.mkdir(parents=True, exist_ok=True)
FIRST_SEASON = 2023
SHORT_TTL = 3600
LONG_TTL = 86400

SESSION_NAMES = {
    "R": ("Race",), "Q": ("Qualifying",), "S": ("Sprint",),
    "SQ": ("Sprint Qualifying", "Sprint Shootout"),
    "FP1": ("Practice 1",), "FP2": ("Practice 2",), "FP3": ("Practice 3",),
}
SESSION_CODES = {name.lower(): code for code, names in SESSION_NAMES.items() for name in names}

_lock = threading.Lock()
_calls = deque()
# The OS trust store covers corporate proxies whose CA is missing from Python's bundle.
_client = httpx.Client(verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT), timeout=30)


def _throttle():
    # Free tier: 3 requests/s and 30 requests/min.
    with _lock:
        while True:
            now = time.monotonic()
            while _calls and now - _calls[0] > 60:
                _calls.popleft()
            wait = 0.0
            if len(_calls) >= 28:
                wait = 60 - (now - _calls[0])
            elif _calls and now - _calls[-1] < 0.4:
                wait = 0.4 - (now - _calls[-1])
            if wait <= 0:
                break
            time.sleep(wait)
        _calls.append(time.monotonic())


def _query(params):
    # Keys ending in an operator ("date>=") are sent as-is; the API reads filters from the raw query.
    parts = []
    for key, value in params.items():
        sep = "" if key[-1] in "<>=" else "="
        parts.append(f"{key}{sep}{quote(str(value), safe=':')}")
    return "&".join(parts)


def fetch(endpoint, ttl=LONG_TTL, **params):
    url = f"{BASE_URL}/{endpoint}?{_query(params)}"
    path = CACHE / (hashlib.sha1(url.encode()).hexdigest() + ".json")
    try:
        cached = json.loads(path.read_text())
        if time.time() - cached["t"] < ttl:
            return cached["data"]
    except (OSError, ValueError, KeyError):
        pass

    res = None
    for attempt in range(4):
        _throttle()
        try:
            res = _client.get(url)
        except httpx.HTTPError as exc:
            raise HTTPException(502, f"OpenF1 unreachable: {exc}")
        if res.status_code != 429:
            break
        time.sleep(2 * (attempt + 1))

    if res.status_code == 404:
        return []  # OpenF1 answers 404 when a query matches nothing.
    if res.status_code != 200:
        raise HTTPException(502, f"OpenF1 returned {res.status_code}: {res.text[:200]}")
    data = res.json()
    path.write_text(json.dumps({"t": time.time(), "data": data}))
    return data


def _ts(value):
    return datetime.fromisoformat(value).timestamp()


# ---- Calendar ----
def _meetings(year):
    if year < FIRST_SEASON:
        raise HTTPException(404, f"OpenF1 only has data from {FIRST_SEASON} onwards.")
    rows = fetch("meetings", SHORT_TTL, year=year)
    rows = [m for m in rows if "test" not in m["meeting_name"].lower() and not m.get("is_cancelled")]
    return sorted(rows, key=lambda m: m["date_start"])


def _meeting(year, round_number):
    meetings = _meetings(year)
    if not 1 <= int(round_number) <= len(meetings):
        raise HTTPException(404, f"Round {round_number} not found for {year}.")
    return meetings[int(round_number) - 1]


def _event(meeting, round_number):
    return {
        "round": int(round_number), "event_name": meeting["meeting_name"],
        "country": meeting.get("country_name"), "location": meeting.get("location"),
        "date": meeting.get("date_end"),
    }


def schedule(year):
    return [_event(m, i) for i, m in enumerate(_meetings(year), start=1)]


def race(year, event):
    return {"year": year, **_event(_meeting(year, event), event)}


def _session(year, event, code="R"):
    meeting = _meeting(year, event)
    wanted = {n.lower() for n in SESSION_NAMES.get(str(code).upper(), (str(code),))}
    for s in fetch("sessions", SHORT_TTL, meeting_key=meeting["meeting_key"]):
        if s["session_name"].lower() in wanted:
            return s
    raise HTTPException(404, f"Session '{code}' not found for {year} round {event}.")


def sessions(year, event):
    meeting = _meeting(year, event)
    rows = sorted(fetch("sessions", SHORT_TTL, meeting_key=meeting["meeting_key"]), key=lambda s: s["date_start"])
    return [{"name": s["session_name"], "type": SESSION_CODES.get(s["session_name"].lower(), s["session_name"])}
            for s in rows]


def _drivers(session_key):
    return {d["driver_number"]: d for d in fetch("drivers", session_key=session_key)}


def _abbr(drivers, number):
    return (drivers.get(number) or {}).get("name_acronym") or str(number)


def _stint_for(stints, lap_number):
    for st in stints:
        start, end = st.get("lap_start") or 1, st.get("lap_end")
        # Red-flag restarts can report lap_end=0; treat those as ending at their first lap.
        if end is None or end < start:
            end = start
        if start <= lap_number <= end:
            return st
    return None


# ---- Results ----
def results(year, event, session="R"):
    s = _session(year, event, session)
    key = s["session_key"]
    drivers = _drivers(key)

    best = {}
    for lap in fetch("laps", session_key=key):
        t = lap.get("lap_duration")
        if t:
            best[lap["driver_number"]] = min(t, best.get(lap["driver_number"], t))

    grid = {}
    if s["session_name"] in ("Race", "Sprint"):
        grid_session = "Qualifying" if s["session_name"] == "Race" else "Sprint Qualifying"
        meeting_sessions = fetch("sessions", SHORT_TTL, meeting_key=s["meeting_key"])
        qualifying = next((x for x in meeting_sessions if x["session_name"] == grid_session), None)
        if qualifying:
            grid = {g["driver_number"]: g["position"]
                    for g in fetch("starting_grid", session_key=qualifying["session_key"])}

    out = []
    for r in sorted(fetch("session_result", session_key=key),
                    key=lambda r: (r.get("position") is None, r.get("position") or 0)):
        number = r["driver_number"]
        d = drivers.get(number, {})
        gap = r.get("gap_to_leader")
        if r.get("dsq"):
            status = "Disqualified"
        elif r.get("dns"):
            status = "Did not start"
        elif r.get("dnf"):
            status = "Retired"
        elif isinstance(gap, str):
            status = gap
        else:
            status = "Finished"
        out.append({
            "position": r.get("position"),
            "driver_id": _abbr(drivers, number),
            "abbreviation": _abbr(drivers, number),
            "full_name": d.get("full_name"),
            "team": d.get("team_name"),
            "grid": grid.get(number),
            "points": r.get("points") or 0,
            "status": status,
            "laps": r.get("number_of_laps"),
            "fastest_lap": best.get(number),
        })
    return s, out


# ---- Laps ----
def laps(year, event, session="R"):
    s = _session(year, event, session)
    key = s["session_key"]
    drivers = _drivers(key)

    stints = defaultdict(list)
    for st in fetch("stints", session_key=key):
        stints[st["driver_number"]].append(st)

    timeline = defaultdict(lambda: ([], []))
    for p in sorted(fetch("position", session_key=key), key=lambda p: p["date"]):
        times, values = timeline[p["driver_number"]]
        times.append(_ts(p["date"]))
        values.append(p["position"])

    out = []
    for lap in sorted(fetch("laps", session_key=key), key=lambda l: (l["driver_number"], l["lap_number"])):
        number, n = lap["driver_number"], lap["lap_number"]
        stint = _stint_for(stints[number], n)
        position = None
        if lap.get("date_start") and lap.get("lap_duration"):
            times, values = timeline[number]
            i = bisect_right(times, _ts(lap["date_start"]) + lap["lap_duration"]) - 1
            position = values[i] if i >= 0 else None
        abbr = _abbr(drivers, number)
        out.append({
            "driver_id": abbr, "driver": abbr, "lap_number": n,
            "lap_time_seconds": lap.get("lap_duration"),
            "compound": stint.get("compound") if stint else None,
            "stint": stint.get("stint_number") if stint else None,
            "tyre_life": (stint.get("tyre_age_at_start") or 0) + n - (stint.get("lap_start") or 1) + 1 if stint else None,
            "position": position,
            "sector_1": lap.get("duration_sector_1"), "sector_2": lap.get("duration_sector_2"),
            "sector_3": lap.get("duration_sector_3"),
            "i1_speed": lap.get("i1_speed"), "i2_speed": lap.get("i2_speed"),
            "speed_trap": lap.get("st_speed"), "is_pit_out_lap": lap.get("is_pit_out_lap"),
        })
    return s, out


# ---- Pit stops ----
def pit_stops(year, event):
    s = _session(year, event, "R")
    drivers = _drivers(s["session_key"])
    stops = []
    for p in sorted(fetch("pit", session_key=s["session_key"]), key=lambda p: p["date"]):
        lane = p.get("lane_duration") if p.get("lane_duration") is not None else p.get("pit_duration")
        entered = datetime.fromisoformat(p["date"])
        stops.append({
            "driver_id": _abbr(drivers, p["driver_number"]),
            "lap_number": p.get("lap_number"),
            "pit_in_time": entered.isoformat(),
            "pit_out_time": (entered + timedelta(seconds=lane)).isoformat() if lane is not None else None,
            "duration_seconds": round(lane, 3) if lane is not None else None,
            "stationary_seconds": p.get("stop_duration"),
        })
    stops.sort(key=lambda x: (x["lap_number"] is None, x["lap_number"] or 0, x["driver_id"]))
    for index, stop in enumerate(stops, start=1):
        stop["stop_number"] = index
    return s, stops


# ---- Telemetry ----
def telemetry(year, event, driver, lap, session="R"):
    s = _session(year, event, session)
    key = s["session_key"]
    number = next((n for n, d in _drivers(key).items() if d.get("name_acronym") == driver.upper()), None)
    if number is None:
        return []
    row = next((l for l in fetch("laps", session_key=key, driver_number=number) if l["lap_number"] == lap), None)
    if not row or not row.get("date_start") or not row.get("lap_duration"):
        return []

    start = datetime.fromisoformat(row["date_start"])
    window = {"session_key": key, "driver_number": number,
              "date>=": start.isoformat(), "date<": (start + timedelta(seconds=row["lap_duration"])).isoformat()}
    car = pd.DataFrame(fetch("car_data", **window))
    if car.empty:
        return []
    car["date"] = pd.to_datetime(car["date"], format="ISO8601")
    car = car.sort_values("date")
    seconds = (car["date"] - start).dt.total_seconds()
    step = car["date"].diff().dt.total_seconds().fillna(0)
    car["distance"] = (car["speed"] / 3.6 * step).cumsum()

    pos = pd.DataFrame(fetch("location", **window))
    if not pos.empty:
        pos["date"] = pd.to_datetime(pos["date"], format="ISO8601")
        car = pd.merge_asof(car, pos[["date", "x", "y"]].sort_values("date"), on="date", direction="nearest")
    else:
        car["x"] = car["y"] = None

    def num(v):
        return None if pd.isna(v) else float(v)

    return [{
        "time_seconds": num(t), "distance": num(r["distance"]), "speed": num(r["speed"]),
        "throttle": num(r["throttle"]), "brake": num(r["brake"]),
        "gear": int(r["n_gear"]), "rpm": num(r["rpm"]), "drs": int(r["drs"]),
        "x": num(r["x"]), "y": num(r["y"]),
    } for t, (_, r) in zip(seconds, car.iterrows())]


# ---- Weather ----
def weather(year, event, session="R"):
    s = _session(year, event, session)
    start = _ts(s["date_start"])
    rows = [{
        "Time": round(_ts(w["date"]) - start, 1),
        "AirTemp": w.get("air_temperature"), "TrackTemp": w.get("track_temperature"),
        "Humidity": w.get("humidity"), "Pressure": w.get("pressure"),
        "Rainfall": bool(w["rainfall"]) if w.get("rainfall") is not None else None,
        "WindDirection": w.get("wind_direction"), "WindSpeed": w.get("wind_speed"),
    } for w in sorted(fetch("weather", session_key=s["session_key"]), key=lambda w: w["date"])]
    return s, rows
