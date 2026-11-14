import { Database, Gauge, Layers, Medal, Timer, Zap } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { QualifyingFunnel, StintChart } from "./diagrams";
import { Cite } from "./sources";
import { BulletList, Callout, Figure, H3, InfoCard, P, Section, Tag } from "./ui";

function Example({
    title,
    lead,
    children,
}: {
    title: string;
    lead: string;
    children: React.ReactNode;
}) {
    return (
        <article className="space-y-4 rounded-lg border border-dashed border-border-strong bg-card p-5">
            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Tag scope="hypothetical" />
                    <Tag scope="2026" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="max-w-prose text-sm text-muted-foreground">{lead}</p>
            </header>
            {children}
        </article>
    );
}

export function ExamplesSection() {
    return (
        <Section id="examples" number="06" kicker="Try the maths" title="Worked examples">
            <Callout kind="hypothetical" title="All numbers in this section are invented">
                <p>
                    The drivers, teams, lap times and results below are hypothetical and are not
                    taken from a real race. They use the 2026 rules explained earlier so you can
                    check each step. Real races have extra factors such as traffic, cold tyres and
                    safety cars.
                </p>
            </Callout>

            <Example
                title="Example A: qualifying and pole position"
                lead="Twenty-two cars start qualifying. Ten reach Q3, and the fastest of those takes pole."
            >
                <Figure
                    caption={
                        <>
                            Hypothetical knockout using the 2026 numbers: 22 cars in Q1, 16 in Q2
                            and 10 in Q3. <Cite id="fiaB" />
                        </>
                    }
                >
                    <QualifyingFunnel />
                </Figure>
                <div className="rounded-lg border bg-background/40 p-2">
                    <Table>
                        <caption className="sr-only">
                            Hypothetical top three Q3 lap times and gaps to the fastest
                        </caption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Grid</TableHead>
                                <TableHead>Driver</TableHead>
                                <TableHead>Best Q3 lap</TableHead>
                                <TableHead>Gap to pole</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                ["P1 (pole)", "Driver A", "1:30.412", "-"],
                                ["P2", "Driver B", "1:30.598", "+0.186 s"],
                                ["P3", "Driver C", "1:30.601", "+0.189 s"],
                            ].map((row) => (
                                <TableRow key={row[0]}>
                                    {row.map((cell, i) => (
                                        <TableCell
                                            key={i}
                                            className={
                                                i === 0 ? "font-semibold text-foreground" : ""
                                            }
                                        >
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <BulletList>
                    <li>
                        Lap times are written as minutes:seconds.thousandths, the same format the
                        dashboard uses.
                    </li>
                    <li>
                        Gap to pole: 1:30.598 minus 1:30.412 is 0.186 s. Driver C is only 0.003 s
                        slower than Driver B, yet takes P3.
                    </li>
                    <li>
                        The six drivers eliminated in Q1 start P17 to P22, and the six eliminated in
                        Q2 start P11 to P16.
                    </li>
                </BulletList>
            </Example>

            <Example
                title="Example B: a pit-stop strategy and the undercut"
                lead="Driver A leads Driver B by 1.5 s on lap 19 of a 50-lap race. Both are on worn Medium tyres lapping in 1:33.000."
            >
                <H3>Assumptions</H3>
                <BulletList>
                    <li>
                        A pit stop costs 21.0 s more than a normal lap (hypothetical; this varies by
                        circuit).
                    </li>
                    <li>Fresh Hard tyres are 1.5 s per lap faster than the worn Mediums.</li>
                    <li>
                        Driver B pits first (lap 20); Driver A responds two laps later (lap 22).
                    </li>
                </BulletList>
                <Figure
                    caption={
                        <>
                            Hypothetical stints. Driver B’s stint on Mediums ends on lap 20; Driver
                            A’s ends on lap 22. The Medium tyre has a yellow band and the Hard tyre
                            a white band.
                            <Cite id="pirelliF1" />
                        </>
                    }
                >
                    <StintChart />
                </Figure>
                <div className="rounded-lg border bg-background/40 p-2">
                    <Table>
                        <caption className="sr-only">
                            Hypothetical lap-by-lap times and the gap between Driver A and Driver B
                        </caption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lap</TableHead>
                                <TableHead>Driver A</TableHead>
                                <TableHead>Driver B</TableHead>
                                <TableHead>Gap after the lap</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                ["19", "1:33.000", "1:33.000", "B is 1.5 s behind"],
                                [
                                    "20",
                                    "1:33.000 (stays out)",
                                    "1:54.000 (pits: 1:33.000 + 21.0 s)",
                                    "B is 22.5 s behind",
                                ],
                                [
                                    "21",
                                    "1:33.000 (worn tyres)",
                                    "1:31.500 (fresh Hards)",
                                    "B is 21.0 s behind",
                                ],
                                [
                                    "22",
                                    "1:54.000 (pits: 1:33.000 + 21.0 s)",
                                    "1:31.500",
                                    "B is 1.5 s ahead",
                                ],
                            ].map((row) => (
                                <TableRow key={row[0]}>
                                    {row.map((cell, i) => (
                                        <TableCell
                                            key={i}
                                            className={
                                                i === 0 || i === 3
                                                    ? "font-semibold text-foreground"
                                                    : ""
                                            }
                                        >
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <BulletList>
                    <li>
                        Lap 20: B loses 21.0 s in the pits, so the gap becomes 1.5 + 21.0 = 22.5 s.
                    </li>
                    <li>Lap 21: B gains 1.5 s on fresh tyres, so 22.5 - 1.5 = 21.0 s.</li>
                    <li>
                        Lap 22: A pits and loses 21.0 s while B gains another 1.5 s on fresh tyres.
                        The gap changes by 21.0 + 1.5 = 22.5 s in B’s favour, from 21.0 s behind to
                        1.5 s ahead.
                    </li>
                    <li>
                        This is an <strong>undercut</strong>: B stopped first, used the speed of
                        fresh tyres, and came out ahead once A stopped too. If A had pitted first
                        and B stayed out, it would be an <strong>overcut</strong> attempt.
                        <Cite id="glossary" />
                    </li>
                </BulletList>
            </Example>

            <Example
                title="Example C: points and a change in the standings"
                lead="Points are added after every race. Small differences in one result can swap the order."
            >
                <H3>Adding points</H3>
                <BulletList>
                    <li>
                        A driver finishes 2nd, 4th and 1st in three Grands Prix: 18 + 12 + 25 = 55
                        points.
                    </li>
                    <li>
                        On a Sprint weekend a driver finishes 3rd in the Sprint (6 points) and 5th
                        in the Grand Prix (10 points): 6 + 10 = 16 points.
                    </li>
                    <li>A team’s cars finish 1st and 7th: 25 + 6 = 31 constructor points.</li>
                </BulletList>
                <P className="text-sm text-muted-foreground">
                    Uses the 2026 scales: Grand Prix 25, 18, 15, 12, 10, 8, 6, 4, 2, 1; Sprint 8 to
                    1.
                    <Cite id="fiaA" />
                </P>

                <H3>A change in the standings</H3>
                <div className="rounded-lg border bg-background/40 p-2">
                    <Table>
                        <caption className="sr-only">
                            Hypothetical Drivers’ Championship before and after one race
                        </caption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Driver</TableHead>
                                <TableHead>Points before</TableHead>
                                <TableHead>Race result</TableHead>
                                <TableHead>Points after</TableHead>
                                <TableHead>Standing after</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                ["Driver A", "100 (1st)", "3rd: +15", "115", "2nd"],
                                ["Driver B", "94 (2nd)", "1st: +25", "119", "1st"],
                                ["Driver C", "91 (3rd)", "6th: +8", "99", "3rd"],
                            ].map((row) => (
                                <TableRow key={row[0]}>
                                    {row.map((cell, i) => (
                                        <TableCell
                                            key={i}
                                            className={
                                                i === 0 || i === 4
                                                    ? "font-semibold text-foreground"
                                                    : ""
                                            }
                                        >
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <BulletList>
                    <li>
                        Driver B wins and gains 25 points: 94 + 25 = 119. Driver A takes 15 for
                        third: 100 + 15 = 115. Driver B moves from second to first.
                    </li>
                    <li>
                        <strong>Tie-break.</strong> Suppose Driver D and Driver E both have 119
                        points. Driver D has 2 wins and Driver E has 1 win, so Driver D ranks higher
                        however many second places Driver E has.
                        <Cite id="fiaA" />
                    </li>
                </BulletList>
            </Example>
        </Section>
    );
}

export function FactsSection() {
    return (
        <Section id="facts" number="07" kicker="Context" title="Useful facts and context">
            <P>
                Facts chosen because they help you read what the dashboard shows. Each is sourced;
                results and records are deliberately left out because they change quickly.
            </P>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoCard icon={Timer} title="Races are set by distance, not time" tag="general">
                    <p>
                        A Grand Prix is the fewest laps needed to exceed 305 km (260 km at Monaco),
                        with a 2-hour limit. That is why the <em>Laps</em> column differs between
                        circuits.
                        <Cite id={["weekend", "fiaB"]} />
                    </p>
                </InfoCard>
                <InfoCard icon={Gauge} title="Fast cars, slow pit lane" tag="general">
                    <p>
                        The pit lane limit is 80 km/h, yet a crew changes four tyres in under two
                        seconds. The dashboard’s pit-stop table separates time in the pit lane from
                        time stationary.
                        <Cite id={["fiaB", "whatIsF1"]} />
                    </p>
                </InfoCard>
                <InfoCard icon={Database} title="Cars are data factories" tag="general">
                    <p>
                        Each car carries more than 250 sensors and can generate over a terabyte of
                        data across a weekend. Telemetry charts are a small slice of it.
                        <Cite id="weekend" />
                    </p>
                </InfoCard>
                <InfoCard icon={Medal} title="Classified is not the same as finished" tag="general">
                    <p>
                        A driver who completes at least 90% of the winner’s laps is classified, even
                        if they retired. That is why retired cars can appear in a results table.
                        <Cite id={["fiaB", "glossary"]} />
                    </p>
                </InfoCard>
                <InfoCard icon={Layers} title="Two titles, two histories" tag="general">
                    <p>
                        The Drivers’ title has been awarded since 1950 and the Constructors’ title
                        since 1958.
                        <Cite id="overview" />
                    </p>
                </InfoCard>
                <InfoCard icon={Zap} title="2026 reset the technical rules" tag="2026">
                    <p>
                        New power units split power roughly 50/50 between petrol and electrical
                        energy. The MGU-H is gone and the MGU-K is capped at 350 kW, up from 120 kW.
                        <Cite id="pu2026" /> Active aero replaces DRS.
                        <Cite id="terms2026" />
                    </p>
                </InfoCard>
            </div>

            <H3>What to expect when you switch seasons</H3>
            <div className="rounded-lg border bg-card p-2">
                <Table>
                    <caption className="sr-only">
                        Rule differences between earlier seasons and 2026
                    </caption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Topic</TableHead>
                            <TableHead>Before 2026</TableHead>
                            <TableHead>2026</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[
                            [
                                "Overtaking aid",
                                "DRS, in use since 2011",
                                "No DRS. Active aero and Overtake Mode",
                            ],
                            [
                                "Fastest-lap point",
                                "A bonus point from 2019 to 2024",
                                "None (dropped from 2025)",
                            ],
                            [
                                "Teams on the grid",
                                "Without Cadillac",
                                "11 teams, 22 cars. Cadillac is new",
                            ],
                            [
                                "Power unit",
                                "MGU-H fitted, MGU-K up to 120 kW",
                                "MGU-H removed, MGU-K up to 350 kW",
                            ],
                            [
                                "Sprint Qualifying",
                                "Held on Friday from 2024",
                                "Friday; six Sprint weekends",
                            ],
                        ].map((row) => (
                            <TableRow key={row[0]}>
                                {row.map((cell, i) => (
                                    <TableCell
                                        key={i}
                                        className={
                                            i === 0 ? "font-semibold text-foreground" : "min-w-48"
                                        }
                                    >
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <P className="text-sm text-muted-foreground">
                Sources: <Cite id={["terms2026", "glossary", "overview", "pu2026", "sprint"]} />.
                This is not a full list of differences.
            </P>
        </Section>
    );
}
