import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionCode, SessionInfo } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { LapsTable, LoadingRows, WeatherPanel } from "./deferred-data";
import { loadLaps, loadPitStops, loadResults, loadWeather } from "./data";
import { PitStopsTable, ResultsTable } from "./race-tables";

type SectionProps = { year: number; round: number; code: SessionCode; session: SessionInfo };

const LEADER_LABEL: Record<SessionCode, string> = {
    R: "Winner",
    S: "Winner",
    Q: "Pole",
    SQ: "Pole",
    FP1: "Fastest",
    FP2: "Fastest",
    FP3: "Fastest",
};

function SectionCard({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function CardSkeleton({
    title,
    columns,
    className,
}: {
    title: string;
    columns: number;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader>
                <div className="section-heading">
                    <CardTitle>{title}</CardTitle>
                    <Skeleton className="h-5 w-20" />
                </div>
            </CardHeader>
            <CardContent>
                <LoadingRows columns={columns} />
            </CardContent>
        </Card>
    );
}

export async function ClassifiedCount(props: SectionProps) {
    const res = await loadResults(props.year, props.round, props.code, props.session.date_end);
    return <>{res.ok && res.data.results.length ? res.data.results.length : "-"}</>;
}

export async function Snapshot(props: SectionProps) {
    const res = await loadResults(props.year, props.round, props.code, props.session.date_end);
    if (!res.ok) return <ErrorState error={res.error} bare />;
    const rows = res.data.results;
    const leader = rows.find((row) => row.position === 1);
    const podium = rows.filter((row) => row.position !== null && row.position <= 3);
    const detail = leader
        ? [leader.team, leader.points !== null ? `${leader.points} points` : null]
              .filter(Boolean)
              .join(" · ")
        : "OpenF1 has not published results for this session.";

    return (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <div>
                <span className="label flex items-center gap-1.5">
                    <Trophy aria-hidden="true" className="h-3.5 w-3.5" />
                    {LEADER_LABEL[props.code]}
                </span>
                <div className="mt-2 text-2xl font-bold tracking-tight">
                    {leader?.full_name ?? "Unavailable"}
                </div>
                <p className="muted mt-1">{detail}</p>
            </div>
            <div>
                <span className="label">Podium</span>
                {podium.length ? (
                    <ol className="mt-2 grid gap-2 sm:grid-cols-3">
                        {podium.map((row) => (
                            <li
                                key={row.driver_id}
                                className={cn(
                                    "rounded-md border p-3",
                                    row.position === 1 && "border-accent/50 bg-accent-soft",
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                                        P{row.position}
                                    </span>
                                    <span className="text-sm font-bold">{row.abbreviation}</span>
                                </div>
                                <div className="mt-1 truncate text-xs text-muted-foreground">
                                    {row.team ?? "Unknown team"}
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="muted mt-2">Unavailable</p>
                )}
            </div>
        </div>
    );
}

async function ResultsContent(props: SectionProps) {
    const res = await loadResults(props.year, props.round, props.code, props.session.date_end);
    const title = `${props.session.name} results`;
    if (!res.ok)
        return (
            <SectionCard title={title} className="section">
                <ErrorState error={res.error} bare />
            </SectionCard>
        );
    if (!res.data.results.length)
        return (
            <SectionCard title={title} className="section">
                <StateMessage tone="empty" bare>
                    OpenF1 has not published results for this session.
                </StateMessage>
            </SectionCard>
        );
    // Points are only published for race-type sessions; when none are present the column is omitted.
    const hasPoints = res.data.results.some((row) => row.points !== null);
    return <ResultsTable title={title} results={res.data.results} hasPoints={hasPoints} />;
}

async function PitStopsContent(props: SectionProps) {
    const res = await loadPitStops(props.year, props.round, props.code, props.session.date_end);
    if (!res.ok)
        return (
            <SectionCard title="Pit stops" className="section">
                <ErrorState error={res.error} bare />
            </SectionCard>
        );
    if (!res.data.pit_stops.length)
        return (
            <SectionCard title="Pit stops" className="section">
                <StateMessage tone="empty" bare>
                    OpenF1 recorded no pit stops for this session.
                </StateMessage>
            </SectionCard>
        );
    return <PitStopsTable pitStops={res.data.pit_stops} />;
}

async function LapsContent(props: SectionProps) {
    const res = await loadLaps(props.year, props.round, props.code, props.session.date_end);
    if (!res.ok)
        return (
            <SectionCard title="Lap data">
                <ErrorState error={res.error} bare />
            </SectionCard>
        );
    if (!res.data.laps.length)
        return (
            <SectionCard title="Lap data">
                <StateMessage tone="empty" bare>
                    OpenF1 has no lap data for this session.
                </StateMessage>
            </SectionCard>
        );
    const laps = res.data.laps.map((lap) => ({
        driver_id: lap.driver_id,
        driver: lap.driver,
        lap_number: lap.lap_number,
        lap_time_seconds: lap.lap_time_seconds,
        compound: lap.compound,
        position: lap.position,
    }));
    return <LapsTable laps={laps} />;
}

async function WeatherContent(props: SectionProps) {
    const res = await loadWeather(props.year, props.round, props.code, props.session.date_end);
    if (!res.ok)
        return (
            <SectionCard title="Track conditions">
                <ErrorState error={res.error} bare />
            </SectionCard>
        );
    if (!res.data.weather.length)
        return (
            <SectionCard title="Track conditions">
                <StateMessage tone="empty" bare>
                    OpenF1 has no weather samples for this session.
                </StateMessage>
            </SectionCard>
        );
    return <WeatherPanel weather={res.data.weather} />;
}

export function SessionSections(props: SectionProps) {
    return (
        <>
            <Suspense fallback={<CardSkeleton title="Results" columns={5} className="section" />}>
                <ResultsContent {...props} />
            </Suspense>
            <Suspense fallback={<CardSkeleton title="Pit stops" columns={5} className="section" />}>
                <PitStopsContent {...props} />
            </Suspense>
            <div className="deferred-grid section">
                <Suspense fallback={<CardSkeleton title="Lap data" columns={5} />}>
                    <LapsContent {...props} />
                </Suspense>
                <Suspense fallback={<CardSkeleton title="Track conditions" columns={7} />}>
                    <WeatherContent {...props} />
                </Suspense>
            </div>
        </>
    );
}
