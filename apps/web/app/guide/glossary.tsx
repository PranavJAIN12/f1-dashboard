import type { ReactNode } from "react";
import { Cite } from "./sources";
import { Tag } from "./ui";
import type { Scope } from "./ui";

type Entry = { term: string; scope?: Scope; body: ReactNode };

// Alphabetical by term. Sentences without a citation are plain-language explanations.
const ENTRIES: Entry[] = [
    {
        term: "Active aero",
        scope: "2026",
        body: (
            <>
                Front and rear wings that change angle during a lap: closed in corners for
                downforce, open on straights to cut drag. The FIA calls the two positions Corner
                Mode and Straight Mode.
                <Cite id={["terms2026", "fiaB"]} />
            </>
        ),
    },
    {
        term: "Apex",
        body: (
            <>
                The point of the racing line closest to the inside kerb of a corner.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Box (“box, box, box”)",
        body: (
            <>
                The pit box where a car stops. “Box, box, box” is the radio call telling a driver to
                pit.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Boost button",
        scope: "2026",
        body: (
            <>
                A button the driver can press at any point in a lap to trigger a change in power
                unit settings, either back to maximum power or a team-chosen profile.
                <Cite id="terms2026" />
            </>
        ),
    },
    {
        term: "Chequered flag",
        body: (
            <>
                Waved at the end of a session or race.
                <Cite id="fiaH" />
            </>
        ),
    },
    {
        term: "Chicane",
        body: (
            <>
                A tight sequence of alternating corners.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Classified",
        body: (
            <>
                A car appears in the official results if it completed at least 90% of the winner’s
                laps (rounded down), even if it retired before the end.
                <Cite id={["fiaB", "glossary"]} />
            </>
        ),
    },
    {
        term: "Constructor",
        body: (
            <>
                The official word for an F1 team, which must design and build its own car.
                <Cite id="glossary" /> The Constructors’ Championship title goes to this entity,
                even if it does not make its own power unit.
                <Cite id="fiaA" />
            </>
        ),
    },
    {
        term: "Degradation",
        body: (
            <>
                The loss of tyre performance as the tyre wears.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Delta",
        body: (
            <>
                A time difference. It is negative if a driver is faster than the reference and
                positive if slower.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "DNF, DNS, DSQ, DNQ",
        body: (
            <>
                <strong>DNF</strong>: did not finish. <strong>DNS</strong>: qualified but did not
                start. <strong>DSQ</strong>: disqualified. <strong>DNQ</strong>: did not qualify,
                for example by failing to set a Q1 time within 107% of the fastest (unless it is
                wet).
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "DRS (Drag Reduction System)",
        scope: "general",
        body: (
            <>
                A flap on the rear wing that opened on set straights to reduce drag and help a
                chasing car. It was used from 2011 and is <strong>removed for 2026</strong>,
                replaced by active aero and Overtake Mode.
                <Cite id={["terms2026", "glossary"]} />
            </>
        ),
    },
    {
        term: "Fastest lap",
        body: (
            <>
                The quickest single lap of a race. It no longer earns a championship point (the
                bonus point existed from 2019 to 2024 and was scrapped for 2025).
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Formation lap",
        body: (
            <>
                The warm-up lap before the race, when drivers weave to heat their tyres before
                returning to their grid slots.
                <Cite id={["glossary", "weekend"]} />
            </>
        ),
    },
    {
        term: "Graining",
        body: (
            <>
                When the hot surface of a tyre tears into small pieces that stick back on and cut
                grip.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Grid and grid penalty",
        body: (
            <>
                The grid is the starting order. A grid penalty makes a driver start further back
                than they qualified.
                <Cite id={["glossary", "fiaB"]} />
            </>
        ),
    },
    {
        term: "Interval (gap)",
        body: (
            <>
                The time gap to the car ahead, more commonly just called “the gap”.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "In-lap and out-lap",
        body: (
            <>
                The in-lap is the lap that ends with a pit stop. The out-lap is the lap that starts
                from the pit lane.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Kerb",
        body: (
            <>
                The raised border at the edge of a corner. White lines count as track; kerbs do not.
                <Cite id={["glossary", "fiaB"]} />
            </>
        ),
    },
    {
        term: "Lapped",
        body: (
            <>
                A car that has been overtaken by a rival who is a full lap ahead.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Lift and coast",
        body: (
            <>
                Lifting off the throttle early before a braking zone to save fuel or energy.
                Refuelling during a race is banned.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Overcut",
        body: (
            <>
                Pitting later than the car ahead, the opposite of an undercut.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Overtake Mode",
        scope: "2026",
        body: (
            <>
                A 2026 aid for closer racing. It can only be activated within one second of the car
                in front at the detection point, and gives extra recharge and extra electrical power
                on the following lap.
                <Cite id={["terms2026", "pu2026"]} />
            </>
        ),
    },
    {
        term: "Parc fermé",
        body: (
            <>
                French for “closed park”. From the first pit exit in Qualifying (or Sprint
                Qualifying) until the start, teams may not change parts or set-up except for listed
                work. Breaking the rule means starting from the pit lane.
                <Cite id={["fiaB", "glossary"]} />
            </>
        ),
    },
    {
        term: "Pit window",
        body: (
            <>
                The range of laps in which a pit stop is expected to happen.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Pole position",
        body: (
            <>
                First place on the starting grid, usually earned with the fastest qualifying time.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Race Director and stewards",
        body: (
            <>
                The Race Director runs the session, including the start sequence. The stewards
                investigate incidents and decide penalties. The FIA nominates both.
                <Cite id={["fiaB", "weekend"]} />
            </>
        ),
    },
    {
        term: "Recharge",
        scope: "2026",
        body: (
            <>
                Harvesting electrical energy back into the battery under braking, on part throttle,
                when lifting off, or when “super clipping” at the end of a straight.
                <Cite id="terms2026" />
            </>
        ),
    },
    {
        term: "Red flag, Safety Car, Virtual Safety Car",
        body: (
            <>
                A red flag stops the session. The Safety Car leads the field at reduced speed when
                there is danger but the race need not stop. Under the Virtual Safety Car, drivers
                must not go faster than a set time in each sector, with no physical car on track.
                <Cite id="fiaB" />
            </>
        ),
    },
    {
        term: "Sector",
        body: (
            <>
                A lap is timed in three sectors. On timing screens purple is the fastest overall,
                green a personal best, and yellow slower.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Slipstream (tow)",
        body: (
            <>
                The aerodynamic benefit a chasing car gets by driving close behind another on a
                straight.
                <Cite id="glossary" />
            </>
        ),
    },
    {
        term: "Sprint",
        body: (
            <>
                A short race of about 100 km on six weekends in 2026, with points for the top eight
                and no mandatory pit stop.
                <Cite id="sprint" />
            </>
        ),
    },
    {
        term: "Stint",
        body: <>A run of consecutive laps on one set of tyres, between two pit stops.</>,
    },
    {
        term: "Track limits",
        body: (
            <>
                The white lines at the edge of the track. A car has left the track only when no part
                of it is on the track surface; lap times can be deleted and repeat offenders
                penalised.
                <Cite id={["fiaB", "glossary"]} />
            </>
        ),
    },
    {
        term: "Tyre compound",
        body: (
            <>
                The rubber mix of a tyre. Pirelli’s 2026 dry range runs from C1 (hardest) to C5
                (softest); three are chosen for each weekend and labelled hard, medium and soft.
                <Cite id={["pirelliRange", "pirelliF1"]} />
            </>
        ),
    },
    {
        term: "Undercut",
        body: (
            <>
                Pitting earlier than the car ahead, to gain time on fresher tyres and come out in
                front once they have stopped too.
                <Cite id="glossary" /> See the worked example above.
            </>
        ),
    },
    {
        term: "Under investigation",
        body: (
            <>
                A message sent to all teams saying the stewards are looking at an incident. If it
                appears within 60 minutes after a session, the drivers named may not leave the
                circuit without consent.
                <Cite id="fiaB" />
            </>
        ),
    },
];

const slug = (term: string) =>
    term
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

const letterOf = (term: string) =>
    term
        .replace(/[^A-Za-z]/g, "")
        .charAt(0)
        .toUpperCase();
const LETTERS = [...new Set(ENTRIES.map((e) => letterOf(e.term)))];

export function Glossary() {
    return (
        <div className="space-y-5">
            <nav aria-label="Glossary letters">
                <ul className="flex flex-wrap gap-1.5">
                    {LETTERS.map((letter) => (
                        <li key={letter}>
                            <a
                                href={`#glossary-${letter}`}
                                className="flex h-9 w-9 items-center justify-center rounded-md border bg-card font-mono text-sm font-bold hover:border-border-strong hover:bg-muted"
                            >
                                {letter}
                                <span className="sr-only"> terms</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <dl className="grid gap-3 md:grid-cols-2">
                {ENTRIES.map((entry, i) => {
                    const letter = letterOf(entry.term);
                    const firstOfLetter = letterOf(ENTRIES[i - 1]?.term ?? "") !== letter;
                    return (
                        <div
                            key={entry.term}
                            id={firstOfLetter ? `glossary-${letter}` : `term-${slug(entry.term)}`}
                            className="scroll-mt-24 rounded-lg border bg-card p-4"
                        >
                            <dt className="flex flex-wrap items-center gap-2 font-semibold">
                                {entry.term}
                                {entry.scope ? <Tag scope={entry.scope} /> : null}
                            </dt>
                            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {entry.body}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}
