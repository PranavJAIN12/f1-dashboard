import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSection, NextSection, SourcesSection } from "./dashboard";
import { ExamplesSection, FactsSection } from "./examples";
import { Glossary } from "./glossary";
import { BasicsSection, ChampionshipsSection, RaceSection, WeekendSection } from "./sections-f1";
import { Cite, LAST_UPDATED } from "./sources";
import { Section, Tag } from "./ui";

export const metadata: Metadata = {
    title: "The F1 Race Guide",
    description:
        "A beginner’s guide to Formula 1 rules, race weekends, points and jargon, and how to use the APEX dashboard.",
};

const contents = [
    { id: "basics", title: "F1 basics", text: "Drivers, teams, circuits, the FIA" },
    { id: "weekend", title: "The race weekend", text: "Practice, qualifying, Sprint, Grand Prix" },
    { id: "race", title: "How a race works", text: "Start, pit stops, tyres, flags, penalties" },
    { id: "championships", title: "Championships", text: "Points, constructors, tie-breaks" },
    { id: "glossary", title: "Glossary", text: "Pole, DNF, undercut, DRS and more" },
    { id: "examples", title: "Worked examples", text: "Qualifying, strategy, standings" },
    { id: "facts", title: "Facts and context", text: "What helps you read the data" },
    { id: "dashboard", title: "Using this dashboard", text: "Pages, charts, metrics, limits" },
    { id: "sources", title: "Sources", text: "Citations and last updated" },
    { id: "next", title: "Where to go next", text: "Your next steps" },
];

export default function Guide() {
    return (
        <div className="content">
            <article className="mx-auto max-w-5xl">
                <header className="relative overflow-hidden rounded-lg border bg-card p-6 sm:p-10">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_20rem_at_100%_0%,hsl(var(--accent)_/_0.16),transparent)]"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 h-12 w-40 bg-[conic-gradient(hsl(var(--foreground))_25%,transparent_0_50%,hsl(var(--foreground))_0_75%,transparent_0)] opacity-[0.12] [background-size:24px_24px]"
                    />
                    <div className="relative max-w-3xl">
                        <div className="eyebrow">APEX / Knowledge base</div>
                        <h1 className="mt-3">The F1 Race Guide: A New Fan’s Fieldbook</h1>
                        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                            The essentials of Formula 1—and how to explore them on this dashboard.
                        </p>
                        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock aria-hidden="true" className="h-4 w-4" />
                                Last updated:{" "}
                                <time
                                    dateTime={LAST_UPDATED.iso}
                                    className="font-semibold text-foreground"
                                >
                                    {LAST_UPDATED.text}
                                </time>
                            </span>
                            <span>Rules checked for the 2026 season</span>
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button asChild size="lg">
                                <a href="#basics">
                                    Start reading
                                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <a href="#dashboard">Jump to the dashboard guide</a>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/races">Open Races</Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <nav
                    id="contents"
                    aria-labelledby="contents-heading"
                    className="mt-8 scroll-mt-24 rounded-lg border bg-card p-5"
                >
                    <h2 id="contents-heading" className="text-base font-semibold">
                        Contents
                    </h2>
                    <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {contents.map((item, i) => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    className="flex h-full gap-3 rounded-md border px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-muted"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="font-mono text-sm font-bold text-accent-soft-foreground"
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold">
                                            {item.title}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {item.text}
                                        </span>
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <aside
                    aria-label="How to read this guide"
                    className="mt-6 rounded-lg border bg-muted/40 p-5 text-sm"
                >
                    <p className="font-semibold">How to read this guide</p>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        <li className="flex items-start gap-2">
                            <Tag scope="general" />
                            <span className="text-muted-foreground">True for most seasons.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Tag scope="2026" />
                            <span className="text-muted-foreground">
                                A rule or fact for the 2026 season only.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Tag scope="hypothetical" />
                            <span className="text-muted-foreground">
                                Invented numbers to explain an idea.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Tag scope="confirm" />
                            <span className="text-muted-foreground">
                                Not certain from the code or sources; needs checking.
                            </span>
                        </li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">
                        Numbers in square brackets, such as <Cite id="weekend" />, link to the
                        source list near the end. Where the FIA regulations and an explainer
                        disagree, this guide follows the FIA text.
                    </p>
                </aside>

                <BasicsSection />
                <WeekendSection />
                <RaceSection />
                <ChampionshipsSection />
                <Section id="glossary" number="05" kicker="Jargon buster" title="Glossary">
                    <Glossary />
                </Section>
                <ExamplesSection />
                <FactsSection />
                <DashboardSection />
                <SourcesSection />
                <NextSection />
            </article>
        </div>
    );
}
