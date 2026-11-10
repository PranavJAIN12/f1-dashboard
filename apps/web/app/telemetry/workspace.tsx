import { ErrorState, StateMessage } from "@/components/data-state";
import { formatLapTime } from "@/lib/format";
import type { LapRow, LapTelemetry, SessionCode, SessionInfo } from "@/lib/schemas";
import {
    buildComparison,
    fastestLap,
    sectorBests,
    timedLaps,
    type Slot,
    type Trace,
} from "@/lib/telemetry";
import { DriverControls, type Option } from "./controls";
import { loadLaps, loadResults, loadTelemetry } from "./data";
import { LapSummary } from "./lap-summary";
import { TelemetryCharts, type ChartSeries } from "./telemetry-charts";

export type Query = { a?: string; b?: string; lapA?: string; lapB?: string };

type Props = {
    year: number;
    round: number;
    code: SessionCode;
    session: SessionInfo;
    query: Query;
};

const FALLBACK: Record<Slot, string> = { a: "#3b82f6", b: "#f59e0b" };

function lapOptions(laps: LapRow[], driver: string): Option[] {
    const fastest = fastestLap(laps, driver);
    return timedLaps(laps, driver).map((l) => ({
        value: String(l.lap_number),
        label: [
            `Lap ${l.lap_number}`,
            formatLapTime(l.lap_time_seconds),
            l.compound ? l.compound.charAt(0) + l.compound.slice(1).toLowerCase() : null,
            l === fastest ? "fastest" : null,
        ]
            .filter(Boolean)
            .join(" · "),
    }));
}

function pickLap(laps: LapRow[], driver: string, requested: string | undefined) {
    const timed = timedLaps(laps, driver);
    const chosen = timed.find((l) => String(l.lap_number) === requested);
    return chosen ?? fastestLap(laps, driver);
}

export async function Workspace({ year, round, code, session, query }: Props) {
    const [results, lapData] = await Promise.all([
        loadResults(year, round, code, session.date_end),
        loadLaps(year, round, code, session.date_end),
    ]);
    if (!results.ok) return <ErrorState error={results.error} />;
    if (!lapData.ok) return <ErrorState error={lapData.error} />;

    const laps = lapData.data.laps;
    const drivers = results.data.results.filter((r) => timedLaps(laps, r.abbreviation).length > 0);
    if (drivers.length === 0)
        return (
            <StateMessage tone="empty">
                {session.name} has no timed laps, so there is no telemetry to show.
            </StateMessage>
        );

    const codes = drivers.map((d) => d.abbreviation);
    const a = query.a && codes.includes(query.a) ? query.a : codes[0];
    const noComparison = query.b === "none";
    const b = noComparison
        ? null
        : query.b && query.b !== a && codes.includes(query.b)
          ? query.b
          : (codes.find((c) => c !== a) ?? null);

    const lapA = pickLap(laps, a, query.lapA);
    const lapB = b ? pickLap(laps, b, query.lapB) : undefined;
    if (!lapA)
        return <StateMessage tone="empty">{a} has no timed laps in this session.</StateMessage>;

    const fetchTrace = (driver: string, lap: LapRow | undefined) =>
        lap
            ? loadTelemetry(year, round, code, driver, lap.lap_number, session.date_end)
            : Promise.resolve(null);
    const [telA, telB] = await Promise.all([fetchTrace(a, lapA), fetchTrace(b ?? "", lapB)]);

    const toTrace = (slot: Slot, data: LapTelemetry): Trace => ({
        slot,
        driver: data.driver_id,
        team: data.team,
        colour: data.team_colour ?? FALLBACK[slot],
        lap: data.lap_number,
        lapTime: data.lap_time_seconds,
        samples: data.telemetry,
    });

    const controls = (
        <DriverControls
            base={{ year, round, session: code }}
            drivers={drivers.map((d) => ({
                value: d.abbreviation,
                label: `${d.abbreviation}${d.full_name ? ` · ${d.full_name}` : ""}`,
            }))}
            a={a}
            b={b ?? "none"}
            lapsA={lapOptions(laps, a)}
            lapsB={b ? lapOptions(laps, b) : []}
            lapA={String(lapA.lap_number)}
            lapB={lapB ? String(lapB.lap_number) : undefined}
        />
    );

    if (!telA || !telA.ok)
        return (
            <>
                {controls}
                {telA ? <ErrorState error={telA.error} /> : null}
            </>
        );

    const traces: Trace[] = [toTrace("a", telA.data)];
    let secondNote: string | null = null;
    if (telB) {
        if (telB.ok) traces.push(toTrace("b", telB.data));
        else secondNote = `${b} could not be loaded: ${telB.error.message}`;
    }

    const comparison = buildComparison(traces);
    if (!comparison)
        return (
            <>
                {controls}
                <StateMessage tone="empty">
                    No telemetry was recorded for {a} on lap {lapA.lap_number}. Pick another lap.
                </StateMessage>
            </>
        );

    // Teammates share a colour, so the second driver is drawn dashed to stay distinguishable.
    const [first, second] = traces;
    const series: ChartSeries[] = comparison.slots.map((slot) => {
        const trace = slot === "a" ? first : second;
        return {
            slot,
            driver: trace.driver,
            colour: trace.colour,
            dashed: slot === "b" && trace.colour.toLowerCase() === first.colour.toLowerCase(),
        };
    });
    const missingSecond = traces.length > 1 && !comparison.slots.includes("b");

    return (
        <div className="flex flex-col gap-4">
            {controls}
            {secondNote ? (
                <StateMessage tone="failure" bare>
                    {secondNote}
                </StateMessage>
            ) : null}
            {missingSecond ? (
                <StateMessage tone="empty" bare>
                    No telemetry was recorded for {second.driver} on lap {second.lap}, so only{" "}
                    {first.driver} is shown.
                </StateMessage>
            ) : null}
            <LapSummary
                traces={traces.filter((t) => comparison.slots.includes(t.slot))}
                laps={laps}
                bests={sectorBests(laps)}
            />
            <TelemetryCharts rows={comparison.rows} series={series} />
        </div>
    );
}
