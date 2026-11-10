import type { z } from "zod";
import { env } from "@/env";
import {
    driversResponseSchema,
    errorBodySchema,
    lapsResponseSchema,
    pitStopsResponseSchema,
    raceDetailResponseSchema,
    racesResponseSchema,
    resultsResponseSchema,
    telemetryResponseSchema,
    weatherResponseSchema,
    type SessionCode,
} from "@/lib/schemas";

// Server-side transport to the FastAPI data engine. Only server components call this, so the
// engine URL (and any future credentials) never reach the browser.

export type EngineErrorKind =
    | "invalid_input" // The request was rejected as malformed (HTTP 422).
    | "not_found" // The season, round, session or driver does not exist.
    | "unavailable" // Valid selection, but the data cannot be served yet (not started, live, cancelled).
    | "rate_limited" // The upstream provider asked us to slow down.
    | "provider" // The upstream provider failed or is unreachable.
    | "engine" // The data engine itself failed or is unreachable.
    | "malformed" // The response was not JSON or did not match the contract.
    | "timeout"
    | "cancelled";

export class EngineError extends Error {
    constructor(
        readonly kind: EngineErrorKind,
        message: string,
        readonly options: { status?: number; code?: string; retryAfter?: number } = {},
    ) {
        super(message);
        this.name = "EngineError";
    }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: EngineError };

const REQUEST_TIMEOUT_MS = 45_000; // A cold session load makes several throttled upstream calls.
const MAX_ATTEMPTS = 2;
const MAX_RETRY_DELAY_MS = 10_000;

// Cache lifetimes in seconds. Finished sessions are final; recent ones may still be corrected.
export const REVALIDATE = {
    calendar: 3600,
    recentSession: 300,
    finishedSession: 86_400,
} as const;
const RECENT_WINDOW_MS = 2 * 86_400_000;

export function sessionRevalidate(dateEnd: string, now = Date.now()) {
    return now - Date.parse(dateEnd) < RECENT_WINDOW_MS
        ? REVALIDATE.recentSession
        : REVALIDATE.finishedSession;
}

function parseRetryAfter(header: string | null): number | undefined {
    if (!header) return undefined;
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds);
    const date = Date.parse(header);
    return Number.isNaN(date) ? undefined : Math.max(0, (date - Date.now()) / 1000);
}

function classify(status: number, body: unknown, retryAfter?: number): EngineError {
    const parsed = errorBodySchema.safeParse(body);
    const detail = parsed.success ? parsed.data.detail : undefined;
    const code =
        detail && typeof detail === "object" && !Array.isArray(detail) ? detail.code : undefined;
    const message =
        typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d.msg).join("; ")
              : (detail?.message ?? `The data engine returned HTTP ${status}.`);
    const options = { status, code, retryAfter };

    if (status === 422) return new EngineError("invalid_input", message, options);
    if (status === 404) return new EngineError("not_found", message, options);
    if (status === 409) return new EngineError("unavailable", message, options);
    if (status === 503 && code === "upstream_rate_limited")
        return new EngineError("rate_limited", message, options);
    if (code?.startsWith("upstream_")) return new EngineError("provider", message, options);
    return new EngineError("engine", message, options);
}

const sleep = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => (clearTimeout(timer), resolve()), { once: true });
    });

async function get<S extends z.ZodType>(
    path: string,
    schema: S,
    options: { revalidate: number; signal?: AbortSignal },
): Promise<Result<z.infer<S>>> {
    const url = `${env.DATA_ENGINE_URL}/api/v1${path}`;
    let last: EngineError | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const signals = [AbortSignal.timeout(REQUEST_TIMEOUT_MS)];
        if (options.signal) signals.push(options.signal);
        let response: Response;
        try {
            response = await fetch(url, {
                signal: AbortSignal.any(signals),
                next: { revalidate: options.revalidate },
            });
        } catch (cause) {
            if (options.signal?.aborted)
                return {
                    ok: false,
                    error: new EngineError("cancelled", "The request was cancelled."),
                };
            if (cause instanceof DOMException && cause.name === "TimeoutError")
                return {
                    ok: false,
                    error: new EngineError("timeout", "The data engine took too long to respond."),
                };
            // Connection refused/reset: the engine may be restarting, so one retry is reasonable.
            last = new EngineError("engine", "The data engine could not be reached.");
            if (attempt < MAX_ATTEMPTS) {
                await sleep(300 * attempt, options.signal);
                continue;
            }
            return { ok: false, error: last };
        }

        let body: unknown;
        try {
            body = await response.json();
        } catch {
            if (response.ok)
                return {
                    ok: false,
                    error: new EngineError("malformed", "The data engine returned invalid JSON.", {
                        status: response.status,
                    }),
                };
            body = undefined;
        }

        if (response.ok) {
            const parsed = schema.safeParse(body);
            if (parsed.success) return { ok: true, data: parsed.data };
            const issue = parsed.error.issues[0];
            return {
                ok: false,
                error: new EngineError(
                    "malformed",
                    `The data engine response did not match the expected contract at "${issue?.path.join(".") ?? "(root)"}".`,
                    { status: response.status },
                ),
            };
        }

        last = classify(
            response.status,
            body,
            parseRetryAfter(response.headers.get("Retry-After")),
        );
        // Only a rate-limit answer that says when to come back is worth another attempt: the
        // engine already retried the provider itself, so repeating other failures just adds load.
        const delay = last.options.retryAfter;
        if (
            last.kind === "rate_limited" &&
            delay !== undefined &&
            delay * 1000 <= MAX_RETRY_DELAY_MS &&
            attempt < MAX_ATTEMPTS
        ) {
            await sleep(delay * 1000, options.signal);
            continue;
        }
        return { ok: false, error: last };
    }
    return { ok: false, error: last ?? new EngineError("engine", "The request failed.") };
}

export const getRaces = (year: number) =>
    get(`/races?year=${year}`, racesResponseSchema, { revalidate: REVALIDATE.calendar });

export const getRaceDetail = (year: number, round: number) =>
    get(`/races/${year}/${round}`, raceDetailResponseSchema, { revalidate: REVALIDATE.calendar });

export const getDrivers = (year: number, round: number, dateEnd: string) =>
    get(`/drivers?year=${year}&round=${round}`, driversResponseSchema, {
        revalidate: sessionRevalidate(dateEnd),
    });

type SessionRequest = { revalidate: number; signal?: AbortSignal };
const sessionPath = (year: number, round: number, resource: string, session: SessionCode) =>
    `/races/${year}/${round}/${resource}?session=${session}`;

export const getResults = (year: number, round: number, session: SessionCode, o: SessionRequest) =>
    get(sessionPath(year, round, "results", session), resultsResponseSchema, o);

export const getPitStops = (year: number, round: number, session: SessionCode, o: SessionRequest) =>
    get(sessionPath(year, round, "pit-stops", session), pitStopsResponseSchema, o);

export const getLaps = (year: number, round: number, session: SessionCode, o: SessionRequest) =>
    get(sessionPath(year, round, "laps", session), lapsResponseSchema, o);

export const getWeather = (year: number, round: number, session: SessionCode, o: SessionRequest) =>
    get(sessionPath(year, round, "weather", session), weatherResponseSchema, o);

export const getTelemetry = (
    year: number,
    round: number,
    session: SessionCode,
    driver: string,
    lap: number,
    o: SessionRequest,
) =>
    get(
        `/telemetry/${encodeURIComponent(driver)}?year=${year}&round=${round}&session=${session}&lap=${lap}`,
        telemetryResponseSchema,
        o,
    );
