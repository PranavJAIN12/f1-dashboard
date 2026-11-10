import { z } from "zod";

// Mirrors the FastAPI response models in services/data-engine/app/contracts.py.
// Types are inferred from these schemas; do not declare parallel interfaces.

const timestamp = z.iso.datetime({ offset: true });

// Only the F1 media host is allowed (next.config.ts); anything else is dropped, not rendered.
const circuitImage = z
    .url({ protocol: /^https$/, hostname: /^media\.formula1\.com$/ })
    .nullable()
    .catch(null);
const hexColour = z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .catch(null);

export const sessionCodeSchema = z.enum(["R", "Q", "S", "SQ", "FP1", "FP2", "FP3"]);
export type SessionCode = z.infer<typeof sessionCodeSchema>;

export const sessionRefSchema = z.object({
    name: z.string(),
    type: z.string(),
    session_key: z.number().int(),
});

export const sessionInfoSchema = sessionRefSchema.extend({
    date_start: timestamp,
    date_end: timestamp,
    cancelled: z.boolean(),
});
export type SessionInfo = z.infer<typeof sessionInfoSchema>;

export const raceListItemSchema = z.object({
    round: z.number().int(),
    meeting_key: z.number().int(),
    event_name: z.string(),
    country: z.string().nullable(),
    location: z.string().nullable(),
    circuit_image: circuitImage,
    date_start: timestamp,
    date: timestamp,
});
export type RaceListItem = z.infer<typeof raceListItemSchema>;

export const racesResponseSchema = z.object({
    year: z.number().int(),
    races: z.array(raceListItemSchema),
});

export const raceDetailSchema = raceListItemSchema.extend({
    year: z.number().int(),
    sessions: z.array(sessionInfoSchema),
});
export type RaceDetail = z.infer<typeof raceDetailSchema>;

export const raceDetailResponseSchema = z.object({
    race: raceDetailSchema,
    sessions: z.array(sessionInfoSchema),
});

const sessionRaceSchema = z.object({
    year: z.number().int(),
    round: z.number().int(),
    meeting_key: z.number().int(),
    event_name: z.string(),
    country: z.string().nullable(),
    location: z.string().nullable(),
    date: timestamp,
    session: sessionRefSchema,
});
export type SessionRace = z.infer<typeof sessionRaceSchema>;

export const resultRowSchema = z.object({
    position: z.number().int().nullable(),
    driver_id: z.string(),
    abbreviation: z.string(),
    full_name: z.string().nullable(),
    headshot_url: z.string().nullable(),
    team: z.string().nullable(),
    grid: z.number().int().nullable(),
    points: z.number().nullable(),
    status: z.string(),
    laps: z.number().int().nullable(),
    fastest_lap: z.number().nullable(),
    result_time: z.number().nullable(),
});
export type SessionResult = z.infer<typeof resultRowSchema>;

export const resultsResponseSchema = z.object({
    race: sessionRaceSchema,
    session: sessionCodeSchema,
    results: z.array(resultRowSchema),
});

export const driversResponseSchema = z.object({ drivers: z.array(resultRowSchema) });

export const lapRowSchema = z.object({
    driver_id: z.string(),
    driver: z.string(),
    lap_number: z.number().int(),
    lap_time_seconds: z.number().nullable(),
    compound: z.string().nullable(),
    stint: z.number().int().nullable(),
    tyre_life: z.number().int().nullable(),
    position: z.number().int().nullable(),
    sector_1: z.number().nullable(),
    sector_2: z.number().nullable(),
    sector_3: z.number().nullable(),
    i1_speed: z.number().nullable(),
    i2_speed: z.number().nullable(),
    speed_trap: z.number().nullable(),
    is_pit_out_lap: z.boolean().nullable(),
});
export type LapRow = z.infer<typeof lapRowSchema>;

export const lapsResponseSchema = z.object({
    race: sessionRaceSchema,
    session: sessionCodeSchema,
    laps: z.array(lapRowSchema),
});

export const pitStopRowSchema = z.object({
    stop_number: z.number().int(),
    driver_id: z.string(),
    lap_number: z.number().int().nullable(),
    recorded_at: timestamp,
    duration_seconds: z.number().nullable(),
    stationary_seconds: z.number().nullable(),
});
export type PitStop = z.infer<typeof pitStopRowSchema>;

export const pitStopsResponseSchema = z.object({
    race: sessionRaceSchema,
    session: sessionCodeSchema,
    pit_stops: z.array(pitStopRowSchema),
});

export const weatherSampleSchema = z.object({
    Time: z.number(),
    AirTemp: z.number().nullable(),
    TrackTemp: z.number().nullable(),
    Humidity: z.number().nullable(),
    Pressure: z.number().nullable(),
    Rainfall: z.boolean().nullable(),
    WindDirection: z.number().nullable(),
    WindSpeed: z.number().nullable(),
});
export type WeatherSample = z.infer<typeof weatherSampleSchema>;

export const weatherResponseSchema = z.object({
    race: sessionRaceSchema,
    session: sessionCodeSchema,
    weather: z.array(weatherSampleSchema),
});

export const telemetrySampleSchema = z.object({
    time_seconds: z.number().nullable(),
    distance: z.number().nullable(),
    speed: z.number().nullable(),
    throttle: z.number().nullable(),
    brake: z.number().nullable(),
    gear: z.number().int().nullable(),
    rpm: z.number().nullable(),
    drs: z.number().int().nullable(),
    x: z.number().nullable(),
    y: z.number().nullable(),
});
export type TelemetrySample = z.infer<typeof telemetrySampleSchema>;

export const telemetryResponseSchema = z.object({
    race: sessionRaceSchema,
    session: sessionCodeSchema,
    driver_id: z.string(),
    team: z.string().nullable(),
    team_colour: hexColour,
    lap_number: z.number().int(),
    lap_time_seconds: z.number().nullable(),
    telemetry: z.array(telemetrySampleSchema),
});
export type LapTelemetry = z.infer<typeof telemetryResponseSchema>;

// Shape of FastAPI error bodies: our own {code, message} or FastAPI's 422 validation list.
export const errorBodySchema = z.object({
    detail: z.union([
        z.object({ code: z.string(), message: z.string() }),
        z.array(z.object({ msg: z.string() }).passthrough()),
        z.string(),
    ]),
});
