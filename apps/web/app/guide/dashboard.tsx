import {
    Activity,
    ArrowRight,
    BookOpen,
    ChartColumn,
    Flag,
    GitCompareArrows,
    LayoutDashboard,
    Radio,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AnnotatedTrace, TRACE_NOTES } from "./diagrams";
import { Cite, External, LAST_UPDATED, SourceList } from "./sources";
import { BulletList, Callout, Figure, H3, Kbd, P, Section, Tag } from "./ui";

type Status = "Available" | "Placeholder" | "Not enabled";

const pages: {
    name: string;
    href: string;
    icon: LucideIcon;
    status: Status;
    text: string;
    use: string;
}[] = [
    {
        name: "Overview",
        href: "/",
        icon: LayoutDashboard,
        status: "Available",
        text: "A season summary (race weekends, completed, next up, countries), the next three weekends, and shortcuts to the other pages.",
        use: "Start here to see where the season stands.",
    },
    {
        name: "Races",
        href: "/races",
        icon: Flag,
        status: "Available",
        text: "A season selector and the full calendar as cards, each with a status badge, circuit outline and dates.",
        use: "Pick a season, then open a race weekend.",
    },
    {
        name: "Race detail",
        href: "/races",
        icon: Flag,
        status: "Available",
        text: "Opened from a race card. Session tabs, a results snapshot, results, pit stops, lap data and track conditions.",
        use: "Read what happened in a session.",
    },
    {
        name: "Race results",
        href: "/drivers",
        icon: Users,
        status: "Available",
        text: "Finishing order, points, starting grid and fastest lap for one race. Not season standings.",
        use: "See how the drivers finished in the selected race.",
    },
    {
        name: "Telemetry",
        href: "/telemetry",
        icon: Activity,
        status: "Available",
        text: "Speed, throttle, brake, gear, RPM and DRS traces for one lap, a lap summary and a track map. Compare two drivers.",
        use: "Find where one lap was won or lost.",
    },
    {
        name: "Compare",
        href: "/compare",
        icon: GitCompareArrows,
        status: "Placeholder",
        text: "Currently lists two API endpoints for driver comparison. There is no chart or form yet.",
        use: "For a head-to-head today, use Telemetry with two drivers.",
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: ChartColumn,
        status: "Placeholder",
        text: "Currently lists eight analytics API endpoints (pace, sector times, tyre strategy and more). No charts yet.",
        use: "Developers can call the endpoints directly.",
    },
    {
        name: "Live",
        href: "/live",
        icon: Radio,
        status: "Not enabled",
        text: "Lists five live-timing API endpoints. Live data needs a paid OpenF1 plan and is not enabled.",
        use: "Nothing to use yet.",
    },
    {
        name: "Guide",
        href: "/guide",
        icon: BookOpen,
        status: "Available",
        text: "This page.",
        use: "Look up a term, a rule or a metric.",
    },
];

const statusStyle: Record<Status, string> = {
    Available: "border-transparent bg-accent-soft text-accent-soft-foreground",
    Placeholder: "border-border bg-muted text-muted-foreground",
    "Not enabled": "border-border-strong text-muted-foreground",
};

type Metric = { name: string; meaning: string; unit: string; period: string; caveat: string };

const metricGroups: { title: string; where: string; metrics: Metric[] }[] = [
    {
        title: "Season summary",
        where: "Overview and Races",
        metrics: [
            {
                name: "Race weekends",
                meaning: "How many race weekends OpenF1 lists for the season.",
                unit: "Count",
                period: "Whole season",
                caveat: "Follows OpenF1’s calendar, which may differ from the official one.",
            },
            {
                name: "Completed (x of N) and progress bar",
                meaning: "How many weekends have finished.",
                unit: "Count, and share of the season",
                period: "Season to date, at the moment you open the page",
                caveat: "A weekend counts as completed 30 minutes after it ends.",
            },
            {
                name: "Next up",
                meaning:
                    "The next weekend that has not started, with its dates. Shows “Season complete” after the finale.",
                unit: "Name and date range",
                period: "Upcoming",
                caveat: "Dates are in UTC, so the day can differ from local time.",
            },
            {
                name: "Countries",
                meaning: "How many different countries host a weekend.",
                unit: "Count",
                period: "Whole season",
                caveat: "Counts the country names in the calendar.",
            },
        ],
    },
    {
        title: "Race weekend and results",
        where: "Race detail",
        metrics: [
            {
                name: "Sessions, Circuit, Country",
                meaning: "Number of sessions listed for the weekend, and where it is held.",
                unit: "Count and text",
                period: "One weekend",
                caveat: "Names come from OpenF1.",
            },
            {
                name: "Classified drivers and “N classified” badge",
                meaning: "The number of rows in the selected session’s results table.",
                unit: "Count",
                period: "One session",
                caveat: "To confirm: the count appears to include retirements, which differs from the official 90% rule.",
            },
            {
                name: "Snapshot (Winner, Pole or Fastest) and Podium",
                meaning:
                    "The leader of the session: Winner for a Race or Sprint, Pole for qualifying, Fastest for practice. The podium shows the top three.",
                unit: "Name, team, points",
                period: "One session",
                caveat: "Only shown once the session has finished.",
            },
            {
                name: "Results: Pos, Grid, Laps, Fastest lap, Pts, Status",
                meaning:
                    "Finishing position; starting position; laps completed; the driver’s best lap time in that session; points scored in that session; and Finished, Retired, Did not start or Disqualified (or the gap text OpenF1 provides).",
                unit: "Positions, laps, m:ss.mmm, points",
                period: "One session",
                caveat: "Grid is taken from the qualifying session’s starting-grid data and is “-” for other sessions. Pts only appears for Race and Sprint, and is what OpenF1 reports.",
            },
            {
                name: "Pit stops: Lap, Pit lane, Stationary, Recorded",
                meaning:
                    "The lap of the stop; time spent in the pit lane; time the car was stationary; and a timestamp.",
                unit: "Lap number, seconds, UTC time",
                period: "One session",
                caveat: "OpenF1 does not say exactly where the recorded time falls, so treat it as a timestamp only. A dash means no value was reported.",
            },
            {
                name: "Lap data: Time, Tyre, Pos",
                meaning:
                    "Each lap’s time, the tyre compound fitted, and the driver’s running position at the end of the lap.",
                unit: "m:ss.mmm, compound name, position",
                period: "Every lap in the session",
                caveat: "Compound names are as reported by OpenF1. Position is worked out from OpenF1’s position feed.",
            },
            {
                name: "Track conditions",
                meaning:
                    "Average air and track temperature, the air-temperature range, the number of rain readings, and a table of readings over the session.",
                unit: "°C (shown as “C”), %, hPa, m/s, time since session start",
                period: "Across the session",
                caveat: "Rain samples is a count of readings flagged as rain, not minutes of rain.",
            },
        ],
    },
    {
        title: "Race results page",
        where: "Race results",
        metrics: [
            {
                name: "Points, Grid and Best lap",
                meaning:
                    "Points from that race only; the starting slot with a triangle for places gained or lost (grid minus finish); and the driver’s best lap time.",
                unit: "Points, positions, m:ss.mmm",
                period: "One reference race",
                caveat: "Not championship totals. The page names the race it uses.",
            },
            {
                name: "Drivers, Teams, Winner, Fastest lap",
                meaning:
                    "Entrants in that race, distinct teams, the winner, and the quickest best lap among all drivers.",
                unit: "Counts, name, m:ss.mmm",
                period: "One reference race",
                caveat: "“Fastest lap” is the lowest best-lap time in the data, with no bonus point attached.",
            },
        ],
    },
    {
        title: "Telemetry",
        where: "Telemetry",
        metrics: [
            {
                name: "Lap time and gap to the first driver",
                meaning: "The chosen lap’s time, and how far the second driver is from the first.",
                unit: "m:ss.mmm; seconds (+ means slower)",
                period: "One lap per driver",
                caveat: "Compare laps like for like: tyres, fuel and traffic differ.",
            },
            {
                name: "Sectors S1, S2, S3",
                meaning:
                    "Time for each third of the lap. Purple means equal to or faster than the best of any lap in the session.",
                unit: "Seconds",
                period: "One lap",
                caveat: "“Best” is measured across every lap in the session, not only the two chosen.",
            },
            {
                name: "Top speed and Min speed",
                meaning: "Highest and lowest speed samples on the lap.",
                unit: "km/h",
                period: "One lap",
                caveat: "Based on sampled data, so a true peak can be slightly missed.",
            },
            {
                name: "Full throttle and Braking",
                meaning:
                    "Share of the lap’s samples with throttle at 99% or more, and share with the brake applied.",
                unit: "% of samples",
                period: "One lap",
                caveat: "A share of samples, which is close to but not exactly a share of time or distance.",
            },
            {
                name: "Lap traces",
                meaning:
                    "Speed, Throttle, Brake (on or off), Gear, RPM and DRS (Open or Closed) along the lap, plus “Gap to first driver” when two drivers are shown.",
                unit: "km/h, %, on/off, gear, rpm, open/closed, seconds",
                period: "One lap",
                caveat: "Distance on the horizontal axis is estimated from speed, and the second lap is stretched to the first lap’s length so corners line up.",
            },
            {
                name: "Track map",
                meaning:
                    "The lap path coloured by speed (blue slow to red fast), or, when comparing, by which driver was quicker through each 1/25th of the lap.",
                unit: "Colour",
                period: "One lap",
                caveat: "Drawn from position data, so it is an outline, not a surveyed circuit. “S/F” marks the start of the lap.",
            },
        ],
    },
];

function MetricCard({ metric }: { metric: Metric }) {
    const rows: [string, string][] = [
        ["Meaning", metric.meaning],
        ["Unit", metric.unit],
        ["Time period", metric.period],
        ["Watch out", metric.caveat],
    ];
    return (
        <div className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-semibold">{metric.name}</h4>
            <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[6.5rem_1fr]">
                {rows.map(([label, value]) => (
                    <div key={label} className="contents">
                        <dt className="label pt-0.5">{label}</dt>
                        <dd className="text-muted-foreground">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export function DashboardSection() {
    return (
        <Section id="dashboard" number="08" kicker="This website" title="Using this dashboard">
            <Callout kind="note" title="Where this section comes from">
                <p>
                    It is written from the dashboard’s own source code and README, as they stood on
                    the last-updated date, not from a feature wish-list. Anything the code does not
                    make clear is marked <Tag scope="confirm" /> so it can be checked by the project
                    owner.
                </p>
            </Callout>

            <H3>What APEX is for</H3>
            <P>
                APEX (“F1 Race Intelligence”) is a workspace for exploring Formula 1 data after the
                fact. You can browse a season’s calendar, open a finished session to see results,
                pit stops, laps and weather, and compare two drivers’ laps in detail on the
                Telemetry page.
            </P>
            <BulletList>
                <li>
                    <strong>Data source:</strong>{" "}
                    <External href="https://openf1.org">OpenF1</External>
                    : schedule, results, laps, tyre stints, pit stops, weather and car telemetry. No
                    account or key is needed.
                    <Cite id="openf1" />
                </li>
                <li>
                    <strong>Time span:</strong> the 2023 season onwards. The header shows
                    “Historical mode”: only finished sessions are available, and live data is not
                    enabled.
                </li>
                <li>
                    <strong>Licence:</strong> OpenF1 data is for non-commercial use.
                </li>
                <li>
                    <strong>Speed:</strong> the first time a race is opened it can load slowly,
                    because OpenF1’s free tier limits requests. Repeat visits are served from a
                    cache.
                </li>
            </BulletList>

            <H3>Pages at a glance</H3>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pages.map(({ name, href, icon: Icon, status, text, use }) => (
                    <li key={name} className="flex">
                        <Link
                            href={href}
                            className="group flex w-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong hover:bg-muted/40"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent-soft-foreground">
                                    <Icon aria-hidden="true" className="h-5 w-5" />
                                </span>
                                <span
                                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${statusStyle[status]}`}
                                >
                                    {status}
                                </span>
                            </div>
                            <div>
                                <p className="flex items-center gap-1 font-semibold">
                                    {name}
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                                    />
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                                <p className="mt-2 text-xs font-medium text-foreground/80">{use}</p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
            <P className="text-sm text-muted-foreground">
                The sidebar also has <strong>Swagger</strong> and <strong>ReDoc</strong> links under
                “API”. They open the data engine’s generated API documentation in a new tab.
            </P>

            <H3>How to navigate</H3>
            <ol className="max-w-prose list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-foreground/90 marker:font-semibold marker:text-accent-soft-foreground">
                <li>
                    <strong>Move between pages</strong> with the sidebar on wide screens (1024 px
                    and up), or the <Kbd>Open menu</Kbd> button in the top bar on smaller ones.
                </li>
                <li>
                    <strong>Choose a season</strong> with the Season selector on Races (2023 up to
                    the latest season). Telemetry has its own Season selector. Overview and Drivers
                    use the season the site is configured to show.
                </li>
                <li>
                    <strong>Open a weekend</strong> by clicking a race card. Use the session tabs
                    (for example Qualifying or Race). Finished sessions are clickable; others are
                    dashed and show their start time in UTC. Use “All races” to go back.
                </li>
                <li>
                    <strong>Share a view.</strong> Telemetry keeps every choice in the page address,
                    so you can bookmark or send a link to an exact lap comparison.
                </li>
                <li>
                    <strong>Comfort and access.</strong> The Theme selector offers System, Light and
                    Dark. Pressing Tab on any page first reveals a “Skip to main content” link.
                </li>
            </ol>

            <H3>Reading a race page</H3>
            <P>
                Open a finished race from{" "}
                <Link href="/races" className="font-medium underline">
                    Races
                </Link>
                . Reading the sections in this order works well for a newcomer:
            </P>
            <ol className="max-w-prose list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-foreground/90 marker:font-semibold marker:text-accent-soft-foreground">
                <li>
                    <strong>Snapshot.</strong> The Winner (or Pole, or Fastest) and the podium, with
                    a badge marking official results.
                </li>
                <li>
                    <strong>Results.</strong> Compare <em>Grid</em> with <em>Pos</em> to see who
                    gained places. Long tables are split into pages; use the page controls
                    underneath.
                </li>
                <li>
                    <strong>Pit stops.</strong> Who stopped, on which lap, and for how long.
                </li>
                <li>
                    <strong>Lap data.</strong> The <em>Tyre</em> column shows compound changes,
                    which reveal each driver’s strategy.
                </li>
                <li>
                    <strong>Track conditions.</strong> Temperatures and rain readings explain swings
                    in pace.
                </li>
            </ol>

            <H3>Using the Telemetry page</H3>
            <ol className="max-w-prose list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-foreground/90 marker:font-semibold marker:text-accent-soft-foreground">
                <li>
                    Pick a <strong>Season</strong>, <strong>Race</strong> (finished races only) and{" "}
                    <strong>Session</strong>. By default the page opens the latest finished race.
                </li>
                <li>
                    Pick <strong>Driver A</strong> and a <strong>Lap A</strong>. Laps are listed
                    with their time and tyre, and the driver’s fastest is marked.
                </li>
                <li>
                    Optionally pick <strong>Driver B</strong> and <strong>Lap B</strong>, or choose
                    “No comparison”.
                </li>
                <li>
                    Hover over any chart. A marker follows the same point on the track map, and
                    every chart shows the same position on the lap.
                </li>
            </ol>
            <Figure
                scrollHint
                caption={
                    <>
                        <strong>Figure 8. How to read a lap trace.</strong> A hypothetical example
                        in the style of the Telemetry page: a speed chart for two drivers, throttle
                        for Driver A, and when Driver A brakes. The real page also shows gear, RPM,
                        DRS and the gap between drivers.
                    </>
                }
            >
                <AnnotatedTrace />
                <ol className="mt-4 space-y-1.5 text-sm">
                    {TRACE_NOTES.map((note, i) => (
                        <li key={note} className="flex gap-2">
                            <span
                                aria-hidden="true"
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold"
                            >
                                {i + 1}
                            </span>
                            <span>
                                <span className="sr-only">Marker {i + 1}: </span>
                                {note}
                            </span>
                        </li>
                    ))}
                </ol>
            </Figure>

            <H3>What each metric means</H3>
            <P>
                Units and time periods are as shown on screen. Times are written
                minutes:seconds.thousandths (for example 1:30.412).
            </P>
            <div className="space-y-8">
                {metricGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                            <h4 className="text-base font-semibold">{group.title}</h4>
                            <span className="label">{group.where}</span>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                            {group.metrics.map((m) => (
                                <MetricCard key={m.name} metric={m} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <H3 id="dashboard-limits">Limitations to keep in mind</H3>
            <BulletList>
                <li>
                    <strong>Historical only.</strong> A session opens about 30 minutes after it
                    ends. From 30 minutes before it starts until 30 minutes after it ends, OpenF1
                    treats it as live, and the dashboard shows a “live or just ended” message.
                </li>
                <li>
                    <strong>2023 onwards.</strong> Earlier seasons are not available.
                </li>
                <li>
                    <strong>No season standings.</strong> There is no driver or constructor
                    standings page. Points on the dashboard belong to one session.
                </li>
                <li>
                    <strong>Placeholders.</strong> Compare, Analytics and Live list API endpoints
                    only; they do not draw charts.
                </li>
                <li>
                    <strong>Telemetry is approximate.</strong> Distance along the lap is estimated
                    from speed. Brake is shown only as on or off. A lap with no recorded timing
                    cannot be loaded.
                </li>
                <li>
                    <strong>What telemetry does not show.</strong> There is no panel for Overtake
                    Mode, active-aero position or battery charge, which matter for 2026 cars.
                </li>
                <li>
                    <strong>Derived columns.</strong> Grid, Fastest lap and Pos are worked out from
                    OpenF1 feeds and may not match the official classification in unusual cases.
                </li>
            </BulletList>

            <Callout kind="confirm" title="To confirm with the project owner">
                <ol className="list-decimal space-y-1.5 pl-5">
                    <li>
                        The Overview page tags Telemetry as “API only”, but the Telemetry page is a
                        working workspace. The tag looks out of date.
                    </li>
                    <li>
                        Which season and race the deployed site defaults to. The code default is
                        2026 (<Kbd>DEFAULT_SEASON</Kbd>), and the Race results page uses round 8 of
                        that season.
                    </li>
                    <li>
                        Whether season standings will be added, and whether Compare and Analytics
                        will get a visual interface. Two analytics endpoints currently return other
                        endpoints’ data: <Kbd>degradation</Kbd> returns the pace data and{" "}
                        <Kbd>stints</Kbd> returns the tyre-strategy data.
                    </li>
                    <li>
                        How OpenF1 reports the DRS channel for 2026 sessions, since 2026 cars have
                        no DRS. The Telemetry DRS panel may not be meaningful for 2026.
                    </li>
                    <li>
                        Whether the “classified” count, the Grid column (taken from qualifying data)
                        and the Fastest lap column (best lap in the lap data) match the official
                        definitions.
                    </li>
                    <li>
                        Season length: the official 2026 calendar page listed 23 rounds while some
                        F1 explainer text says 24. The Races page shows whatever OpenF1 lists.
                        <Cite id={["calendar", "whatIsF1"]} />
                    </li>
                </ol>
            </Callout>
        </Section>
    );
}

export function SourcesSection() {
    return (
        <Section id="sources" number="09" kicker="Transparency" title="Sources and last updated">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-card p-5">
                    <p className="label">Last updated</p>
                    <p className="mt-1 text-xl font-bold">
                        <time dateTime={LAST_UPDATED.iso}>{LAST_UPDATED.text}</time>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Rules checked against the 2026 FIA F1 Regulations (Section A Issue 03 and
                        Section B Issue 07, both dated 25 June 2026), the FIA Appendices H and L,
                        and the Formula 1 and Pirelli pages below, all read on that date.
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-5 text-sm">
                    <p className="font-semibold">Where sources disagree</p>
                    <BulletList>
                        <li>
                            Q3 length: the F1 glossary says 12 minutes; the FIA text and the F1
                            weekend guide say 13. This page uses 13.
                        </li>
                        <li>
                            Tyre range: the glossary says C1 to C6; Pirelli says C1 to C5 for 2026.
                            This page uses C5.
                        </li>
                        <li>
                            Mandatory stop: the glossary says a stop is mandatory; the FIA text
                            requires two different dry compounds, not a stop as such.
                        </li>
                    </BulletList>
                </div>
            </div>
            <P className="text-sm text-muted-foreground">
                Statements about the dashboard come from its own code. Everything else is cited with
                a number that links to the list below. Hypothetical examples are labelled and are
                not sourced. If you spot something out of date, check the original source before
                relying on this page.
            </P>
            <SourceList />
        </Section>
    );
}

export function NextSection() {
    const next: { title: string; href: string; text: string; cta: string }[] = [
        {
            title: "Open a finished race",
            href: "/races",
            text: "Read the Snapshot, then compare Grid with Pos in the results to see who gained places.",
            cta: "Go to Races",
        },
        {
            title: "Work out a strategy",
            href: "/races",
            text: "On a race page, read Pit stops and the Tyre column in Lap data to see who stopped when. Then revisit the undercut example.",
            cta: "Pick a race",
        },
        {
            title: "Compare two laps",
            href: "/telemetry",
            text: "Choose two drivers and look for where the speed lines separate, then check the track map.",
            cta: "Open Telemetry",
        },
        {
            title: "Explore race results",
            href: "/drivers",
            text: "See how every driver finished, with points, starting position and fastest lap.",
            cta: "See race results",
        },
    ];
    return (
        <Section id="next" number="10" kicker="Keep going" title="Where to go next">
            <ul className="grid gap-3 md:grid-cols-2">
                {next.map((n) => (
                    <li key={n.title} className="flex">
                        <Link
                            href={n.href}
                            className="group flex w-full flex-col gap-2 rounded-lg border bg-card p-5 transition-colors hover:border-border-strong hover:bg-muted/40"
                        >
                            <h3 className="font-semibold">{n.title}</h3>
                            <p className="text-sm text-muted-foreground">{n.text}</p>
                            <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-accent-soft-foreground">
                                {n.cta}
                                <ArrowRight
                                    aria-hidden="true"
                                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="rounded-lg border bg-muted/40 p-5 text-sm">
                <p className="font-semibold">Concepts worth learning next</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                    {[
                        ["Undercut and overcut", "#examples"],
                        ["Tyre compounds", "#race"],
                        ["Tie-breaks", "#championships"],
                        ["2026 active aero", "#race"],
                        ["Glossary", "#glossary"],
                    ].map(([label, href]) => (
                        <li key={label}>
                            <a
                                href={href}
                                className="inline-flex rounded-md border bg-card px-3 py-1.5 font-medium hover:border-border-strong hover:bg-muted"
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-muted-foreground">
                    For season-long standings, see the official{" "}
                    <External href="https://www.formula1.com/en/results/2026/drivers">
                        Formula 1 results and standings
                    </External>
                    .
                </p>
            </div>
        </Section>
    );
}
