"""OpenF1 data access (https://openf1.org): historical data from 2023, no account needed.

Everything here is provider-specific. Routes only see validated, APEX-shaped data.
Live access requires a paid OpenF1 token and is deliberately not implemented.
"""
import hashlib
import json
import os
import ssl
import threading
import time
from bisect import bisect_right
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import quote

import httpx
import pandas as pd
import truststore
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError

from app import openf1_schemas as s

BASE_URL = os.getenv("OPENF1_BASE_URL", "https://api.openf1.org/v1")
CACHE = Path(os.getenv("OPENF1_CACHE_DIR", ".openf1-cache"))
CACHE.mkdir(parents=True, exist_ok=True)
FIRST_SEASON = 2023

# Documented free tier: 3 requests/s and 30 requests/min. Stay just under both.
MAX_PER_SECOND_GAP = 0.4
MAX_PER_MINUTE = 28
TIMEOUT = httpx.Timeout(20.0, connect=5.0)
MAX_ATTEMPTS = 3
MAX_RETRY_WAIT = 30.0
TRANSIENT_STATUS = {429, 500, 502, 503, 504}

# Data is "live" from 30 minutes before a session starts until 30 minutes after it ends (OpenF1 FAQ).
LIVE_MARGIN = timedelta(minutes=30)
# Calendars and session lists change (reschedules, cancellations) and are refreshed daily upstream.
CALENDAR_TTL = 3600
# Results of a finished session are final once published, so they are cached long.
HISTORICAL_TTL = 7 * 86400
# Just-finished sessions may still receive corrections; keep them short-lived.
RECENT_TTL = 600
RECENT_WINDOW = timedelta(days=2)

# OpenF1 names are the source of truth: sprint weekends report session_type "Race" for both
# the Sprint and the Race, so identity comes from session_name only.
SESSION_NAMES = {
    "R": ("Race",), "Q": ("Qualifying",), "S": ("Sprint",),
    "SQ": ("Sprint Qualifying", "Sprint Shootout"),
    "FP1": ("Practice 1",), "FP2": ("Practice 2",), "FP3": ("Practice 3",),
}
SESSION_CODES = {name.lower(): code for code, names in SESSION_NAMES.items() for name in names}

_lock = threading.Lock()
_calls = deque()
# The OS trust store covers corporate proxies whose CA is missing from Python's bundle.
_client = httpx.Client(verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT), timeout=TIMEOUT)


class ProviderError(HTTPException):
    """Upstream failure surfaced to the client as a gateway error with a machine-readable code."""

    def __init__(self, code, message, status=502, retry_after=None):
        headers = {"Retry-After": str(int(retry_after))} if retry_after else None
        super().__init__(status, {"code": code, "message": message}, headers=headers)


def not_found(message):
    return HTTPException(404, {"code": "not_found", "message": message})


def _now():
    return datetime.now(timezone.utc)


def _throttle():
    with _lock:
        while True:
            now = time.monotonic()
            while _calls and now - _calls[0] > 60:
                _calls.popleft()
            wait = 0.0
            if len(_calls) >= MAX_PER_MINUTE:
                wait = 60 - (now - _calls[0])
            elif _calls and now - _calls[-1] < MAX_PER_SECOND_GAP:
                wait = MAX_PER_SECOND_GAP - (now - _calls[-1])
            if wait <= 0:
                break
            time.sleep(wait)
        _calls.append(time.monotonic())


def _query(params):
    # Keys ending in an operator ("date>=") are sent as-is; OpenF1 reads filters from the raw query.
    parts = []
    for key, value in params.items():
        sep = "" if key[-1] in "<>=" else "="
        parts.append(f"{key}{sep}{quote(str(value), safe=':')}")
    return "&".join(parts)


def _retry_after(res):
    """Seconds from a Retry-After header (delta-seconds or HTTP date), or None."""
    raw = res.headers.get("Retry-After")
    if not raw:
        return None
    try:
        return max(0.0, float(raw))
    except ValueError:
        try:
            return max(0.0, (parsedate_to_datetime(raw) - _now()).total_seconds())
        except (TypeError, ValueError):
            return None


def _read_cache(path, ttl):
    try:
        cached = json.loads(path.read_text())
        if time.time() - cached["t"] < ttl:
            return cached["data"]
    except (OSError, ValueError, KeyError):
        pass
    return None


def _get_json(url):
    """GET with bounded retries for transient failures only. Returns [] for OpenF1's "No results"."""
    last = "no response"
    last_header = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        _throttle()
        wait = None
        try:
            res = _client.get(url)
        except httpx.TimeoutException:
            last, wait = "request timed out", 1.0 * attempt
        except httpx.HTTPError as exc:
            last, wait = f"network error ({type(exc).__name__})", 1.0 * attempt
        else:
            if res.status_code == 200:
                try:
                    return res.json()
                except ValueError:
                    raise ProviderError("upstream_malformed", "OpenF1 returned invalid JSON.")
            if res.status_code == 404:
                return []  # OpenF1 answers 404 {"detail": "No results found."} for an empty match.
            last = f"HTTP {res.status_code}"
            if res.status_code not in TRANSIENT_STATUS:
                raise ProviderError("upstream_error", f"OpenF1 returned {last}.")
            header = _retry_after(res)
            last_header = header
            if res.status_code == 429 and header is not None and header > MAX_RETRY_WAIT:
                raise ProviderError("upstream_rate_limited", "OpenF1 is rate limiting requests.",
                                    status=503, retry_after=header)
            wait = header if header is not None else 2.0 * attempt
        if attempt < MAX_ATTEMPTS:
            time.sleep(min(wait, MAX_RETRY_WAIT))
    code = "upstream_rate_limited" if last == "HTTP 429" else "upstream_unavailable"
    raise ProviderError(code, f"OpenF1 request failed after {MAX_ATTEMPTS} attempts ({last}).",
                        status=503 if code == "upstream_rate_limited" else 502,
                        retry_after=last_header or (30 if code == "upstream_rate_limited" else None))


def _validate(endpoint, model, raw):
    if not isinstance(raw, list):
        raise ProviderError("upstream_malformed", f"OpenF1 {endpoint} did not return a list.")
    try:
        return [model.model_validate(row) for row in raw]
    except ValidationError as exc:
        err = exc.errors()[0]
        where = ".".join(str(p) for p in err["loc"])
        raise ProviderError("upstream_malformed", f"OpenF1 {endpoint} payload failed validation at '{where}': {err['msg']}")


_flight_guard = threading.Lock()
_flights = {}


def fetch(endpoint, model: type[BaseModel], ttl=HISTORICAL_TTL, **params):
    """Fetch one OpenF1 endpoint and validate every row against `model`.

    Concurrent identical requests share one upstream call (single flight), which matters
    because the free tier allows only 30 requests per minute.
    """
    url = f"{BASE_URL}/{endpoint}?{_query(params)}"
    path = CACHE / (hashlib.sha1(url.encode()).hexdigest() + ".json")

    def cached():
        raw = _read_cache(path, ttl)
        if raw is None:
            return None
        try:
            return _validate(endpoint, model, raw)
        except ProviderError:
            return None  # A cached payload that no longer validates is treated as a miss.

    rows = cached()
    if rows is not None:
        return rows
    with _flight_guard:
        flight = _flights.setdefault(url, threading.Lock())
    try:
        with flight:
            rows = cached()  # Another request may have filled the cache while this one waited.
            if rows is not None:
                return rows
            raw = _get_json(url)
            rows = _validate(endpoint, model, raw)  # Only validated payloads are cached.
            try:
                path.write_text(json.dumps({"t": time.time(), "data": raw}))
            except OSError:
                pass
            return rows
    finally:
        with _flight_guard:
            _flights.pop(url, None)


# ---- Calendar and session identity ----
def _is_race_weekend(meeting, sessions):
    return not meeting.is_cancelled and any(x.session_name == "Race" and not x.is_cancelled for x in sessions)


def _weekends(year):
    """Race weekends of a season, ordered by date: [(meeting, [sessions])]. Round = 1-based index."""
    if year < FIRST_SEASON:
        raise not_found(f"OpenF1 only has data from {FIRST_SEASON} onwards.")
    meetings = fetch("meetings", s.Meeting, CALENDAR_TTL, year=year)
    by_meeting = defaultdict(list)
    for x in fetch("sessions", s.Session, CALENDAR_TTL, year=year):
        by_meeting[x.meeting_key].append(x)
    # A weekend is a meeting that actually has a Race session; testing and cancelled events do not.
    weekends = [(m, sorted(by_meeting[m.meeting_key], key=lambda x: x.date_start))
                for m in sorted(meetings, key=lambda m: m.date_start)
                if _is_race_weekend(m, by_meeting[m.meeting_key])]
    return weekends


def _weekend(year, round_number):
    weekends = _weekends(year)
    if not 1 <= round_number <= len(weekends):
        raise not_found(f"Round {round_number} does not exist for {year} (calendar has {len(weekends)} race weekends).")
    return weekends[round_number - 1]


def _event(meeting, round_number, sessions):
    return {
        "round": round_number, "meeting_key": meeting.meeting_key,
        "event_name": meeting.meeting_name, "country": meeting.country_name,
        "location": meeting.location,
        "date_start": meeting.date_start.isoformat(), "date": meeting.date_end.isoformat(),
        "sessions": [_session_info(x) for x in sessions],
    }


def _session_info(x):
    return {
        "name": x.session_name, "type": SESSION_CODES.get(x.session_name.lower(), x.session_name),
        "session_key": x.session_key, "date_start": x.date_start.isoformat(),
        "date_end": x.date_end.isoformat(), "cancelled": x.is_cancelled,
    }


def schedule(year):
    return [{k: v for k, v in _event(m, i, ss).items() if k != "sessions"}
            for i, (m, ss) in enumerate(_weekends(year), start=1)]


def race(year, round_number):
    meeting, sessions = _weekend(year, round_number)
    return {"year": year, **_event(meeting, round_number, sessions)}


def sessions(year, round_number):
    return race(year, round_number)["sessions"]


def _find_session(year, round_number, code):
    meeting, available = _weekend(year, round_number)
    key = str(code).upper()
    if key not in SESSION_NAMES:
        raise HTTPException(422, {"code": "invalid_session",
                                  "message": f"Unknown session '{code}'. Use one of {', '.join(SESSION_NAMES)}."})
    wanted = {n.lower() for n in SESSION_NAMES[key]}
    for x in available:
        if x.session_name.lower() in wanted:
            return meeting, x, available
    raise not_found(f"Round {round_number} of {year} has no {SESSION_NAMES[key][0]} session.")


def resolve(year, round_number, code="R"):
    """Resolve (season, round, session code) to OpenF1 identifiers, refusing unavailable sessions."""
    meeting, session, available = _find_session(year, round_number, code)
    now = _now()
    if session.is_cancelled:
        raise not_found(f"{session.session_name} of round {round_number} ({year}) was cancelled.")
    if now >= session.date_start - LIVE_MARGIN and now <= session.date_end + LIVE_MARGIN:
        raise HTTPException(409, {"code": "session_live",
                                  "message": f"{session.session_name} is live or about to start. Live data needs an authenticated OpenF1 plan and is not enabled."})
    if now < session.date_start:
        raise HTTPException(409, {"code": "session_not_started",
                                  "message": f"{session.session_name} has not taken place yet ({session.date_start.date()})."})
    return meeting, session, available


def _ttl(session):
    # Corrections can still land shortly after a session ends; older data is final.
    return RECENT_TTL if _now() - session.date_end < RECENT_WINDOW else HISTORICAL_TTL


def _race_ref(year, round_number, meeting, session):
    return {"year": year, "round": round_number, "meeting_key": meeting.meeting_key,
            "event_name": meeting.meeting_name, "country": meeting.country_name,
            "location": meeting.location, "date": meeting.date_end.isoformat(),
            "session": {"name": session.session_name, "type": SESSION_CODES.get(session.session_name.lower(), session.session_name),
                        "session_key": session.session_key}}


def _drivers(session):
    return {d.driver_number: d for d in fetch("drivers", s.Driver, _ttl(session), session_key=session.session_key)}


def _abbr(drivers, number):
    return (drivers.get(number).name_acronym if drivers.get(number) else None) or str(number)


def _stint_for(stints, lap_number):
    for st in stints:
        start = st.lap_start or 1
        end = st.lap_end
        # Red-flag restarts can report lap_end < lap_start; treat those as ending at their first lap.
        if end is None or end < start:
            end = start
        if start <= lap_number <= end:
            return st
    return None


def _first(value):
    """Qualifying reports one value per phase; the last non-null one is the deciding result."""
    if isinstance(value, list):
        return next((v for v in reversed(value) if v is not None), None)
    return value


# ---- Results ----
def results(year, round_number, code="R"):
    meeting, session, available = resolve(year, round_number, code)
    ttl = _ttl(session)
    key = session.session_key
    drivers = _drivers(session)

    best = {}
    for lap in fetch("laps", s.Lap, ttl, session_key=key):
        if lap.lap_duration:
            best[lap.driver_number] = min(lap.lap_duration, best.get(lap.driver_number, lap.lap_duration))

    grid, grid_source = {}, None
    if session.session_name in ("Race", "Sprint"):
        grid_session = "Qualifying" if session.session_name == "Race" else "Sprint Qualifying"
        qualifying = next((x for x in available if x.session_name == grid_session and not x.is_cancelled), None)
        if qualifying:
            grid = {g.driver_number: g.position
                    for g in fetch("starting_grid", s.StartingGrid, ttl, session_key=qualifying.session_key)}
            grid_source = grid_session

    # Race points come from the championship tables: points_current - points_start. They are only
    # published for race-type sessions, so everything else reports points as unavailable (null).
    points, points_available = {}, False
    if session.session_name in ("Race", "Sprint"):
        rows = fetch("championship_drivers", s.ChampionshipDriver, ttl, session_key=key)
        points_available = bool(rows)
        points = {r.driver_number: round((r.points_current or 0) - (r.points_start or 0), 2)
                  for r in rows if r.points_current is not None and r.points_start is not None}

    out = []
    for r in sorted(fetch("session_result", s.SessionResult, ttl, session_key=key),
                    key=lambda r: (r.position is None, r.position or 0)):
        d = drivers.get(r.driver_number)
        gap = _first(r.gap_to_leader)
        if r.dsq:
            status = "Disqualified"
        elif r.dns:
            status = "Did not start"
        elif r.dnf:
            status = "Retired"
        elif isinstance(gap, str):
            status = gap
        else:
            status = "Finished"
        out.append({
            "position": r.position,
            "driver_id": _abbr(drivers, r.driver_number),
            "abbreviation": _abbr(drivers, r.driver_number),
            "full_name": d.full_name if d else None,
            "headshot_url": d.headshot_url if d else None,
            "team": d.team_name if d else None,
            "grid": grid.get(r.driver_number),
            "points": points.get(r.driver_number) if points_available else None,
            "status": status,
            "laps": r.number_of_laps,
            "fastest_lap": best.get(r.driver_number),
            "result_time": _first(r.duration),
        })
    return _race_ref(year, round_number, meeting, session), out


# ---- Laps ----
def laps(year, round_number, code="R"):
    meeting, session, _ = resolve(year, round_number, code)
    ttl = _ttl(session)
    key = session.session_key
    drivers = _drivers(session)

    stints = defaultdict(list)
    for st in fetch("stints", s.Stint, ttl, session_key=key):
        stints[st.driver_number].append(st)

    timeline = defaultdict(lambda: ([], []))
    for p in sorted(fetch("position", s.Position, ttl, session_key=key), key=lambda p: p.date):
        times, values = timeline[p.driver_number]
        times.append(p.date.timestamp())
        values.append(p.position)

    out = []
    for lap in sorted(fetch("laps", s.Lap, ttl, session_key=key), key=lambda l: (l.driver_number, l.lap_number)):
        stint = _stint_for(stints[lap.driver_number], lap.lap_number)
        position = None
        if lap.date_start and lap.lap_duration:
            times, values = timeline[lap.driver_number]
            i = bisect_right(times, lap.date_start.timestamp() + lap.lap_duration) - 1
            position = values[i] if i >= 0 else None
        abbr = _abbr(drivers, lap.driver_number)
        out.append({
            "driver_id": abbr, "driver": abbr, "lap_number": lap.lap_number,
            "lap_time_seconds": lap.lap_duration,
            "compound": stint.compound if stint else None,
            "stint": stint.stint_number if stint else None,
            "tyre_life": ((stint.tyre_age_at_start or 0) + lap.lap_number - (stint.lap_start or 1) + 1) if stint else None,
            "position": position,
            "sector_1": lap.duration_sector_1, "sector_2": lap.duration_sector_2,
            "sector_3": lap.duration_sector_3,
            "i1_speed": lap.i1_speed, "i2_speed": lap.i2_speed,
            "speed_trap": lap.st_speed, "is_pit_out_lap": lap.is_pit_out_lap,
        })
    return _race_ref(year, round_number, meeting, session), out


# ---- Pit stops ----
def pit_stops(year, round_number, code="R"):
    meeting, session, _ = resolve(year, round_number, code)
    drivers = _drivers(session)
    stops = []
    for p in sorted(fetch("pit", s.Pit, _ttl(session), session_key=session.session_key), key=lambda p: p.date):
        lane = p.lane_duration if p.lane_duration is not None else p.pit_duration
        stops.append({
            "driver_id": _abbr(drivers, p.driver_number),
            "lap_number": p.lap_number,
            # OpenF1 does not define whether `date` is pit entry or exit; measured against lap data it
            # lands at roughly the end of the pit lane, so it is exposed as a recorded time only.
            "recorded_at": p.date.isoformat(),
            "duration_seconds": round(lane, 3) if lane is not None else None,
            "stationary_seconds": p.stop_duration,
        })
    stops.sort(key=lambda x: (x["lap_number"] is None, x["lap_number"] or 0, x["driver_id"]))
    for index, stop in enumerate(stops, start=1):
        stop["stop_number"] = index
    return _race_ref(year, round_number, meeting, session), stops


# ---- Telemetry ----
def telemetry(year, round_number, driver, lap, code="R"):
    meeting, session, _ = resolve(year, round_number, code)
    key, ttl = session.session_key, _ttl(session)
    number = next((n for n, d in _drivers(session).items() if (d.name_acronym or "").upper() == driver.upper()), None)
    if number is None:
        raise not_found(f"Driver '{driver}' did not take part in this session.")
    row = next((l for l in fetch("laps", s.Lap, ttl, session_key=key, driver_number=number) if l.lap_number == lap), None)
    if row is None:
        raise not_found(f"{driver.upper()} has no lap {lap} in this session.")
    if not row.date_start or not row.lap_duration:
        return []  # The lap exists but has no usable timing, so there is no window to fetch.

    start = row.date_start
    window = {"session_key": key, "driver_number": number,
              "date>=": start.isoformat(), "date<": (start + timedelta(seconds=row.lap_duration)).isoformat()}
    car = pd.DataFrame([c.model_dump() for c in fetch("car_data", s.CarData, ttl, **window)])
    if car.empty:
        return []
    car["date"] = pd.to_datetime(car["date"], utc=True)
    car = car.sort_values("date")
    seconds = (car["date"] - pd.Timestamp(start)).dt.total_seconds()
    step = car["date"].diff().dt.total_seconds().fillna(0)
    car["distance"] = (car["speed"].fillna(0) / 3.6 * step).cumsum()

    pos = pd.DataFrame([p.model_dump() for p in fetch("location", s.Location, ttl, **window)])
    if not pos.empty:
        pos["date"] = pd.to_datetime(pos["date"], utc=True)
        car = pd.merge_asof(car, pos[["date", "x", "y"]].sort_values("date"), on="date", direction="nearest")
    else:
        car["x"] = car["y"] = None

    def num(v):
        return None if v is None or pd.isna(v) else float(v)

    def whole(v):
        return None if v is None or pd.isna(v) else int(v)

    return [{
        "time_seconds": num(t), "distance": num(r["distance"]), "speed": num(r["speed"]),
        "throttle": num(r["throttle"]), "brake": num(r["brake"]),
        "gear": whole(r["n_gear"]), "rpm": num(r["rpm"]), "drs": whole(r["drs"]),
        "x": num(r["x"]), "y": num(r["y"]),
    } for t, (_, r) in zip(seconds, car.iterrows())]


# ---- Weather ----
def weather(year, round_number, code="R"):
    meeting, session, _ = resolve(year, round_number, code)
    start = session.date_start.timestamp()
    rows = [{
        "Time": round(w.date.timestamp() - start, 1),
        "AirTemp": w.air_temperature, "TrackTemp": w.track_temperature,
        "Humidity": w.humidity, "Pressure": w.pressure,
        "Rainfall": bool(w.rainfall) if w.rainfall is not None else None,
        "WindDirection": w.wind_direction,
        # OpenF1 reports metres per second; the key keeps its historical name for compatibility.
        "WindSpeed": w.wind_speed,
    } for w in sorted(fetch("weather", s.Weather, _ttl(session), session_key=session.session_key), key=lambda w: w.date)]
    return _race_ref(year, round_number, meeting, session), rows
