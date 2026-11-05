import Link from "next/link";
import { connection } from "next/server";
import {
    Activity,
    ArrowRight,
    BookOpen,
    ChartColumn,
    Flag,
    GitCompareArrows,
    Radio,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorState, StateMessage } from "@/components/data-state";
import { RaceCard } from "@/components/race-card";
import { SeasonStats } from "@/components/season-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { getRaces } from "@/lib/engine";
import { apiLinks } from "@/lib/navigation";
import { DEFAULT_SEASON, FIRST_SEASON, raceStatuses } from "@/lib/selection";

type Feature = {
    label: string;
    href: string;
    icon: LucideIcon;
    text: string;
    tag: { label: string; variant: "accent" | "secondary" | "outline" };
};

const features: Feature[] = [
    {
        label: "Races",
        href: "/races",
        icon: Flag,
        text: "Season calendar with session results, pit stops, laps and weather.",
        tag: { label: "Available", variant: "accent" },
    },
    {
        label: "Drivers",
        href: "/drivers",
        icon: Users,
        text: "Driver classification and points from a reference race weekend.",
        tag: { label: "Available", variant: "accent" },
    },
    {
        label: "Compare",
        href: "/compare",
        icon: GitCompareArrows,
        text: "Head-to-head driver pace and telemetry comparison.",
        tag: { label: "API only", variant: "secondary" },
    },
    {
        label: "Telemetry",
        href: "/telemetry",
        icon: Activity,
        text: "Speed, throttle, brake and gear traces for any lap.",
        tag: { label: "API only", variant: "secondary" },
    },
    {
        label: "Analytics",
        href: "/analytics",
        icon: ChartColumn,
        text: "Race pace, sector times, tyre strategy and position changes.",
        tag: { label: "API only", variant: "secondary" },
    },
    {
        label: "Live",
        href: "/live",
        icon: Radio,
        text: "Live timing needs a paid OpenF1 plan and is not enabled.",
        tag: { label: "Not enabled", variant: "outline" },
    },
];

export default async function Home() {
    await connection(); // Request-time only, so the build never needs the provider.
    const res = await getRaces(DEFAULT_SEASON);
    const docs = apiLinks(env.NEXT_PUBLIC_DATA_ENGINE_URL)[0];

    // Three weekends starting at the next one; after the finale, the last three.
    const races = res.ok ? res.data.races : [];
    const statuses = raceStatuses(races);
    const next = statuses.findIndex((s) => s === "next" || s === "live");
    const start = next >= 0 ? next : Math.max(0, races.length - 3);

    return (
        <div className="content">
            <section className="relative overflow-hidden rounded-lg border bg-card p-6 sm:p-10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_20rem_at_100%_0%,hsl(var(--accent)_/_0.16),transparent)]"
                />
                <div className="relative max-w-2xl">
                    <div className="eyebrow">APEX / Race Intelligence</div>
                    <h1 className="mt-3">
                        Read the race.
                        <br />
                        Find the time.
                    </h1>
                    <p className="mt-4 max-w-xl text-base text-muted-foreground">
                        F1 session data, telemetry and strategy analytics in one engineering-focused
                        workspace.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link href={`/races?year=${DEFAULT_SEASON}`}>
                                Browse races
                                <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <a href={docs.href} target="_blank" rel="noopener noreferrer">
                                <BookOpen aria-hidden="true" className="h-4 w-4" />
                                API docs
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="section-heading mb-3">
                    <h2>{DEFAULT_SEASON} season</h2>
                    <Link
                        href={`/races?year=${DEFAULT_SEASON}`}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Full schedule
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </div>
                {!res.ok ? (
                    <ErrorState error={res.error} />
                ) : !races.length ? (
                    <StateMessage tone="empty">
                        OpenF1 lists no race weekends for {DEFAULT_SEASON} yet.
                    </StateMessage>
                ) : (
                    <>
                        <SeasonStats races={races} statuses={statuses} />
                        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {races.slice(start, start + 3).map((race, i) => (
                                <RaceCard
                                    key={race.round}
                                    race={race}
                                    season={DEFAULT_SEASON}
                                    status={statuses[start + i]}
                                />
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <section className="section">
                <h2 className="mb-3">Explore</h2>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {features.map(({ label, href, icon: Icon, text, tag }) => (
                        <li className="flex" key={href}>
                            <Link
                                href={href}
                                className="group flex w-full flex-col gap-3 rounded-lg border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent-soft-foreground">
                                        <Icon aria-hidden="true" className="h-5 w-5" />
                                    </span>
                                    <Badge variant={tag.variant}>{tag.label}</Badge>
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-1 text-base font-semibold">
                                        {label}
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                                        />
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <p className="muted section">
                Data from OpenF1, {FIRST_SEASON} season onwards, for non-commercial use.
            </p>
        </div>
    );
}
