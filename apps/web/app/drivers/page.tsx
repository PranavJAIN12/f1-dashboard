import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDrivers, getRaceDetail } from "@/lib/engine";
import { formatDateRange } from "@/lib/format";
import { DEFAULT_SEASON, findSession, sessionAvailability } from "@/lib/selection";
import { DriverGrid } from "./driver-grid";

// Standings shown here come from this one race weekend; it is named on the page.
const STANDINGS_ROUND = 8;

export default async function Drivers() {
    await connection(); // Request-time only, so the build never needs the provider.
    const detail = await getRaceDetail(DEFAULT_SEASON, STANDINGS_ROUND);
    const session = detail.ok ? findSession(detail.data.sessions, "R") : undefined;
    const availability = session ? sessionAvailability(session) : null;
    const res =
        session && availability === "past"
            ? await getDrivers(DEFAULT_SEASON, STANDINGS_ROUND, session.date_end)
            : null;
    const race = detail.ok ? detail.data.race : null;
    const place = race ? [race.location, race.country].filter(Boolean).join(", ") : "";

    return (
        <div className="content">
            <div className="title-row">
                <div>
                    <div className="eyebrow">
                        Driver intelligence / {DEFAULT_SEASON} round{" "}
                        {String(STANDINGS_ROUND).padStart(2, "0")}
                    </div>
                    <h1>Drivers</h1>
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
                            <Link href={`/races/${STANDINGS_ROUND}?year=${DEFAULT_SEASON}`}>
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
                    The race for {detail.data.race.event_name} has not been published yet.
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
