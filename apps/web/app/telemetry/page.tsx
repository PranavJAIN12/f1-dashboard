import { connection } from "next/server";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { CircuitImage } from "@/components/circuit-image";
import { ErrorState, StateMessage } from "@/components/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getRaceDetail, getRaces } from "@/lib/engine";
import {
    findSession,
    parseRound,
    parseSeason,
    parseSession,
    raceStatuses,
    seasonOptions,
    sessionAvailability,
} from "@/lib/selection";
import { sessionCodeSchema, type SessionCode } from "@/lib/schemas";
import { SessionControls, type Option } from "./controls";
import { Workspace } from "./workspace";

type Value = string | string[] | undefined;
type Props = {
    searchParams: Promise<{
        year?: Value;
        round?: Value;
        session?: Value;
        a?: Value;
        b?: Value;
        lapA?: Value;
        lapB?: Value;
    }>;
};

const first = (value: Value) => (Array.isArray(value) ? value[0] : value);

function Page({
    children,
    circuit,
}: {
    children: ReactNode;
    circuit?: { src: string | null; name: string };
}) {
    return (
        <div className="content">
            <div className="title-row">
                <div>
                    <div className="eyebrow">Vehicle data</div>
                    <h1>Telemetry</h1>
                    <p className="sub">
                        Compare speed, throttle, brake, gear, RPM and DRS over a single lap.
                    </p>
                </div>
                {circuit ? (
                    <CircuitImage
                        src={circuit.src}
                        alt={`${circuit.name} circuit layout`}
                        className="h-24 w-32"
                        eager
                    />
                ) : null}
            </div>
            {children}
        </div>
    );
}

function WorkspaceSkeleton() {
    return (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading telemetry">
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-44 w-full" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Skeleton className="h-[48rem] w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
    );
}

export default async function Telemetry({ searchParams }: Props) {
    await connection(); // Keep this page out of the build: it must not depend on the provider being up.
    const query = await searchParams;

    const selection = parseSeason(query.year);
    if (!selection.ok)
        return (
            <Page>
                <StateMessage tone="invalid" title="Season not available">
                    {selection.message}
                </StateMessage>
            </Page>
        );
    const year = selection.season;

    const calendar = await getRaces(year);
    if (!calendar.ok)
        return (
            <Page>
                <ErrorState error={calendar.error} />
            </Page>
        );
    const races = calendar.data.races;
    const statuses = raceStatuses(races);
    const completed = races.filter((_, i) => statuses[i] === "completed");
    const seasonControls = (round: number | null, session: string, sessions: Option[]) => (
        <SessionControls
            year={year}
            round={round ?? 0}
            session={session}
            seasons={seasonOptions()}
            rounds={
                round === null
                    ? [{ value: "0", label: "No completed races", disabled: true }]
                    : races.map((r, i) => ({
                          value: String(r.round),
                          label: `R${String(r.round).padStart(2, "0")} · ${r.event_name}`,
                          disabled: statuses[i] !== "completed",
                      }))
            }
            sessions={sessions}
        />
    );

    const roundParam = first(query.round);
    const round =
        roundParam === undefined ? (completed.at(-1)?.round ?? null) : parseRound(roundParam);

    if (round === null)
        return (
            <Page>
                {seasonControls(null, "", [])}
                <StateMessage
                    tone={roundParam === undefined ? "empty" : "invalid"}
                    title={roundParam === undefined ? "No completed races" : "Invalid round"}
                >
                    {roundParam === undefined
                        ? `No ${year} race weekend has finished yet, so there is no telemetry.`
                        : `"${roundParam}" is not a valid round number.`}
                </StateMessage>
            </Page>
        );

    const listed = races.find((r) => r.round === round);
    if (!listed)
        return (
            <Page>
                {seasonControls(round, "", [])}
                <StateMessage tone="missing" title="Race not found">
                    {year} has no round {round}.
                </StateMessage>
            </Page>
        );

    const detail = await getRaceDetail(year, round);
    if (!detail.ok)
        return (
            <Page circuit={{ src: listed.circuit_image, name: listed.event_name }}>
                {seasonControls(round, "", [])}
                <ErrorState error={detail.error} />
            </Page>
        );

    const { sessions } = detail.data;
    const sessionOptions: Option[] = sessions.flatMap((s) => {
        const known = sessionCodeSchema.safeParse(s.type);
        return known.success
            ? [{ value: s.type, label: s.name, disabled: sessionAvailability(s) !== "past" }]
            : [];
    });

    // Without an explicit session, show the race, or the latest finished one when it has not run.
    const sessionParam = first(query.session);
    let code: SessionCode | null;
    if (sessionParam === undefined) {
        const finished = sessions.filter((s) => sessionAvailability(s) === "past");
        const preferred = finished.find((s) => s.type === "R") ?? finished.at(-1);
        code = preferred ? sessionCodeSchema.parse(preferred.type) : null;
    } else code = parseSession(sessionParam);

    const circuit = { src: listed.circuit_image, name: listed.event_name };
    const controls = seasonControls(round, code ?? "", sessionOptions);

    if (code === null)
        return (
            <Page circuit={circuit}>
                {controls}
                <StateMessage
                    tone={sessionParam === undefined ? "unavailable" : "invalid"}
                    title={sessionParam === undefined ? "No finished session" : "Invalid session"}
                >
                    {sessionParam === undefined
                        ? `${listed.event_name} has no finished session yet.`
                        : "The session must be one of R, Q, S, SQ, FP1, FP2 or FP3."}
                </StateMessage>
            </Page>
        );

    const session = findSession(sessions, code);
    const availability = session ? sessionAvailability(session) : null;
    if (!session || availability !== "past")
        return (
            <Page circuit={circuit}>
                {controls}
                <StateMessage
                    tone={session ? "unavailable" : "missing"}
                    title={session ? "Session not available" : "Session not in this weekend"}
                >
                    {!session
                        ? `${listed.event_name} has no ${code} session.`
                        : availability === "cancelled"
                          ? `${session.name} was cancelled.`
                          : `${session.name} has not finished yet. Telemetry appears after the session ends.`}
                </StateMessage>
            </Page>
        );

    const workspaceQuery = {
        a: first(query.a),
        b: first(query.b),
        lapA: first(query.lapA),
        lapB: first(query.lapB),
    };

    return (
        <Page circuit={circuit}>
            <div className="section flex flex-col gap-5">
                {controls}
                {/* Keyed so changing the selection shows the skeleton instead of stale charts. */}
                <Suspense
                    key={JSON.stringify([year, round, code, workspaceQuery])}
                    fallback={<WorkspaceSkeleton />}
                >
                    <Workspace
                        year={year}
                        round={round}
                        code={code}
                        session={session}
                        query={workspaceQuery}
                    />
                </Suspense>
            </div>
        </Page>
    );
}
