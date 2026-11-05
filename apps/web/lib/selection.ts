import { env } from "@/env";
import { sessionCodeSchema, type SessionCode, type SessionInfo } from "@/lib/schemas";

// The season the dashboard shows, from validated configuration so every page agrees.
export const DEFAULT_SEASON = env.DEFAULT_SEASON;

// OpenF1 has no data before this season; the data engine rejects earlier years too.
export const FIRST_SEASON = 2023;
const SEASON = /^\d{4}$/;

// Newest first. The current calendar year is included even if DEFAULT_SEASON lags behind it.
export function latestSeason(now = new Date()) {
    return Math.max(DEFAULT_SEASON, now.getUTCFullYear());
}

export function seasonOptions(now = new Date()): number[] {
    const latest = latestSeason(now);
    return Array.from({ length: latest - FIRST_SEASON + 1 }, (_, i) => latest - i);
}

export type SeasonSelection = { ok: true; season: number } | { ok: false; message: string };

// A missing value means "use the default"; a present but unusable one is an error to show the
// user, never silently replaced with another season.
export function parseSeason(value: string | string[] | undefined): SeasonSelection {
    if (value === undefined) return { ok: true, season: DEFAULT_SEASON };
    const raw = Array.isArray(value) ? value[0] : value;
    if (!SEASON.test(raw ?? ""))
        return {
            ok: false,
            message: `"${raw ?? ""}" is not a valid season. Use a four-digit year between ${FIRST_SEASON} and ${latestSeason()}.`,
        };
    const season = Number(raw);
    if (season < FIRST_SEASON)
        return {
            ok: false,
            message: `No data is available for ${season}. OpenF1 only provides data from ${FIRST_SEASON} onwards.`,
        };
    if (season > latestSeason())
        return {
            ok: false,
            message: `${season} is not available yet. The latest season is ${latestSeason()}.`,
        };
    return { ok: true, season };
}

const ROUND = /^\d{1,2}$/;

export function parseRound(value: string): number | null {
    if (!ROUND.test(value)) return null;
    const round = Number(value);
    return round >= 1 ? round : null;
}

export function parseSession(value: string | string[] | undefined): SessionCode | null {
    if (value === undefined) return "R";
    const parsed = sessionCodeSchema.safeParse(Array.isArray(value) ? value[0] : value);
    return parsed.success ? parsed.data : null;
}

// OpenF1 names are authoritative: sprint weekends report session_type "Race" for both the
// Sprint and the Race, so a session is identified by its name-derived code, never by type.
export function findSession(sessions: SessionInfo[], code: SessionCode) {
    return sessions.find((s) => s.type === code);
}

// Mirrors the data engine: OpenF1 treats data as live from 30 minutes before a session starts
// until 30 minutes after it ends, and live access needs a paid token that is not configured.
const LIVE_MARGIN_MS = 30 * 60_000;

export function sessionAvailability(session: SessionInfo, now = Date.now()) {
    if (session.cancelled) return "cancelled" as const;
    const start = Date.parse(session.date_start);
    const end = Date.parse(session.date_end);
    if (now < start - LIVE_MARGIN_MS) return "upcoming" as const;
    if (now <= end + LIVE_MARGIN_MS) return "live" as const;
    return "past" as const;
}

export type RaceStatus = "completed" | "live" | "next" | "upcoming";

// Only the first weekend that has not started is "next"; everything after it is "upcoming".
export function raceStatuses(
    races: { date_start: string; date: string }[],
    now = Date.now(),
): RaceStatus[] {
    let nextTaken = false;
    return races.map((race) => {
        if (now > Date.parse(race.date) + LIVE_MARGIN_MS) return "completed";
        if (now >= Date.parse(race.date_start) - LIVE_MARGIN_MS) return "live";
        if (nextTaken) return "upcoming";
        nextTaken = true;
        return "next";
    });
}
