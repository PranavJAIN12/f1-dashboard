import {
    Building2,
    CalendarRange,
    Gavel,
    Route,
    ShieldCheck,
    Trophy,
    Users,
    Wrench,
} from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CircuitDiagram,
    CompoundScale,
    FlagGuide,
    PointsTable,
    QualifyingFunnel,
    StartLights,
    TyreGuide,
    WeekendTimelines,
} from "./diagrams";
import { Cite, External } from "./sources";
import { BulletList, Callout, Figure, H3, InfoCard, KerbStripe, P, Section, Tag } from "./ui";

export function BasicsSection() {
    return (
        <Section id="basics" number="01" kicker="Start here" title="F1 basics">
            <P>
                Formula 1 (F1) is the highest class of international single-seater racing.
                <Cite id="whatIsF1" /> Its official name is the FIA Formula One World Championship.
                <Cite id="overview" /> The championship began in 1950; a Drivers’ title has been
                awarded since then and a Teams’ (Constructors’) title since 1958.
                <Cite id="overview" />
            </P>

            <div className="rounded-lg border bg-card p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">F1 in one minute</h3>
                    <Tag scope="2026" />
                </div>
                <BulletList>
                    <li>
                        <strong>22 drivers in 11 teams</strong>, two cars per team. Cadillac is new
                        for 2026.
                        <Cite id="overview" />
                    </li>
                    <li>
                        A season is a series of <strong>race weekends</strong> (rounds) at circuits
                        around the world. Each weekend awards points towards two championships.
                        <Cite id={["overview", "calendar"]} />
                    </li>
                    <li>
                        The <strong>Drivers’ Championship</strong> rewards individual drivers; the{" "}
                        <strong>Constructors’ Championship</strong> adds up the points of both
                        drivers in a team.
                        <Cite id="fiaA" />
                    </li>
                    <li>
                        The <strong>FIA</strong> writes and enforces the rules; stewards decide
                        penalties.
                        <Cite id={["overview", "fiaB"]} />
                    </li>
                </BulletList>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoCard icon={Users} title="Drivers" tag="general">
                    <p>
                        Each team enters two drivers. Drivers are shown by name and by a
                        three-letter code, such as the codes in this dashboard’s tables.
                    </p>
                    <p>
                        The official line-up for any season is on the{" "}
                        <External href="https://www.formula1.com/en/drivers">
                            formula1.com drivers page
                        </External>
                        .
                    </p>
                </InfoCard>
                <InfoCard icon={Building2} title="Teams and constructors" tag="general">
                    <p>
                        “Constructor” is the official word for a team. A constructor must design and
                        build its own car.
                        <Cite id="glossary" /> The Constructors’ title goes to the team even if it
                        does not make its own power unit.
                        <Cite id="fiaA" />
                    </p>
                    <p>
                        The current list is on the official{" "}
                        <External href="https://www.formula1.com/en/teams">teams page</External>.
                        <Cite id="teams" />
                    </p>
                </InfoCard>
                <InfoCard icon={Route} title="Circuits" tag="general">
                    <p>
                        Races are held on permanent tracks and on street circuits. Each lap is timed
                        in three sectors.
                        <Cite id="glossary" /> The race distance is set per circuit, so the number
                        of laps differs from one Grand Prix to another.
                        <Cite id="weekend" />
                    </p>
                </InfoCard>
                <InfoCard icon={ShieldCheck} title="The FIA" tag="general">
                    <p>
                        The FIA, founded in 1904, is the governing body. It oversees the technical,
                        sporting and financial rules and safety. F1’s commercial rights are held by
                        Formula 1 (owned by Liberty Media).
                        <Cite id="overview" />
                    </p>
                    <p>
                        The Championship is FIA property, and the commercial rights are licensed to
                        that rights holder.
                        <Cite id="fiaA" />
                    </p>
                </InfoCard>
                <InfoCard icon={CalendarRange} title="How a season works" tag="general">
                    <p>
                        Rounds are spread across the year. The number and order of rounds can
                        change: when this guide was last updated, the official 2026 calendar page
                        listed 23 rounds.
                        <Cite id="calendar" /> The dashboard’s Races page shows the calendar it gets
                        from OpenF1.
                    </p>
                </InfoCard>
                <InfoCard icon={Gavel} title="Officials" tag="general">
                    <p>
                        The Race Director runs each session. The stewards investigate incidents and
                        decide penalties. The FIA nominates both.
                        <Cite id="fiaB" />
                    </p>
                </InfoCard>
            </div>

            <Figure
                scrollHint
                caption={
                    <>
                        <strong>Figure 1. Anatomy of a circuit.</strong> An original, fictional
                        circuit showing the start/finish line, the starting grid behind it, the pit
                        lane, three timing sectors (S1 red, S2 amber, S3 blue) and a tight hairpin.
                        Real circuits differ in length, layout and number of corners. The long
                        straight reflects the 2026 rule that wings can open on designated straights.
                        <Cite id="terms2026" />
                    </>
                }
            >
                <CircuitDiagram />
            </Figure>
        </Section>
    );
}

export function WeekendSection() {
    return (
        <Section id="weekend" number="02" kicker="Race weekend" title="The race weekend explained">
            <Callout kind="season" title="Formats and regulations change by season">
                <p>
                    Everything below describes the <strong>2026 season</strong> as published by the
                    FIA and Formula 1 on the “last updated” date of this page.
                    <Cite id={["fiaB", "weekend"]} /> Session lengths, the number of cars, the
                    sprint calendar and many other rules have changed in past seasons and can change
                    again. For another season, read that season’s regulations in the{" "}
                    <External href="https://www.fia.com/regulation/category/110">
                        FIA regulations index
                    </External>
                    .<Cite id="fiaRegs" />
                </p>
            </Callout>

            <P>
                A Grand Prix weekend usually runs over three days. Practice lets teams learn the
                track and tune the cars, qualifying decides the starting order, and the race awards
                the points. On a Sprint weekend an extra, shorter race is added.
                <Cite id="weekend" />
            </P>

            <Figure
                caption={
                    <>
                        <strong>Figure 2. The two weekend formats (2026).</strong> Standard weekends
                        have three practice sessions, qualifying and the race. Sprint weekends swap
                        FP2 and FP3 for Sprint Qualifying and the Sprint. Highlighted sessions
                        decide a grid or award points.
                        <Cite id={["fiaB", "weekend", "sprint"]} />
                    </>
                }
            >
                <WeekendTimelines />
            </Figure>

            <H3>Practice</H3>
            <P>
                Practice sessions are one hour each. Teams use them to try set-ups, tyres and new
                parts. Practice times are not a reliable guide to the order on Sunday, because cars
                run different fuel loads and tyres.
                <Cite id="weekend" /> Once qualifying starts, parc fermé conditions apply and most
                work on the car is banned.
                <Cite id="fiaB" />
            </P>

            <H3>Qualifying</H3>
            <P>
                Qualifying is three knockout stages: Q1 (18 minutes), Q2 (15 minutes) and Q3 (13
                minutes). With 22 cars, the six slowest are eliminated after Q1 and six more after
                Q2, which sets grid positions 22 down to 11. The remaining ten fight in Q3 for the
                top ten places; the fastest driver takes pole position.
                <Cite id={["fiaB", "weekend"]} /> The number of cars eliminated adapts to the size
                of the field: five each time with 20 cars, seven with 24.
                <Cite id="fiaB" />
            </P>
            <Figure
                caption={
                    <>
                        <strong>Figure 3. The qualifying knockout (2026, 22 cars).</strong> Each
                        square is one car. Red squares go through; grey squares are eliminated in
                        that stage, taking the grid places listed beside each row.
                    </>
                }
            >
                <QualifyingFunnel />
            </Figure>

            <H3>Sprint weekends</H3>
            <P>
                A Sprint is a short race of about 100 km with no mandatory pit stop. Points go to
                the top eight finishers. It follows Sprint Qualifying, which sets its grid in three
                parts of 12, 10 and 8 minutes.
                <Cite id={["sprint", "fiaB"]} /> Normal Qualifying later on Saturday still decides
                the grid for Sunday’s Grand Prix.
                <Cite id="sprint" />
            </P>
            <P>
                There are <strong>six Sprint weekends in 2026</strong>: China (13 to 15 March),
                Miami (1 to 3 May), Canada (22 to 24 May), Great Britain (3 to 5 July), the
                Netherlands (21 to 23 August) and Singapore (9 to 11 October).
                <Cite id="sprint" />
            </P>

            <H3>The Grand Prix</H3>
            <P>
                The race is run over the fewest whole laps needed to exceed 305 km, with a 2-hour
                limit (3 hours if the race is stopped). Monaco is shorter: the fewest laps over 260
                km.
                <Cite id={["weekend", "fiaB"]} />
            </P>

            <Callout kind="note" title="On the dashboard">
                <p>
                    The dashboard labels sessions with short codes: <strong>FP1, FP2, FP3</strong>{" "}
                    (practice), <strong>SQ</strong> (Sprint Qualifying), <strong>S</strong>{" "}
                    (Sprint), <strong>Q</strong> (Qualifying) and <strong>R</strong> (Race). A
                    weekend only shows the sessions OpenF1 lists for it.
                </p>
            </Callout>
        </Section>
    );
}

export function RaceSection() {
    return (
        <Section id="race" number="03" kicker="Race day" title="How a race works">
            <H3>1. The starting grid</H3>
            <P>
                Cars line up in qualifying order, with pole position first. A grid penalty moves a
                driver back; breaking parc fermé can mean starting from the pit lane.
                <Cite id={["glossary", "fiaB"]} />
            </P>

            <H3>2. The formation lap and the start</H3>
            <P>
                Cars leave the pits for the formation lap, weaving to warm their tyres. Practice
                starts are forbidden. Back on the grid, five red lights come on one by one, one
                second apart, then go out to start the race.
                <Cite id={["weekend", "fiaB"]} />
            </P>
            <Figure
                className="max-w-md"
                caption={
                    <>
                        <strong>Figure 4. The start lights.</strong> All five lights are on; when
                        they go out together, the race starts.
                    </>
                }
            >
                <StartLights />
            </Figure>

            <H3>3. Racing and overtaking</H3>
            <P>
                A driver may pass on either side. When defending, a driver may not change direction
                more than once, and must leave a car’s width to the edge of the track when returning
                to the racing line. Deliberately crowding a rival is prohibited, and causing a
                collision is reported to the stewards.
                <Cite id="fiaL" /> Slower cars about to be lapped must let faster cars through when
                shown a blue flag.
                <Cite id="fiaH" />
            </P>
            <Callout kind="season" title="Overtaking aids changed for 2026">
                <p>
                    DRS has been <strong>removed</strong>. In its place, cars have{" "}
                    <strong>active aero</strong>: wings adjust on designated straights for every
                    driver, on every lap, without the old one-second rule.
                    <Cite id={["terms2026", "rules2026"]} />
                </p>
                <p>
                    <strong>Overtake Mode</strong> is the new passing aid. A driver within one
                    second of the car ahead at the detection point earns extra electrical energy to
                    use on the next lap.
                    <Cite id="terms2026" /> The power unit now splits power roughly 50/50 between
                    the petrol engine and electrical energy, and the MGU-H has gone.
                    <Cite id={["pu2026", "rules2026"]} />
                </p>
                <p>
                    The dashboard’s Telemetry page still has a DRS panel. How OpenF1 reports that
                    channel for 2026 sessions has not been confirmed; see{" "}
                    <a href="#dashboard-limits" className="font-medium underline">
                        the dashboard limitations
                    </a>
                    .
                </p>
            </Callout>

            <H3>4. Pit stops</H3>
            <P>
                Cars drive through a pit lane limited to 80 km/h (the Race Director can change the
                limit). The crew changes all four tyres in under two seconds.
                <Cite id={["fiaB", "whatIsF1"]} /> Refuelling during a race is banned.
                <Cite id="glossary" />
            </P>
            <P>
                Teams stop because tyres wear. In a dry race, each driver must use at least two
                different dry tyre compounds unless intermediates or wets are used; failing to do so
                means disqualification.
                <Cite id="fiaB" /> A Sprint has no mandatory stop.
                <Cite id="sprint" /> Strategy is about <em>when</em> to stop and <em>which tyre</em>{" "}
                to fit: pitting before a rival is an <em>undercut</em>, pitting after is an{" "}
                <em>overcut</em>.
                <Cite id="glossary" /> A hypothetical undercut is worked through in{" "}
                <a href="#examples" className="font-medium underline">
                    the examples
                </a>
                .
            </P>

            <H3>5. Tyres</H3>
            <Figure
                caption={
                    <>
                        <strong>Figure 5. Tyre colours.</strong> Dry slick tyres have a red (soft),
                        yellow (medium) or white (hard) band. Intermediates are green and full wets
                        are blue. Simple illustrations; real tyres carry more markings.
                        <Cite id="pirelliF1" />
                    </>
                }
            >
                <TyreGuide />
            </Figure>
            <Figure
                caption={
                    <>
                        <strong>Figure 6. The 2026 dry compound range.</strong> Pirelli numbers
                        compounds from C1 (hardest) to C5 (softest). Three are nominated for each
                        weekend and are called hard, medium and soft, so the same label can be a
                        different compound at different circuits.
                        <Cite id={["pirelliRange", "pirelliF1"]} />
                    </>
                }
            >
                <CompoundScale />
            </Figure>
            <P>
                Harder compounds resist heat and can run very long stints, at the expense of peak
                performance. The softest give the most mechanical grip and suit slow, low-wear
                circuits. Intermediates handle a wet track with no standing water or a drying
                surface; full wets handle heavy rain.
                <Cite id="pirelliF1" />
            </P>
            <BulletList>
                <li>
                    Standard weekend tyre allocation per driver: 13 dry sets (2 hard, 3 medium, 8
                    soft), 5 intermediate and 2 wet.
                    <Cite id="fiaB" />
                </li>
                <li>
                    Sprint weekend: 12 dry sets (2 hard, 4 medium, 6 soft), 6 intermediate and 2
                    wet.
                    <Cite id="fiaB" />
                </li>
            </BulletList>

            <H3>6. Safety Car, Virtual Safety Car and red flags</H3>
            <P>
                The <strong>Safety Car</strong> is used when people are in immediate danger but the
                race need not stop. Cars queue up behind it, and overtaking is not allowed.{" "}
                <Cite id={["fiaB", "glossary"]} /> Under the <strong>Virtual Safety Car</strong>,
                drivers must stay above a minimum time in each sector, without a physical car
                leading.
                <Cite id="fiaB" /> A <strong>red flag</strong> stops the race: cars go slowly to the
                pit lane and overtaking is forbidden. The Race Director then decides whether to
                restart with a standing or a rolling start.
                <Cite id="fiaB" />
            </P>

            <H3>7. Flags</H3>
            <Figure
                caption={
                    <>
                        <strong>Figure 7. Race-control flags.</strong> Simple drawings of the flags
                        and what they mean for a driver. Flags are shown at marshal posts around the
                        circuit and on a driver’s dashboard. Meanings are taken from the 2026 text;
                        check the FIA document if you are studying an earlier season.
                        <Cite id="fiaH" />
                    </>
                }
            >
                <FlagGuide />
            </Figure>

            <H3>8. Penalties</H3>
            <P>
                A penalty is only given when a driver was wholly or predominantly to blame.
                <Cite id="fiaB" /> “Under investigation” means the stewards are looking at an
                incident; nothing is decided yet.
                <Cite id="fiaB" />
            </P>
            <BulletList>
                <li>
                    <strong>Time penalties</strong> of 5 or 10 seconds, served by stopping in the
                    pit box for that time at the next pit stop, or added to the race time.
                </li>
                <li>
                    <strong>Drive-through</strong> and <strong>stop-go</strong> penalties (10
                    seconds stationary, no work allowed). After the race they convert to +20 s and
                    +30 s.
                </li>
                <li>
                    <strong>Grid-place penalties</strong> for the next Sprint or Race, plus
                    reprimands, disqualification and suspension. A fifth reprimand (at least four of
                    them for driving) brings a 10-place grid penalty.
                    <Cite id="fiaB" />
                </li>
                <li>
                    <strong>Penalty points</strong> on a driver’s super licence: at 12 points the
                    driver is suspended for the next event, and each point expires after 12 months.
                    <Cite id="fiaA" />
                </li>
            </BulletList>

            <H3>9. The finish</H3>
            <P>
                The chequered flag ends the race. A driver is classified if they completed at least
                90% of the winner’s laps (rounded down).
                <Cite id="fiaB" /> Results can change after the race if the stewards add penalties,
                so the order shown on a results page may not match the order at the flag.
                <Cite id="fiaB" />
            </P>
            <KerbStripe />
        </Section>
    );
}

export function ChampionshipsSection() {
    return (
        <Section id="championships" number="04" kicker="Points" title="How the championships work">
            <div className="grid gap-4 md:grid-cols-2">
                <InfoCard icon={Trophy} title="Drivers’ Championship" tag="general">
                    <p>
                        Every driver adds up the points they score in Grands Prix and Sprints. The
                        driver with the most points at the end of the season is champion.
                        <Cite id="overview" />
                    </p>
                </InfoCard>
                <InfoCard icon={Wrench} title="Constructors’ Championship" tag="general">
                    <p>
                        A team’s total is the points scored by both of its cars. Where a team does
                        not build its own power unit, the title still goes to the team.
                        <Cite id="fiaA" />
                    </p>
                </InfoCard>
            </div>

            <Figure
                caption={
                    <>
                        <strong>Table 1. Championship points by finishing position (2026).</strong>{" "}
                        Grand Prix: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 for first to tenth. Sprint: 8
                        down to 1 for first to eighth. There is no bonus point for the fastest lap.
                        <Cite id={["fiaA", "weekend", "glossary"]} />
                    </>
                }
            >
                <PointsTable />
            </Figure>

            <H3>If a race is stopped early</H3>
            <P>
                No points are awarded unless the race leader completed at least two consecutive laps
                without a Safety Car or Virtual Safety Car. After that, the points scale depends on
                how much of the scheduled distance the leader completed.
                <Cite id="fiaA" />
            </P>
            <div className="rounded-lg border bg-card p-2">
                <Table>
                    <caption className="sr-only">
                        Grand Prix points for shortened races, by share of distance the leader
                        completed
                    </caption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Leader completed</TableHead>
                            <TableHead>Points, first to tenth</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[
                            ["At least 2 laps, under 25%", "6, 4, 3, 2, 1"],
                            ["25% to under 50%", "13, 10, 8, 6, 5, 4, 3, 2, 1"],
                            ["50% to under 75%", "19, 14, 12, 10, 8, 6, 4, 3, 2, 1"],
                            ["75% or more", "25, 18, 15, 12, 10, 8, 6, 4, 2, 1 (full points)"],
                        ].map(([share, pts]) => (
                            <TableRow key={share}>
                                <TableCell className="font-medium text-foreground">
                                    {share}
                                </TableCell>
                                <TableCell>{pts}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <P>
                A shortened Sprint scores no points if the leader completed under 50% of the
                distance; from 50% the normal Sprint scale applies.
                <Cite id="fiaA" />
            </P>

            <H3>Tie-breaks</H3>
            <P>
                If two drivers (or teams) finish on the same points, the higher place goes to the
                one with the most wins. If still level, the most second places decide it, then third
                places, and so on. If that fails, the same count is applied to qualifying results.
                <Cite id="fiaA" />
            </P>

            <Callout kind="note" title="Check the rules for the season you are viewing">
                <p>
                    The dashboard lets you browse seasons from 2023. Points scales, tie-breaks and
                    formats are season-specific. For example, the fastest-lap bonus point existed
                    from 2019 to 2024 and has not been awarded since.
                    <Cite id="glossary" /> The tables above are the <strong>2026</strong> rules. For
                    an earlier season, read the sporting regulations for that year.
                    <Cite id="fiaRegs" /> The dashboard’s <em>Pts</em> column shows the points
                    OpenF1 reports for the session; it does not apply any rules itself.
                </p>
            </Callout>
            <P className="text-sm text-muted-foreground">
                The dashboard does not currently show season-long driver or constructor standings.
                For those, see the official{" "}
                <External href="https://www.formula1.com/en/results/2026/drivers">
                    Formula 1 standings
                </External>
                . Browse the{" "}
                <Link href="/drivers" className="font-medium underline">
                    Drivers
                </Link>{" "}
                page for one race’s points.
            </P>
        </Section>
    );
}
