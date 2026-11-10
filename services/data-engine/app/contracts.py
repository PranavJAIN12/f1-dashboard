"""Response models for the race endpoints. They define the OpenAPI contract the frontend validates against."""
from typing import Literal

from pydantic import BaseModel

SessionCode = Literal["R", "Q", "S", "SQ", "FP1", "FP2", "FP3"]


class SessionRef(BaseModel):
    name: str
    type: str
    session_key: int


class SessionInfo(SessionRef):
    date_start: str
    date_end: str
    cancelled: bool


class RaceListItem(BaseModel):
    round: int
    meeting_key: int
    event_name: str
    country: str | None
    location: str | None
    circuit_image: str | None  # official track icon URL
    date_start: str
    date: str


class RacesResponse(BaseModel):
    year: int
    races: list[RaceListItem]


class RaceDetail(RaceListItem):
    year: int
    sessions: list[SessionInfo]


class RaceDetailResponse(BaseModel):
    race: RaceDetail
    sessions: list[SessionInfo]


class SessionRace(BaseModel):
    """Race identity echoed on every session-scoped response, including the resolved OpenF1 keys."""
    year: int
    round: int
    meeting_key: int
    event_name: str
    country: str | None
    location: str | None
    date: str
    session: SessionRef


class ResultRow(BaseModel):
    position: int | None
    driver_id: str
    abbreviation: str
    full_name: str | None
    headshot_url: str | None
    team: str | None
    grid: int | None
    points: float | None  # null when OpenF1 publishes no points for this session type
    status: str
    laps: int | None
    fastest_lap: float | None  # seconds
    result_time: float | None  # seconds: race time, or best qualifying lap


class ResultsResponse(BaseModel):
    race: SessionRace
    session: SessionCode
    results: list[ResultRow]


class DriversResponse(BaseModel):
    drivers: list[ResultRow]


class LapRow(BaseModel):
    driver_id: str
    driver: str
    lap_number: int
    lap_time_seconds: float | None
    compound: str | None
    stint: int | None
    tyre_life: int | None
    position: int | None
    sector_1: float | None
    sector_2: float | None
    sector_3: float | None
    i1_speed: float | None
    i2_speed: float | None
    speed_trap: float | None
    is_pit_out_lap: bool | None


class LapsResponse(BaseModel):
    race: SessionRace
    session: SessionCode
    laps: list[LapRow]


class PitStopRow(BaseModel):
    stop_number: int
    driver_id: str
    lap_number: int | None
    recorded_at: str  # UTC timestamp OpenF1 records for the stop (not defined as entry or exit)
    duration_seconds: float | None  # pit-lane time
    stationary_seconds: float | None  # available from the 2024 US GP onwards


class PitStopsResponse(BaseModel):
    race: SessionRace
    session: SessionCode
    pit_stops: list[PitStopRow]


class WeatherSample(BaseModel):
    Time: float  # seconds since session start
    AirTemp: float | None  # degrees C
    TrackTemp: float | None  # degrees C
    Humidity: float | None  # %
    Pressure: float | None  # mbar
    Rainfall: bool | None
    WindDirection: float | None  # degrees
    WindSpeed: float | None  # metres per second


class WeatherResponse(BaseModel):
    race: SessionRace
    session: SessionCode
    weather: list[WeatherSample]


class TelemetrySample(BaseModel):
    time_seconds: float | None  # since the lap started
    distance: float | None  # metres, integrated from speed, so approximate
    speed: float | None  # km/h
    throttle: float | None  # %
    brake: float | None  # 0 or 100
    gear: int | None
    rpm: float | None
    drs: int | None  # raw OpenF1 code: 10, 12 and 14 mean open
    x: float | None
    y: float | None


class TelemetryResponse(BaseModel):
    race: SessionRace
    session: SessionCode
    driver_id: str
    team: str | None
    team_colour: str | None  # #RRGGBB
    lap_number: int
    lap_time_seconds: float | None
    telemetry: list[TelemetrySample]  # empty when the lap has no usable timing


class TelemetryCompareResponse(BaseModel):
    driver_a: TelemetryResponse
    driver_b: TelemetryResponse


class TrackPoint(BaseModel):
    x: float | None
    y: float | None
    distance: float | None


class TrackResponse(BaseModel):
    race: SessionRace
    session: SessionCode
    driver: str
    lap: int
    points: list[TrackPoint]
