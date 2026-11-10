import { Card } from "@/components/ui/card";
import { formatLapTime } from "@/lib/format";
import type { LapRow } from "@/lib/schemas";
import { traceStats, type SectorBests, type Trace } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

const compoundName = (c: string | null) => (c ? c.charAt(0) + c.slice(1).toLowerCase() : null);

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="label">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
        </div>
    );
}

const speed = (v: number | null) => (v === null ? "-" : `${Math.round(v)} km/h`);
const percent = (v: number | null) => (v === null ? "-" : `${Math.round(v)}%`);

function Sectors({ lap, bests }: { lap: LapRow | undefined; bests: SectorBests }) {
    const times = [lap?.sector_1, lap?.sector_2, lap?.sector_3];
    return (
        <ol className="grid grid-cols-3 gap-2" aria-label="Sector times">
            {times.map((time, i) => {
                const target = bests[i];
                const best = time != null && target !== null && time <= target;
                return (
                    <li key={i} className="rounded-md bg-muted px-2 py-1.5">
                        <div className="label">S{i + 1}</div>
                        <div
                            className={cn(
                                "text-sm font-semibold tabular-nums",
                                best && "text-purple-600 dark:text-purple-400",
                            )}
                        >
                            {time == null ? "-" : time.toFixed(3)}
                            {best ? <span className="sr-only"> (session best)</span> : null}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export function LapSummary({
    traces,
    laps,
    bests,
}: {
    traces: Trace[];
    laps: LapRow[];
    bests: SectorBests;
}) {
    const [first, second] = traces;
    const gap =
        first?.lapTime != null && second?.lapTime != null ? second.lapTime - first.lapTime : null;

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {traces.map((trace) => {
                const lap = laps.find(
                    (l) => l.driver === trace.driver && l.lap_number === trace.lap,
                );
                const stats = traceStats(trace.samples);
                const tyre = compoundName(lap?.compound ?? null);
                return (
                    <Card
                        key={trace.slot}
                        className="border-t-4 p-5"
                        style={{ borderTopColor: trace.colour }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold">{trace.driver}</h3>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        Lap {trace.lap}
                                    </span>
                                </div>
                                <p className="truncate text-sm text-muted-foreground">
                                    {[trace.team, tyre ? `${tyre} tyres` : null]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold tabular-nums">
                                    {formatLapTime(trace.lapTime)}
                                </div>
                                {trace.slot === "b" && gap !== null ? (
                                    <div className="text-xs tabular-nums text-muted-foreground">
                                        {gap === 0
                                            ? "Same time"
                                            : `${gap > 0 ? "+" : "-"}${Math.abs(gap).toFixed(3)} s vs ${first.driver}`}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="mt-4">
                            <Sectors lap={lap} bests={bests} />
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                            <Metric label="Top speed" value={speed(stats.topSpeed)} />
                            <Metric label="Min speed" value={speed(stats.minSpeed)} />
                            <Metric label="Full throttle" value={percent(stats.fullThrottle)} />
                            <Metric label="Braking" value={percent(stats.braking)} />
                        </dl>
                    </Card>
                );
            })}
        </div>
    );
}
