import { Building2, Timer, Trophy, Users } from "lucide-react";
import { DriverCard } from "@/components/driver-card";
import { StatCard } from "@/components/stat-card";
import { formatLapTime } from "@/lib/format";
import type { SessionResult } from "@/lib/schemas";

export function DriverGrid({ drivers }: { drivers: SessionResult[] }) {
    // Unclassified drivers (no position) go last, in the order OpenF1 returned them.
    const sorted = [...drivers].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
    const winner = sorted.find((d) => d.position === 1);
    const teams = new Set(sorted.map((d) => d.team).filter(Boolean)).size;
    const fastest = sorted.reduce<SessionResult | null>(
        (best, d) =>
            d.fastest_lap !== null &&
            (best === null || d.fastest_lap < (best.fastest_lap ?? Infinity))
                ? d
                : best,
        null,
    );

    return (
        <>
            <div className="section grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Drivers" icon={Users}>
                    {sorted.length}
                </StatCard>
                <StatCard label="Teams" icon={Building2}>
                    {teams}
                </StatCard>
                <StatCard
                    label="Winner"
                    icon={Trophy}
                    hint={winner ? (winner.team ?? undefined) : undefined}
                >
                    {winner ? (winner.full_name ?? winner.abbreviation) : "-"}
                </StatCard>
                <StatCard
                    label="Fastest lap"
                    icon={Timer}
                    hint={fastest ? (fastest.full_name ?? fastest.abbreviation) : undefined}
                >
                    {fastest ? formatLapTime(fastest.fastest_lap) : "-"}
                </StatCard>
            </div>
            <ul className="section grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sorted.map((driver) => (
                    <DriverCard key={driver.driver_id} driver={driver} />
                ))}
            </ul>
        </>
    );
}
