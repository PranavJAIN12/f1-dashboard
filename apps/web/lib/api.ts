// export async function api<T>(path: string): Promise<T> {
//   const base = process.env.DATA_ENGINE_URL ?? "http://localhost:8000";
//   const r = await fetch(`${base}/api/v1${path}`, { cache: "no-store" });
//   if (!r.ok) throw new Error(`API ${r.status}`);
//   return r.json();
// }
import { env } from "@/env";

export type RaceRef = {
    year: number;
    round: number;
    event_name: string;
    country: string | null;
    location: string | null;
    date: string | null;
};

export type RaceListItem = {
    round: number;
    event_name: string;
    country: string | null;
    location: string | null;
    date: string | null;
};

export type SessionInfo = { name: string; type: string };

export type PitStop = {
    stop_number?: number;
    driver_id?: string | null;
    lap_number?: number | null;
    pit_in_time?: string | null;
    pit_out_time?: string | null;
    duration_seconds?: number | null;
};

export type SessionResult = {
    position: number | null;
    driver_id: string;
    abbreviation: string;
    full_name: string;
    team: string;
    grid: number | null;
    points: number;
    status: string;
    laps: number | null;
    fastest_lap: number | null;
};

export type LapRow = {
    driver_id: string;
    driver: string;
    lap_number: number | null;
    lap_time_seconds: number | null;
    compound: string | null;
    stint: number | null;
    tyre_life: number | null;
    position: number | null;
};

export type WeatherSample = {
    Time?: number | string | null;
    AirTemp?: number | null;
    TrackTemp?: number | null;
    Humidity?: number | null;
    Pressure?: number | null;
    Rainfall?: boolean | null;
    WindDirection?: number | null;
    WindSpeed?: number | null;
};

export class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
    }
}

function baseUrl() {
    return env.DATA_ENGINE_URL;
}

export async function api<T>(path: string): Promise<T> {
    const normalized = path.startsWith("/api/v1")
        ? path
        : `/api/v1${path.startsWith("/") ? path : `/${path}`}`;
    return request<T>(normalized);
}

async function request<T>(path: string): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${baseUrl()}${path}`, { cache: "no-store" });
    } catch {
        throw new ApiError(
            "Can't reach the data engine. Start it with `uvicorn app.main:app --reload --port 8000`.",
        );
    }
    if (!res.ok) {
        let detail = "";
        try {
            const body = await res.json();
            detail = body?.detail ? ` — ${body.detail}` : "";
        } catch {
            /* ignore */
        }
        throw new ApiError(`Data engine returned ${res.status} for ${path}${detail}`, res.status);
    }
    return res.json() as Promise<T>;
}

// ---- Races list ----
export function getRaces(year: number) {
    return request<{ year: number; races: RaceListItem[] }>(`/api/v1/races?year=${year}`);
}

// ---- Race details: GET /races/{year}/{round} ----
export function getRaceDetails(year: number, round: number) {
    return request<{ race: RaceRef; sessions: SessionInfo[] }>(`/api/v1/races/${year}/${round}`);
}

// ---- Session results: GET /races/{year}/{round}/results ----
export function getRaceResults(year: number, round: number, session = "R") {
    return request<{ race: RaceRef; session: string; results: SessionResult[] }>(
        `/api/v1/races/${year}/${round}/results?session=${session}`,
    );
}

// ---- Lap data: GET /races/{year}/{round}/laps ----
export function getRaceLaps(year: number, round: number, session = "R") {
    return request<{ race: RaceRef; session: string; laps: LapRow[] }>(
        `/api/v1/races/${year}/${round}/laps?session=${session}`,
    );
}

// ---- Pit stops: GET /races/{year}/{round}/pit-stops ----
export function getRacePitStops(year: number, round: number) {
    return request<{ race: RaceRef; pit_stops: PitStop[]; note?: string }>(
        `/api/v1/races/${year}/${round}/pit-stops`,
    );
}

// ---- Weather: GET /races/{year}/{round}/weather ----
export function getRaceWeather(year: number, round: number, session = "R") {
    return request<{ race: RaceRef; session: string; weather: WeatherSample[] }>(
        `/api/v1/races/${year}/${round}/weather?session=${session}`,
    );
}

// ---- Session metadata: GET /races/{year}/{round}/sessions ----
export function getRaceSessions(year: number, round: number) {
    return request<{ race: RaceRef; sessions: SessionInfo[] }>(
        `/api/v1/races/${year}/${round}/sessions`,
    );
}

// ---- Formatting helpers ----
export function formatLapTime(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(3).padStart(6, "0");
    return `${m}:${s}`;
}

export function formatElapsed(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
