import { connection } from "next/server";
import type { ReactNode } from "react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { SeasonView } from "@/components/season-view";
import { getRaces } from "@/lib/engine";
import { FIRST_SEASON, parseSeason, seasonOptions } from "@/lib/selection";
import { Schedule } from "./schedule";

type Props = { searchParams: Promise<{ year?: string | string[] }> };

export default async function Races({ searchParams }: Props) {
    await connection(); // Keep this page out of the build: it must not depend on the provider being up.
    const selection = parseSeason((await searchParams).year);

    let body: ReactNode;
    if (!selection.ok) {
        body = (
            <StateMessage tone="invalid" title="Season not available">
                {selection.message}
            </StateMessage>
        );
    } else {
        const res = await getRaces(selection.season);
        if (!res.ok) body = <ErrorState error={res.error} />;
        else if (!res.data.races.length)
            body = (
                <StateMessage tone="empty">
                    OpenF1 lists no race weekends for {selection.season} yet.
                </StateMessage>
            );
        else body = <Schedule races={res.data.races} season={selection.season} />;
    }

    return (
        <div className="content">
            <SeasonView
                heading={
                    <>
                        <div className="eyebrow">Championship</div>
                        <h1>Races</h1>
                        <p className="sub">Season calendar and race weekends, from OpenF1.</p>
                    </>
                }
                seasons={seasonOptions()}
                value={selection.ok ? selection.season : null}
                firstSeason={FIRST_SEASON}
            >
                {body}
            </SeasonView>
        </div>
    );
}
