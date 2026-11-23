import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { getDrivers, getRaceDetail, getRaces } from "@/lib/engine";
import { formatDateRange } from "@/lib/format";
import type { RaceListItem } from "@/lib/schemas";
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

function ResultsHeader({
    year,
    round,
    races,
    selectedRace,
    hasCompletedRace,
}: {
    year: number;
    round: number;
    races: RaceListItem[];
    selectedRace?: RaceListItem;
    hasCompletedRace: boolean;
}) {
    const place = selectedRace
        ? [selectedRace.location, selectedRace.country].filter(Boolean).join(", ")
        : "";

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
                <div className="eyebrow">Race classification / {year}</div>
                <h1>Race results</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    See how each driver finished in one race, including points, starting position
                    and fastest lap. These are not season championship standings.
                </p>
                {selectedRace ? (
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="font-semibold text-foreground">
                                {selectedRace.event_name}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                                {place || "Location unavailable"}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
                                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                                {formatDateRange(selectedRace.date_start, selectedRace.date)}
                            </span>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/races/${round}?year=${year}`}>
                                View race weekend
                                <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                ) : null}
            </div>
            <aside
                aria-label="Choose a season and race"
                className="min-w-0 rounded-lg border bg-card p-4 sm:p-5"
            >
                <p className="eyebrow">Your selection</p>
                <h2 className="mt-1 text-base font-semibold">Choose a season and race</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    {hasCompletedRace
                        ? "Starts with the latest completed race in this season."
                        : "No race has finished yet; showing the first race listed."}
                </p>
                <div className="mt-4">
                    <DriverControls
                        year={year}
                        round={round}
                        seasons={seasonOptions()}
                        races={races}
                    />
                </div>
            </aside>
        </div>
    );
}

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
    const fallbackRound = latestCompleted?.round ?? races[0].round;
    const round = requestedRound ?? fallbackRound;
    const listedRace = races.find((race) => race.round === round);
    const controlRound = listedRace ? round : fallbackRound;
    const hasCompletedRace = latestCompleted !== undefined;

    if (roundParam !== undefined && requestedRound === null) {
        return (
            <div className="content">
                <ResultsHeader
                    year={year}
                    round={controlRound}
                    races={races}
                    hasCompletedRace={hasCompletedRace}
                />
                <StateMessage tone="invalid" title="Invalid race">
                    Select a valid race from the {year} calendar.
                </StateMessage>
            </div>
        );
    }

    if (!listedRace) {
        return (
            <div className="content">
                <ResultsHeader
                    year={year}
                    round={controlRound}
                    races={races}
                    hasCompletedRace={hasCompletedRace}
                />
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

    return (
        <div className="content">
            <ResultsHeader
                year={year}
                round={round}
                races={races}
                selectedRace={listedRace}
                hasCompletedRace={hasCompletedRace}
            />

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
