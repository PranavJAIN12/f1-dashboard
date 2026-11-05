import { RaceCard } from "@/components/race-card";
import { SeasonStats } from "@/components/season-stats";
import type { RaceListItem } from "@/lib/schemas";
import { raceStatuses } from "@/lib/selection";

export function Schedule({ races, season }: { races: RaceListItem[]; season: number }) {
    const statuses = raceStatuses(races);
    return (
        <>
            <SeasonStats className="section" races={races} statuses={statuses} />
            <ul className="section grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {races.map((race, index) => (
                    <RaceCard
                        key={race.round}
                        race={race}
                        season={season}
                        status={statuses[index]}
                    />
                ))}
            </ul>
        </>
    );
}
