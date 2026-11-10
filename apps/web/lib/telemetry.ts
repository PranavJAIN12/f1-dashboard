import type { LapRow, TelemetrySample } from "@/lib/schemas";

export type Slot = "a" | "b";
export type Metric = "speed" | "throttle" | "brake" | "gear" | "rpm" | "drs" | "time" | "x" | "y";
// One row per point along the lap: `distance`, `delta`, and `<metric>_<slot>` for each driver.
export type Row = Record<string, number | null>;

export const field = (metric: Metric, slot: Slot) => `${metric}_${slot}`;

export type Trace = {
    slot: Slot;
    driver: string;
    team: string | null;
    colour: string;
    lap: number;
    lapTime: number | null;
    samples: TelemetrySample[];
};

const GRID_POINTS = 300;
// OpenF1 DRS codes 10, 12 and 14 mean the flap is open.
const DRS_OPEN = new Set([10, 12, 14]);

type Point = { d: number; t: number; s: TelemetrySample };

function usable(samples: TelemetrySample[]): Point[] {
    const points: Point[] = [];
    for (const s of samples) {
        if (s.distance === null || s.time_seconds === null) continue;
        if (points.length && s.distance < points[points.length - 1].d) continue;
        points.push({ d: s.distance, t: s.time_seconds, s });
    }
    return points;
}

function resample(points: Point[], scale: number, grid: number[], slot: Slot, rows: Row[]) {
    const ds = points.map((p) => p.d * scale);
    const last = points.length - 1;
    let j = 0;
    grid.forEach((d, i) => {
        while (j < last && ds[j + 1] <= d) j++;
        const next = Math.min(j + 1, last);
        const span = ds[next] - ds[j];
        const f = span > 0 ? Math.min(1, Math.max(0, (d - ds[j]) / span)) : 0;
        const from = points[j];
        const to = points[next];
        const lerp = (get: (s: TelemetrySample) => number | null) => {
            const a = get(from.s);
            const b = get(to.s);
            return a === null || b === null ? a : a + (b - a) * f;
        };
        const row = rows[i];
        row[field("speed", slot)] = lerp((s) => s.speed);
        row[field("throttle", slot)] = lerp((s) => s.throttle);
        row[field("rpm", slot)] = lerp((s) => s.rpm);
        row[field("x", slot)] = lerp((s) => s.x);
        row[field("y", slot)] = lerp((s) => s.y);
        row[field("time", slot)] = from.t + (to.t - from.t) * f;
        // Discrete signals hold their last sampled value instead of blending between states.
        row[field("gear", slot)] = from.s.gear;
        row[field("brake", slot)] = from.s.brake === null ? null : from.s.brake > 0 ? 100 : 0;
        row[field("drs", slot)] = from.s.drs === null ? null : DRS_OPEN.has(from.s.drs) ? 1 : 0;
    });
}

// Distance comes from integrating speed, so two laps of the same circuit end a little apart.
// The second lap is stretched to the first lap's length so corners line up on the shared axis.
export function buildComparison(traces: Trace[]): { rows: Row[]; slots: Slot[] } | null {
    const prepared = traces
        .map((trace) => ({ trace, points: usable(trace.samples) }))
        .filter((p) => p.points.length >= 2);
    const reference = prepared.find((p) => p.trace.slot === "a");
    if (!reference) return null;

    const length = reference.points[reference.points.length - 1].d;
    if (length <= 0) return null;
    const grid = Array.from({ length: GRID_POINTS }, (_, i) => (length * i) / (GRID_POINTS - 1));
    const rows: Row[] = grid.map((distance) => ({ distance, delta: null }));

    for (const { trace, points } of prepared) {
        const end = points[points.length - 1].d;
        resample(points, trace.slot === "a" || end <= 0 ? 1 : length / end, grid, trace.slot, rows);
    }
    if (prepared.some((p) => p.trace.slot === "b")) {
        for (const row of rows) {
            const a = row[field("time", "a")];
            const b = row[field("time", "b")];
            row.delta = a === null || b === null ? null : b - a;
        }
    }
    return { rows, slots: prepared.map((p) => p.trace.slot) };
}

export type TraceStats = {
    topSpeed: number | null;
    minSpeed: number | null;
    avgSpeed: number | null;
    fullThrottle: number | null;
    braking: number | null;
};

export function traceStats(samples: TelemetrySample[]): TraceStats {
    const speeds = samples.flatMap((s) => (s.speed === null ? [] : [s.speed]));
    const throttle = samples.flatMap((s) => (s.throttle === null ? [] : [s.throttle]));
    const brake = samples.flatMap((s) => (s.brake === null ? [] : [s.brake]));
    const share = (values: number[], test: (v: number) => boolean) =>
        values.length ? (values.filter(test).length / values.length) * 100 : null;
    return {
        topSpeed: speeds.length ? Math.max(...speeds) : null,
        minSpeed: speeds.length ? Math.min(...speeds) : null,
        avgSpeed: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null,
        fullThrottle: share(throttle, (v) => v >= 99),
        braking: share(brake, (v) => v > 0),
    };
}

// Laps without a time have no window to fetch telemetry for.
export function timedLaps(laps: LapRow[], driver: string) {
    return laps.filter(
        (l) => l.driver === driver && l.lap_time_seconds !== null && l.lap_time_seconds > 0,
    );
}

export function fastestLap(laps: LapRow[], driver: string): LapRow | undefined {
    return timedLaps(laps, driver).reduce<LapRow | undefined>(
        (best, l) =>
            best === undefined ||
            (l.lap_time_seconds ?? Infinity) < (best.lap_time_seconds ?? Infinity)
                ? l
                : best,
        undefined,
    );
}

export type SectorBests = [number | null, number | null, number | null];

export function sectorBests(laps: LapRow[]): SectorBests {
    const best = (pick: (l: LapRow) => number | null) => {
        const values = laps.flatMap((l) => {
            const v = pick(l);
            return v === null || v <= 0 ? [] : [v];
        });
        return values.length ? Math.min(...values) : null;
    };
    return [best((l) => l.sector_1), best((l) => l.sector_2), best((l) => l.sector_3)];
}
