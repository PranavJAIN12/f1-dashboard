from pathlib import Path
import os
import pandas as pd
import fastf1

CACHE = os.getenv("FASTF1_CACHE_DIR", ".fastf1-cache")
Path(CACHE).mkdir(parents=True, exist_ok=True)
fastf1.Cache.enable_cache(CACHE)

def clean(v):
    if v is None: return None
    try:
        if pd.isna(v): return None
    except Exception: pass
    try: return v.item()
    except Exception: return v

def integer(v):
    v = clean(v)
    try: return int(v) if v is not None else None
    except Exception: return None

def number(v):
    v = clean(v)
    try: return float(v) if v is not None else None
    except Exception: return None

def seconds(v):
    v = clean(v)
    if v is None: return None
    try: return v.total_seconds()
    except Exception: return number(v)

def load(year, event, session="R", telemetry=False, weather=False):
    s = fastf1.get_session(year, event, session)
    s.load(telemetry=telemetry, weather=weather, messages=False)
    return s

def race(year, event):
    s = load(year, event, "R")
    e = s.event
    d = clean(e.get("EventDate"))
    return {
        "year": year, "round": integer(e.get("RoundNumber")),
        "event_name": clean(e.get("EventName")) or clean(e.get("OfficialEventName")),
        "country": clean(e.get("Country")), "location": clean(e.get("Location")),
        "date": d.isoformat() if hasattr(d, "isoformat") else d
    }

def results(year, event, session="R"):
    s = load(year, event, session)
    out = []
    for _, r in s.results.iterrows():
        out.append({
            "position": integer(r.get("Position")),
            "driver_id": clean(r.get("Abbreviation")),
            "abbreviation": clean(r.get("Abbreviation")),
            "full_name": clean(r.get("FullName")),
            "team": clean(r.get("TeamName")),
            "grid": integer(r.get("GridPosition")),
            "points": number(r.get("Points")) or 0,
            "status": clean(r.get("Status")),
            "laps": integer(r.get("Laps")),
            "fastest_lap": seconds(r.get("FastestLapTime"))
        })
    return s, out

def laps(year, event, session="R"):
    s = load(year, event, session)
    out = []
    for _, r in s.laps.iterrows():
        out.append({
            "driver_id": clean(r.get("Driver")),
            "driver": clean(r.get("Driver")),
            "lap_number": integer(r.get("LapNumber")),
            "lap_time_seconds": seconds(r.get("LapTime")),
            "compound": clean(r.get("Compound")),
            "stint": integer(r.get("Stint")),
            "tyre_life": integer(r.get("TyreLife")),
            "position": integer(r.get("Position"))
        })
    return s, out

def pit_stops(year, event):
    """Extract pit-stop events by pairing each driver's pit-in and pit-out laps."""
    s = load(year, event, "R")
    frame = s.laps.copy()
    required = {"Driver", "LapNumber"}
    if not required.issubset(frame.columns):
        return s, []

    stops = []
    for driver, driver_laps in frame.groupby("Driver", dropna=True):
        pending_in = None
        driver_laps = driver_laps.sort_values("LapNumber")
        for _, row in driver_laps.iterrows():
            pit_in = clean(row.get("PitInTime")) if "PitInTime" in frame.columns else None
            pit_out = clean(row.get("PitOutTime")) if "PitOutTime" in frame.columns else None
            lap_number = integer(row.get("LapNumber"))

            if pit_in is not None:
                pending_in = {"time": pit_in, "lap": lap_number}
            if pit_out is not None and pending_in is not None:
                duration = seconds(pit_out - pending_in["time"])
                if duration is not None and duration >= 0:
                    stops.append({
                        "driver_id": clean(driver),
                        "lap_number": pending_in["lap"] or lap_number,
                        "pit_in_time": pending_in["time"].isoformat() if hasattr(pending_in["time"], "isoformat") else str(pending_in["time"]),
                        "pit_out_time": pit_out.isoformat() if hasattr(pit_out, "isoformat") else str(pit_out),
                        "duration_seconds": round(duration, 3),
                    })
                pending_in = None

    stops.sort(key=lambda stop: (stop["lap_number"] is None, stop["lap_number"] or 0, stop["driver_id"] or ""))
    for index, stop in enumerate(stops, start=1):
        stop["stop_number"] = index
    return s, stops

def telemetry(year, event, driver, lap):
    s = load(year, event, "R", telemetry=True)
    selected = s.laps.pick_drivers(driver).pick_laps(lap)
    if selected.empty: return []
    car = selected.get_car_data().add_distance()
    pos = selected.get_pos_data()
    if not pos.empty:
        car = pd.merge_asof(car.sort_values("Time"), pos.sort_values("Time"), on="Time", direction="nearest")
    return [{
        "distance": number(r.get("Distance")), "speed": number(r.get("Speed")),
        "throttle": number(r.get("Throttle")), "brake": number(r.get("Brake")),
        "gear": integer(r.get("nGear")), "rpm": number(r.get("RPM")),
        "drs": integer(r.get("DRS")), "x": number(r.get("X")), "y": number(r.get("Y"))
    } for _, r in car.iterrows()]

def weather(year, event, session="R"):
    s = load(year, event, session, weather=True)
    rows = []
    for _, row in s.weather_data.iterrows():
        time_value = clean(row.get("Time"))
        if hasattr(time_value, "total_seconds"):
            time_value = time_value.total_seconds()
        elif hasattr(time_value, "isoformat"):
            time_value = time_value.isoformat()
        rows.append({
            "Time": time_value,
            "AirTemp": number(row.get("AirTemp")),
            "TrackTemp": number(row.get("TrackTemp")),
            "Humidity": number(row.get("Humidity")),
            "Pressure": number(row.get("Pressure")),
            "Rainfall": bool(clean(row.get("Rainfall"))) if clean(row.get("Rainfall")) is not None else None,
            "WindDirection": number(row.get("WindDirection")),
            "WindSpeed": number(row.get("WindSpeed")),
        })
    return s, rows
