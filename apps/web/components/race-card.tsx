import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { CircuitImage } from "@/components/circuit-image";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/format";
import type { RaceListItem } from "@/lib/schemas";
import type { RaceStatus } from "@/lib/selection";
import { cn } from "@/lib/utils";

export const statusBadge: Record<
    RaceStatus,
    { label: string; variant: "secondary" | "accent" | "default" | "outline" }
> = {
    completed: { label: "Completed", variant: "secondary" },
    live: { label: "In progress", variant: "accent" },
    next: { label: "Next race", variant: "default" },
    upcoming: { label: "Upcoming", variant: "outline" },
};

// Renders an <li>: place it inside a <ul>.
export function RaceCard({
    race,
    season,
    status,
}: {
    race: RaceListItem;
    season: number;
    status: RaceStatus;
}) {
    const badge = statusBadge[status];
    const place =
        [race.location, race.country].filter(Boolean).join(", ") || "Location unavailable";
    return (
        <li className="flex">
            <Link
                href={`/races/${race.round}?year=${season}`}
                className={cn(
                    "group flex w-full flex-col gap-4 rounded-lg border bg-card p-5 transition-all duration-200",
                    "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg",
                    "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                    (status === "next" || status === "live") &&
                        "border-accent/60 ring-1 ring-accent/30",
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold tracking-wider text-accent-soft-foreground">
                        R{String(race.round).padStart(2, "0")}
                    </span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold leading-snug">{race.event_name}</h2>
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{place}</span>
                        </p>
                    </div>
                    <CircuitImage
                        src={race.circuit_image}
                        alt={`${race.event_name} circuit layout`}
                        className="h-14 w-[4.5rem]"
                    />
                </div>
                <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 tabular-nums">
                        <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                        {formatDateRange(race.date_start, race.date)}
                    </span>
                    <span className="flex items-center gap-1 transition-colors group-hover:text-foreground">
                        Details
                        <ArrowUpRight
                            aria-hidden="true"
                            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                    </span>
                </div>
            </Link>
        </li>
    );
}
