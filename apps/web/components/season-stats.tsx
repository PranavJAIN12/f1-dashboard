import { CalendarClock, CircleCheck, Flag, Globe } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { formatDateRange } from "@/lib/format";
import type { RaceListItem } from "@/lib/schemas";
import type { RaceStatus } from "@/lib/selection";
import { cn } from "@/lib/utils";

type Props = { races: RaceListItem[]; statuses: RaceStatus[]; className?: string };

export function SeasonStats({ races, statuses, className }: Props) {
    const completed = statuses.filter((s) => s === "completed").length;
    const upcoming = races.find((_, i) => statuses[i] === "next" || statuses[i] === "live");
    const countries = new Set(races.map((r) => r.country).filter(Boolean)).size;
    const percent = Math.round((completed / races.length) * 100);

    return (
        <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
            <StatCard label="Race weekends" icon={Flag}>
                {races.length}
            </StatCard>
            <StatCard
                label="Completed"
                icon={CircleCheck}
                hint={
                    <div
                        role="progressbar"
                        aria-label="Completed race weekends"
                        aria-valuemin={0}
                        aria-valuemax={races.length}
                        aria-valuenow={completed}
                        className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                        <div
                            className="h-full rounded-full bg-accent transition-[width] duration-500"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                }
            >
                {completed} <span className="muted">of {races.length}</span>
            </StatCard>
            <StatCard
                label={upcoming ? "Next up" : "Season status"}
                icon={CalendarClock}
                hint={upcoming ? formatDateRange(upcoming.date_start, upcoming.date) : undefined}
            >
                {upcoming ? upcoming.event_name : "Season complete"}
            </StatCard>
            <StatCard label="Countries" icon={Globe}>
                {countries}
            </StatCard>
        </div>
    );
}
