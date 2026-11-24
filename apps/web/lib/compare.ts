import type { LapRow } from "@/lib/schemas";
import { sectorBests, timedLaps } from "@/lib/telemetry";

// Laps slower than this share of a driver's fastest are treated as traffic, safety car or pit laps.
const CLEAN_LAP_LIMIT = 1.07;

export type PaceStats = {
    laps: number;
    fastest: number | null;
    median: number | null;
    mean: number | null;
    consistency: number | null; // Standard deviation of clean laps, in seconds.
    sectors: [number | null, number | null, number | null]; // Driver's best per sector.
    speedTrap: number | null;
    totalTime: number | null; // Sum of all timed laps; only comparable when both drivers finished the same laps.
};

const lapTime = (l: LapRow) => l.lap_time_seconds as number;

export function cleanLaps(laps: LapRow[], driver: string): LapRow[] {
    const timed = timedLaps(laps, driver);
    if (timed.length === 0) return [];
    const fastest = Math.min(...timed.map(lapTime));
    return timed.filter((l) => !l.is_pit_out_lap && lapTime(l) <= fastest * CLEAN_LAP_LIMIT);
}

function median(values: number[]) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((x, y) => x - y);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function paceStats(laps: LapRow[], driver: string): PaceStats {
    const timed = timedLaps(laps, driver);
    const clean = cleanLaps(laps, driver).map(lapTime);
    const mean = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
    const traps = timed.flatMap((l) => (l.speed_trap === null ? [] : [l.speed_trap]));
    const sectors = sectorBests(laps.filter((l) => l.driver === driver));
    return {
        laps: timed.length,
        fastest: timed.length ? Math.min(...timed.map(lapTime)) : null,
        median: median(clean),
        mean,
        consistency:
            mean === null
                ? null
                : Math.sqrt(clean.reduce((sum, t) => sum + (t - mean) ** 2, 0) / clean.length),
        sectors,
        speedTrap: traps.length ? Math.max(...traps) : null,
        totalTime: timed.length ? timed.reduce((sum, l) => sum + lapTime(l), 0) : null,
    };
}

export type PacePoint = {
    lap: number;
    a: number | null;
    b: number | null;
    gap: number | null; // Accumulated race time of B minus A after this lap.
};

// One point per lap. Pace values are clean laps only so pit and slow laps do not flatten the scale.
export function buildPaceSeries(laps: LapRow[], a: string, b: string): PacePoint[] {
    const cleanA = new Map(cleanLaps(laps, a).map((l) => [l.lap_number, lapTime(l)]));
    const cleanB = new Map(cleanLaps(laps, b).map((l) => [l.lap_number, lapTime(l)]));
    const allA = new Map(timedLaps(laps, a).map((l) => [l.lap_number, lapTime(l)]));
    const allB = new Map(timedLaps(laps, b).map((l) => [l.lap_number, lapTime(l)]));
    const last = Math.max(0, ...allA.keys(), ...allB.keys());

    const points: PacePoint[] = [];
    let totalA = 0;
    let totalB = 0;
    let running = true; // The accumulated gap is only valid while neither driver has a missing lap.
    for (let lap = 1; lap <= last; lap++) {
        const ta = allA.get(lap);
        const tb = allB.get(lap);
        if (ta === undefined || tb === undefined) running = false;
        else if (running) {
            totalA += ta;
            totalB += tb;
        }
        points.push({
            lap,
            a: cleanA.get(lap) ?? null,
            b: cleanB.get(lap) ?? null,
            gap: running ? totalB - totalA : null,
        });
    }
    return points;
}

export type Edge = "a" | "b" | "tie" | null;

// Lower is better for times; higher is better for speed.
export function edge(a: number | null, b: number | null, lowerIsBetter: boolean): Edge {
    if (a === null || b === null) return null;
    if (a === b) return "tie";
    return a < b === lowerIsBetter ? "a" : "b";
}
