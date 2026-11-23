"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RaceOption = { round: number; event_name: string };

export function DriverControls({
    year,
    round,
    seasons,
    races,
}: {
    year: number;
    round: number;
    seasons: number[];
    races: RaceOption[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const navigate = (params: { year: number; round?: number }) => {
        const query = new URLSearchParams({ year: String(params.year) });
        if (params.round !== undefined) query.set("round", String(params.round));
        startTransition(() => router.push(`/drivers?${query}`));
    };

    return (
        <div
            className={cn(
                "grid w-full grid-cols-[6.5rem_minmax(0,1fr)] items-end gap-3",
                pending && "opacity-60",
            )}
            aria-busy={pending}
        >
            <div className="flex min-w-0 flex-col gap-1.5">
                <label className="label" htmlFor="drivers-season">
                    Season
                </label>
                <Select
                    id="drivers-season"
                    className="w-full"
                    value={String(year)}
                    onChange={(event) => navigate({ year: Number(event.target.value) })}
                >
                    {seasons.map((season) => (
                        <option key={season} value={season}>
                            {season}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
                <label className="label" htmlFor="drivers-race">
                    Race
                </label>
                <Select
                    id="drivers-race"
                    className="w-full min-w-0"
                    value={String(round)}
                    onChange={(event) => navigate({ year, round: Number(event.target.value) })}
                >
                    {races.map((race) => (
                        <option key={race.round} value={race.round}>
                            R{String(race.round).padStart(2, "0")} · {race.event_name}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    );
}
