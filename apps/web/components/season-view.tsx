"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { ScheduleSkeleton } from "@/components/schedule-skeleton";
import { Select } from "@/components/ui/select";

// Cached seasons resolve almost instantly; without a minimum the skeleton would flash too
// briefly for the user to notice that the season changed.
const MIN_SKELETON_MS = 600;

type Props = {
    heading: ReactNode;
    seasons: number[];
    // null when the requested season is invalid, so the control does not claim a wrong one.
    value: number | null;
    firstSeason: number;
    children: ReactNode;
};

export function SeasonView({ heading, seasons, value, firstSeason, children }: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [holding, setHolding] = useState(false);
    const [choice, setChoice] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const loading = pending || holding;
    // Show the chosen season immediately instead of the old one until the navigation lands.
    const shown = loading && choice ? choice : value === null ? "" : String(value);

    function change(season: string) {
        clearTimeout(timer.current);
        setChoice(season);
        setHolding(true);
        timer.current = setTimeout(() => setHolding(false), MIN_SKELETON_MS);
        startTransition(() => router.push(`/races?year=${season}`));
    }

    return (
        <>
            <div className="title-row">
                <div>{heading}</div>
                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <div className="flex items-center gap-3">
                        <label className="label" htmlFor="season">
                            Season
                        </label>
                        <Select
                            id="season"
                            value={shown}
                            aria-busy={loading}
                            onChange={(event) => change(event.target.value)}
                        >
                            {shown === "" ? (
                                <option value="" disabled>
                                    Select a season
                                </option>
                            ) : null}
                            {seasons.map((season) => (
                                <option key={season} value={season}>
                                    {season}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Data is only available from {firstSeason} onwards.
                    </p>
                </div>
            </div>
            {loading ? <ScheduleSkeleton /> : children}
        </>
    );
}
