"""Validation models for the OpenF1 responses APEX consumes (https://openf1.org/docs/).

Only consumed fields are declared and unknown fields are ignored. Fields OpenF1 may omit or
send as null are optional, so a new upstream field never breaks us but a changed type does.
"""
from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# OpenF1 documents every timestamp as UTC ISO 8601.
UtcDateTime = Annotated[datetime, AfterValidator(_utc)]


class _Row(BaseModel):
    model_config = ConfigDict(extra="ignore")


class Meeting(_Row):
    meeting_key: int
    meeting_name: str
    date_start: UtcDateTime
    date_end: UtcDateTime
    country_name: str | None = None
    location: str | None = None
    is_cancelled: bool = False


class Session(_Row):
    session_key: int
    meeting_key: int
    session_name: str
    date_start: UtcDateTime
    date_end: UtcDateTime
    is_cancelled: bool = False


class Driver(_Row):
    driver_number: int
    name_acronym: str | None = None
    full_name: str | None = None
    team_name: str | None = None
    headshot_url: str | None = None


class Lap(_Row):
    driver_number: int
    lap_number: int
    date_start: UtcDateTime | None = None
    lap_duration: float | None = None
    duration_sector_1: float | None = None
    duration_sector_2: float | None = None
    duration_sector_3: float | None = None
    i1_speed: float | None = None
    i2_speed: float | None = None
    st_speed: float | None = None
    is_pit_out_lap: bool | None = None


class Stint(_Row):
    driver_number: int
    stint_number: int | None = None
    lap_start: int | None = None
    lap_end: int | None = None
    compound: str | None = None
    tyre_age_at_start: int | None = None


class Position(_Row):
    driver_number: int
    date: UtcDateTime
    position: int


class Pit(_Row):
    driver_number: int
    date: UtcDateTime
    lap_number: int | None = None
    lane_duration: float | None = None
    pit_duration: float | None = None  # deprecated upstream alias of lane_duration
    stop_duration: float | None = None  # only available from the 2024 US GP onwards


class SessionResult(_Row):
    driver_number: int
    position: int | None = None
    number_of_laps: int | None = None
    dnf: bool | None = None
    dns: bool | None = None
    dsq: bool | None = None
    # Practice/race: a number. Qualifying: an array of three values for Q1-Q3.
    duration: float | list[float | None] | None = None
    # Number of seconds, "+N LAP(S)" when lapped, or an array in qualifying.
    gap_to_leader: float | str | list[float | str | None] | None = None


class StartingGrid(_Row):
    driver_number: int
    position: int | None = None


class ChampionshipDriver(_Row):
    driver_number: int
    points_start: float | None = None
    points_current: float | None = None


class Weather(_Row):
    date: UtcDateTime
    air_temperature: float | None = None  # degrees C
    track_temperature: float | None = None  # degrees C
    humidity: float | None = None  # %
    pressure: float | None = None  # mbar
    rainfall: float | None = None  # 0/1
    wind_direction: float | None = None  # degrees
    wind_speed: float | None = None  # m/s


class CarData(_Row):
    date: UtcDateTime
    speed: float | None = None  # km/h
    throttle: float | None = None
    brake: float | None = None
    n_gear: int | None = None
    rpm: float | None = None
    drs: int | None = None


class Location(_Row):
    date: UtcDateTime
    x: float | None = None
    y: float | None = None
