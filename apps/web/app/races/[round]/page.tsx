import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, Globe, MapPin, Users } from "lucide-react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { statusBadge } from "@/components/race-card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRaceDetail } from "@/lib/engine";
import { formatDateRange, formatUtcDate } from "@/lib/format";
import {
    findSession,
    parseRound,
    parseSeason,
    parseSession,
    raceStatuses,
    sessionAvailability,
} from "@/lib/selection";
import { ClassifiedCount, SessionSections, Snapshot } from "./sections";
import { SessionTabs } from "./session-tabs";

type Props = {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ session?: string | string[]; year?: string | string[] }>;
};

function metric(value: string | number | null | undefined) {
    return value === null || value === undefined || value === "" ? "-" : value;
}

function BackLink({ href }: { href: string }) {
    return (
        <Link className="back" href={href}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            All races
        </Link>
    );
}

function Shell({
    children,
    eyebrow,
    title,
    back = "/races",
}: {
    children: React.ReactNode;
    eyebrow: string;
    title: string;
    back?: string;
}) {
    return (
        <div className="content">
            <BackLink href={back} />
            <div className="eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            {children}
        </div>
    );
}

export default async function RaceDetail({ params, searchParams }: Props) {
    const { round: roundParam } = await params;
    const query = await searchParams;
    const selection = parseSeason(query.year);
    const round = parseRound(roundParam);
    const code = parseSession(query.session);

    if (!selection.ok)
        return (
            <Shell eyebrow="Race detail" title="Season not available">
                <StateMessage tone="invalid" title="Season not available">
                    {selection.message}
                </StateMessage>
            </Shell>
        );
    const year = selection.season;
    const back = `/races?year=${year}`;

    if (round === null)
        return (
            <Shell eyebrow="Race detail" title="Invalid round" back={back}>
                <StateMessage tone="invalid" title="Invalid round">
                    &quot;{roundParam}&quot; is not a valid round number. Choose a race from the
                    calendar.
                </StateMessage>
            </Shell>
        );
    if (code === null)
        return (
            <Shell eyebrow="Race detail" title="Invalid session" back={back}>
                <StateMessage tone="invalid" title="Invalid session">
                    The session must be one of R, Q, S, SQ, FP1, FP2 or FP3.
                </StateMessage>
            </Shell>
        );

    const detail = await getRaceDetail(year, round);
    if (!detail.ok)
        return (
            <Shell
                eyebrow={`${year} / Round ${String(round).padStart(2, "0")}`}
                title="Race unavailable"
                back={back}
            >
                <ErrorState error={detail.error} />
            </Shell>
        );

    const { race, sessions } = detail.data;
    const session = findSession(sessions, code);
    const availability = session ? sessionAvailability(session) : null;
    const current = session ? { year, round, code, session } : null;
    // A lone weekend is always "next" when it has not started; the badge calls that "Upcoming".
    const weekend = raceStatuses([race])[0];
    const badge = statusBadge[weekend === "next" ? "upcoming" : weekend];
    const place = [race.location, race.country].filter(Boolean).join(", ");

    return (
        <div className="content">
            <BackLink href={back} />
            <div className="title-row">
                <div>
                    <div className="eyebrow">
                        {year} / Round {String(round).padStart(2, "0")}
                    </div>
                    <h1>{race.event_name}</h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                            {place || "Location unavailable"}
                        </span>
                        <span className="flex items-center gap-1.5 tabular-nums">
                            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                            {formatDateRange(race.date_start, race.date)}
                        </span>
                    </p>
                </div>
                <Badge variant={badge.variant} className="w-fit">
                    {badge.label}
                </Badge>
            </div>

            <div className="section">
                <SessionTabs sessions={sessions} selected={code} round={round} year={year} />
            </div>

            <div className="section grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Circuit" icon={MapPin}>
                    {metric(race.location)}
                </StatCard>
                <StatCard label="Country" icon={Globe}>
                    {metric(race.country)}
                </StatCard>
                <StatCard label="Sessions" icon={CalendarDays}>
                    {sessions.length}
                </StatCard>
                <StatCard label="Classified drivers" icon={Users}>
                    {current && availability === "past" ? (
                        <Suspense fallback={<Skeleton className="h-6 w-8" />}>
                            <ClassifiedCount {...current} />
                        </Suspense>
                    ) : (
                        "-"
                    )}
                </StatCard>
            </div>

            {current && availability === "past" ? (
                <Card className="section">
                    <CardHeader>
                        <div className="section-heading">
                            <CardTitle>{session?.name} snapshot</CardTitle>
                            <Badge variant="accent">Official results</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                            <Snapshot {...current} />
                        </Suspense>
                    </CardContent>
                </Card>
            ) : null}

            {!session ? (
                <StateMessage tone="missing" title="Session not in this weekend">
                    Round {round} has no {code} session. Choose one from the sessions above.
                </StateMessage>
            ) : availability === "cancelled" ? (
                <StateMessage tone="unavailable" title="Session cancelled">
                    {session.name} was cancelled.
                </StateMessage>
            ) : availability === "upcoming" ? (
                <StateMessage tone="unavailable" title="Session has not taken place">
                    {session.name} is scheduled for {formatUtcDate(session.date_start)}. Data
                    appears after the session ends.
                </StateMessage>
            ) : availability === "live" ? (
                <StateMessage tone="unavailable" title="Session is live or just ended">
                    OpenF1 treats data from 30 minutes before a session until 30 minutes after it as
                    live. Live data needs a paid OpenF1 plan and is not enabled here, so this
                    session becomes available shortly after that window closes.
                </StateMessage>
            ) : current ? (
                <SessionSections {...current} />
            ) : null}
        </div>
    );
}
