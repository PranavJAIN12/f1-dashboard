import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDrivers, getRaceDetail, getRaces } from "@/lib/engine";
import { formatDateRange } from "@/lib/format";
import {
    findSession,
    parseRound,
    parseSeason,
    raceStatuses,
    seasonOptions,
    sessionAvailability,
} from "@/lib/selection";
import { DriverControls } from "./controls";
import { DriverGrid } from "./driver-grid";

type Value = string | string[] | undefined;
type Props = { searchParams: Promise<{ year?: Value; round?: Value }> };
const first = (value: Value) => (Array.isArray(value) ? value[0] : value);

export default async function Drivers({ searchParams }: Props) {
    await connection(); // Request-time only, so the build never needs the provider.
    const query = await searchParams;
    const selection = parseSeason(query.year);

    if (!selection.ok) {
        return (
            <div className="content">
                <h1>Race results</h1>
                <StateMessage tone="invalid" title="Season not available">
                    {selection.message}
                </StateMessage>
            </div>
        );
    }

    const year = selection.season;
    const calendar = await getRaces(year);
    if (!calendar.ok) {
        return (
            <div className="content">
                <h1>Race results</h1>
                <ErrorState error={calendar.error} />
            </div>
        );
    }

    const races = calendar.data.races;
    if (!races.length) {
        return (
            <div className="content">
                <h1>Race results</h1>
                <StateMessage tone="empty">
                    OpenF1 lists no race weekends for {year} yet.
                </StateMessage>
            </div>
        );
    }

    const roundParam = first(query.round);
    const requestedRound = roundParam === undefined ? null : parseRound(roundParam);
    const statuses = raceStatuses(races);
    const latestCompleted = races.filter((_, index) => statuses[index] === "completed").at(-1);
    const round = requestedRound ?? latestCompleted?.round ?? races[0].round;
    const listedRace = races.find((race) => race.round === round);
    const controls = (
        <DriverControls year={year} round={round} seasons={seasonOptions()} races={races} />
    );

    if (roundParam !== undefined && requestedRound === null) {
        return (
            <div className="content">
                <div className="title-row">
                    <h1>Race results</h1>
                    {controls}
                </div>
                <StateMessage tone="invalid" title="Invalid race">
                    Select a valid race from the {year} calendar.
                </StateMessage>
            </div>
        );
    }

    if (!listedRace) {
        return (
            <div className="content">
                <div className="title-row">
                    <h1>Race results</h1>
                    {controls}
                </div>
                <StateMessage tone="missing" title="Race not found">
                    {year} has no round {round}. Choose a race from the calendar.
                </StateMessage>
            </div>
        );
    }

    const detail = await getRaceDetail(year, round);
    const session = detail.ok ? findSession(detail.data.sessions, "R") : undefined;
    const availability = session ? sessionAvailability(session) : null;
    const res =
        session && availability === "past" ? await getDrivers(year, round, session.date_end) : null;
    const race = detail.ok ? detail.data.race : null;
    const place = race ? [race.location, race.country].filter(Boolean).join(", ") : "";

    return (
        <div className="content">
            <div className="title-row">
                <div>
                    <div className="eyebrow">Race classification / {year}</div>
                    <h1>Race results</h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        See how each driver finished in this race, including points, starting
                        position and fastest lap. These are results from one race, not season
                        championship standings.
                    </p>
                    {controls}
                    {race ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{race.event_name}</span>
                            <span className="flex items-center gap-1.5">
                                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                                {place || "Location unavailable"}
                            </span>
                            <span className="flex items-center gap-1.5 tabular-nums">
                                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                                {formatDateRange(race.date_start, race.date)}
                            </span>
                        </p>
                    ) : null}
                </div>
                {race ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="accent">Race classification</Badge>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/races/${round}?year=${year}`}>
                                View race
                                <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                ) : null}
            </div>

            {!detail.ok ? (
                <ErrorState error={detail.error} />
            ) : availability !== "past" ? (
                <StateMessage tone="unavailable">
                    Results for {detail.data.race.event_name} are available after the race has
                    finished. Choose a completed race to see its classification.
                </StateMessage>
            ) : res && !res.ok ? (
                <ErrorState error={res.error} />
            ) : res && res.data.drivers.length ? (
                <DriverGrid drivers={res.data.drivers} />
            ) : (
                <StateMessage tone="empty">OpenF1 returned no drivers for this race.</StateMessage>
            )}
        </div>
    );
}
