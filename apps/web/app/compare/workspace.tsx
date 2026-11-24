import Link from "next/link";
import { ErrorState, StateMessage } from "@/components/data-state";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { buildPaceSeries, edge, paceStats, type Edge, type PaceStats } from "@/lib/compare";
import { formatLapTime } from "@/lib/format";
import type { SessionCode, SessionInfo, SessionResult } from "@/lib/schemas";
import { timedLaps } from "@/lib/telemetry";
import { cn } from "@/lib/utils";
import { loadLaps, loadResults } from "../telemetry/data";
import { CompareControls } from "./controls";
import { PaceCharts } from "./pace-charts";

export type Query = { a?: string; b?: string };

type Props = {
    year: number;
    round: number;
    code: SessionCode;
    session: SessionInfo;
    query: Query;
};

const COLOURS = { a: "#3b82f6", b: "#f59e0b" };
const RACE_SESSIONS: SessionCode[] = ["R", "S"];

const seconds = (v: number | null, digits = 3) => (v === null ? "-" : v.toFixed(digits));
const speed = (v: number | null) => (v === null ? "-" : `${Math.round(v)} km/h`);

type Row = {
    label: string;
    a: number | null;
    b: number | null;
    lowerIsBetter: boolean;
    format: (v: number | null) => string;
};

function rowsFor(a: PaceStats, b: PaceStats, complete: boolean): Row[] {
    const time = (
        label: string,
        x: number | null,
        y: number | null,
        f: Row["format"] = formatLapTime,
    ): Row => ({
        label,
        a: x,
        b: y,
        lowerIsBetter: true,
        format: f,
    });
    const rows: Row[] = [
        time("Fastest lap", a.fastest, b.fastest),
        time("Median clean lap", a.median, b.median),
        time("Average clean lap", a.mean, b.mean),
        time("Consistency (std dev)", a.consistency, b.consistency, (v) => seconds(v)),
        time("Best sector 1", a.sectors[0], b.sectors[0], (v) => seconds(v)),
        time("Best sector 2", a.sectors[1], b.sectors[1], (v) => seconds(v)),
        time("Best sector 3", a.sectors[2], b.sectors[2], (v) => seconds(v)),
        {
            label: "Top speed trap",
            a: a.speedTrap,
            b: b.speedTrap,
            lowerIsBetter: false,
            format: speed,
        },
    ];
    // Total time only means something when both drivers completed the same number of timed laps.
    if (complete)
        rows.push(
            time("Total lap time", a.totalTime, b.totalTime, (v) =>
                v === null ? "-" : `${(v / 60).toFixed(1)} min`,
            ),
        );
    return rows;
}

function Winner({ edge: e, side }: { edge: Edge; side: "a" | "b" }) {
    return e === side ? <span className="sr-only"> (better)</span> : null;
}

function DriverCard({
    slot,
    result,
    stats,
    code,
}: {
    slot: "a" | "b";
    result: SessionResult;
    stats: PaceStats;
    code: SessionCode;
}) {
    return (
        <Card className="border-t-4 p-5" style={{ borderTopColor: COLOURS[slot] }}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold">{result.abbreviation}</h3>
                    <p className="truncate text-sm text-muted-foreground">
                        {[result.full_name, result.team].filter(Boolean).join(" · ")}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold tabular-nums">
                        {result.position === null ? "-" : `P${result.position}`}
                    </div>
                    {code === "R" || code === "S" ? (
                        <div className="text-xs text-muted-foreground">
                            Grid {result.grid ? `P${result.grid}` : "-"}
                        </div>
                    ) : null}
                </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                    <dt className="label">Fastest</dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                        {formatLapTime(stats.fastest)}
                    </dd>
                </div>
                <div>
                    <dt className="label">Timed laps</dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums">{stats.laps}</dd>
                </div>
                <div>
                    <dt className="label">Status</dt>
                    <dd className="mt-0.5 truncate text-sm font-semibold">{result.status}</dd>
                </div>
            </dl>
        </Card>
    );
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
    if (drivers.length < 2)
        return (
            <StateMessage tone="empty">
                {session.name} needs at least two drivers with timed laps to compare.
            </StateMessage>
        );

    const codes = drivers.map((d) => d.abbreviation);
    const a = query.a && codes.includes(query.a) ? query.a : codes[0];
    const b =
        query.b && query.b !== a && codes.includes(query.b) ? query.b : codes.find((c) => c !== a)!;
    const resultA = drivers.find((d) => d.abbreviation === a)!;
    const resultB = drivers.find((d) => d.abbreviation === b)!;
    const statsA = paceStats(laps, a);
    const statsB = paceStats(laps, b);

    const points = buildPaceSeries(laps, a, b);
    const showGap = RACE_SESSIONS.includes(code) && points.some((p) => p.gap !== null);
    const rows = rowsFor(statsA, statsB, statsA.laps === statsB.laps);
    const telemetry = new URLSearchParams({
        year: String(year),
        round: String(round),
        session: code,
        a,
        b,
    });

    return (
        <div className="flex flex-col gap-4">
            <CompareControls
                base={{ year, round, session: code }}
                drivers={drivers.map((d) => ({
                    value: d.abbreviation,
                    label: `${d.abbreviation}${d.full_name ? ` · ${d.full_name}` : ""}`,
                }))}
                a={a}
                b={b}
            />
            <div className="grid gap-3 md:grid-cols-2">
                <DriverCard slot="a" result={resultA} stats={statsA} code={code} />
                <DriverCard slot="b" result={resultB} stats={statsB} code={code} />
            </div>
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
                    <h2 className="text-sm font-semibold tracking-tight">Head to head</h2>
                    <Link
                        href={`/telemetry?${telemetry}`}
                        className="text-xs font-medium underline-offset-4 hover:underline"
                    >
                        Compare fastest-lap telemetry
                    </Link>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead className="text-right">{a}</TableHead>
                            <TableHead className="text-right">{b}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((r) => {
                            const e = edge(r.a, r.b, r.lowerIsBetter);
                            const cell = (side: "a" | "b") => (
                                <TableCell
                                    className={cn(
                                        "text-right tabular-nums",
                                        e === side && "font-semibold text-foreground",
                                    )}
                                >
                                    {r.format(r[side])}
                                    <Winner edge={e} side={side} />
                                </TableCell>
                            );
                            return (
                                <TableRow key={r.label}>
                                    <TableCell className="text-muted-foreground">
                                        {r.label}
                                    </TableCell>
                                    {cell("a")}
                                    {cell("b")}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
            <PaceCharts
                points={points}
                a={{ driver: a, colour: COLOURS.a, dashed: false }}
                b={{ driver: b, colour: COLOURS.b, dashed: false }}
                showGap={showGap}
            />
        </div>
    );
}
