import type { ReactNode } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Every diagram here is original artwork drawn in SVG/CSS; none uses a photograph or a logo.

type Pt = readonly [number, number];

function Svg({
    id,
    title,
    desc,
    viewBox,
    className,
    children,
}: {
    id: string;
    title: string;
    desc: string;
    viewBox: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <svg
            viewBox={viewBox}
            role="img"
            aria-labelledby={`${id}-title ${id}-desc`}
            className={cn("h-auto w-full", className)}
        >
            <title id={`${id}-title`}>{title}</title>
            <desc id={`${id}-desc`}>{desc}</desc>
            {children}
        </svg>
    );
}

/* ---------- Circuit anatomy ---------- */

const CIRCUIT: Pt[] = [
    [50, 320],
    [450, 320],
    [560, 270],
    [580, 170],
    [510, 90],
    [400, 60],
    [330, 110],
    [400, 170],
    [330, 230],
    [230, 200],
    [170, 120],
    [60, 150],
];
const CORNER_RADIUS = 26;
const f = (n: number) => n.toFixed(1);
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// A path from `start` through the listed corners (rounded) to `end`.
function route(start: Pt, corners: number[], end: Pt) {
    let d = `M${f(start[0])},${f(start[1])}`;
    for (const i of corners) {
        const v = CIRCUIT[i];
        const prev = CIRCUIT[(i + CIRCUIT.length - 1) % CIRCUIT.length];
        const next = CIRCUIT[(i + 1) % CIRCUIT.length];
        const enter = lerp(v, prev, Math.min(CORNER_RADIUS / dist(v, prev), 0.5));
        const exit = lerp(v, next, Math.min(CORNER_RADIUS / dist(v, next), 0.5));
        d += ` L${f(enter[0])},${f(enter[1])} Q${f(v[0])},${f(v[1])} ${f(exit[0])},${f(exit[1])}`;
    }
    return `${d} L${f(end[0])},${f(end[1])}`;
}

const START_FINISH = lerp(CIRCUIT[0], CIRCUIT[1], 0.3);
const SECTORS = [
    {
        name: "S1",
        colour: "#e5252a",
        d: route(START_FINISH, [1, 2, 3, 4], lerp(CIRCUIT[4], CIRCUIT[5], 0.5)),
    },
    {
        name: "S2",
        colour: "#f4a50d",
        d: route(
            lerp(CIRCUIT[4], CIRCUIT[5], 0.5),
            [5, 6, 7, 8],
            lerp(CIRCUIT[8], CIRCUIT[9], 0.5),
        ),
    },
    {
        name: "S3",
        colour: "#2f7de1",
        d: route(lerp(CIRCUIT[8], CIRCUIT[9], 0.5), [9, 10, 11, 0], START_FINISH),
    },
];
const SECTOR_LABELS: { name: string; at: Pt }[] = [
    { name: "S1", at: [498, 215] },
    { name: "S2", at: [470, 135] },
    { name: "S3", at: [110, 235] },
];

export function CircuitDiagram() {
    const [sx, sy] = START_FINISH;
    return (
        <div className="overflow-x-auto">
            <Svg
                id="circuit"
                title="Illustrative circuit diagram"
                desc="A fictional closed circuit drawn from above. A long start/finish straight runs along the bottom, with a pit lane beside it and the starting grid just behind the line. The lap is split into three coloured timing sectors, S1 in red, S2 in amber and S3 in blue. A tight hairpin sits at the top, and the circuit has several fast and slow corners."
                viewBox="0 0 640 390"
                className="min-w-[30rem]"
            >
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {SECTORS.map((s) => (
                        <path
                            key={`o-${s.name}`}
                            d={s.d}
                            strokeWidth={22}
                            className="stroke-border-strong"
                        />
                    ))}
                    {SECTORS.map((s) => (
                        <path key={s.name} d={s.d} strokeWidth={14} style={{ stroke: s.colour }} />
                    ))}
                </g>

                {/* Pit lane runs alongside the main straight. */}
                <path
                    d="M120,352 H430"
                    fill="none"
                    strokeWidth={5}
                    strokeDasharray="10 6"
                    className="stroke-muted-foreground"
                />
                <text
                    x={275}
                    y={376}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[13px]"
                >
                    Pit lane (speed limited)
                </text>

                {/* Grid slots sit behind the start/finish line. */}
                <g className="fill-foreground" opacity={0.75}>
                    {[0, 1, 2].map((row) => (
                        <g key={row}>
                            <rect x={sx - 24 - row * 16} y={312} width={12} height={5} rx={1} />
                            <rect x={sx - 32 - row * 16} y={323} width={12} height={5} rx={1} />
                        </g>
                    ))}
                </g>

                {/* Start/finish line: dark bar with a dashed white overlay. */}
                <line x1={sx} y1={sy - 15} x2={sx} y2={sy + 15} strokeWidth={5} stroke="#111" />
                <line
                    x1={sx}
                    y1={sy - 15}
                    x2={sx}
                    y2={sy + 15}
                    strokeWidth={5}
                    stroke="#fff"
                    strokeDasharray="5 5"
                />
                <text x={sx + 10} y={sy - 20} className="fill-foreground text-[13px] font-semibold">
                    Start / finish line
                </text>
                <text
                    x={sx - 30}
                    y={sy - 20}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[12px]"
                >
                    Starting grid
                </text>

                <text
                    x={330}
                    y={280}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[12px]"
                >
                    Long straight: wings can open (2026)
                </text>

                {SECTOR_LABELS.map((l, i) => (
                    <g key={l.name}>
                        <circle
                            cx={l.at[0]}
                            cy={l.at[1]}
                            r={15}
                            strokeWidth={3}
                            className="fill-card"
                            style={{ stroke: SECTORS[i].colour }}
                        />
                        <text
                            x={l.at[0]}
                            y={l.at[1] + 4.5}
                            textAnchor="middle"
                            className="fill-foreground text-[13px] font-bold"
                        >
                            {l.name}
                        </text>
                    </g>
                ))}

                <text x={12} y={46} className="fill-foreground text-[13px] font-semibold">
                    Tight corner (hairpin):
                </text>
                <text x={12} y={63} className="fill-muted-foreground text-[12px]">
                    heavy braking, lowest speed
                </text>
                <path
                    d="M150,70 Q250,95 318,108"
                    fill="none"
                    strokeWidth={1.5}
                    className="stroke-muted-foreground"
                />

                <text
                    x={628}
                    y={344}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px] italic"
                >
                    Fictional circuit, not to scale
                </text>
            </Svg>
        </div>
    );
}

/* ---------- Race start lights ---------- */

export function StartLights() {
    return (
        <Svg
            id="lights"
            title="Race start lights"
            desc="Five red lights shown in a row. They switch on one at a time, then all go out together to start the race."
            viewBox="0 0 220 44"
            className="max-w-[14rem]"
        >
            <rect x={2} y={2} width={216} height={40} rx={8} fill="#1c1c1e" />
            {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={28 + i * 41} cy={22} r={12} fill="#e5252a" />
            ))}
        </Svg>
    );
}

/* ---------- Tyres ---------- */

const TYRES = [
    { name: "Soft", ring: "#e5252a", note: "Red band. Most peak grip." },
    { name: "Medium", ring: "#f4c20d", note: "Yellow band. In between." },
    { name: "Hard", ring: "#f2f2f2", note: "White band. Built to last." },
    { name: "Intermediate", ring: "#1fa94b", note: "Green band. Damp or drying track." },
    { name: "Full wet", ring: "#1d6fe0", note: "Blue band. Heavy rain." },
];

export function TyreGuide() {
    return (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TYRES.map((t) => (
                <li
                    key={t.name}
                    className="flex flex-col items-center gap-2 rounded-md border p-3 text-center"
                >
                    <Svg
                        id={`tyre-${t.name.replace(/\s/g, "").toLowerCase()}`}
                        title={`${t.name} tyre`}
                        desc={`A simple top-down tyre drawing with a ${t.note.split(" ")[0].toLowerCase()} coloured band on the sidewall.`}
                        viewBox="0 0 64 64"
                        className="h-16 w-16"
                    >
                        <circle cx={32} cy={32} r={30} fill="#1c1c1e" />
                        <circle
                            cx={32}
                            cy={32}
                            r={22}
                            fill="none"
                            stroke={t.ring}
                            strokeWidth={5}
                        />
                        <circle cx={32} cy={32} r={13} fill="#3a3a3c" />
                        <circle cx={32} cy={32} r={4} fill="#8e8e93" />
                    </Svg>
                    <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.note}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function CompoundScale() {
    const steps = ["C1", "C2", "C3", "C4", "C5"];
    return (
        <div>
            <ol className="grid grid-cols-5 overflow-hidden rounded-md border text-center font-mono text-sm font-bold">
                {steps.map((s, i) => (
                    <li
                        key={s}
                        className={cn(
                            "border-r py-2 last:border-r-0",
                            i < 2 ? "bg-muted" : i < 3 ? "bg-card" : "bg-accent-soft",
                        )}
                    >
                        {s}
                    </li>
                ))}
            </ol>
            <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
                <span>C1: hardest. Built for heat and long stints.</span>
                <span className="text-right">C5: softest. Most peak grip.</span>
            </div>
        </div>
    );
}

/* ---------- Flags ---------- */

type FlagArt = { id: string; name: string; alt: string; meaning: string; art: ReactNode };

const STROKE = "hsl(var(--border-strong))";
const flag = (fill: string) => <rect width={56} height={38} fill={fill} />;

export const FLAGS: FlagArt[] = [
    {
        id: "green",
        name: "Green",
        alt: "A plain green rectangle.",
        meaning: "The track is clear. Also used to start a session or a warm-up lap.",
        art: flag("#1fa94b"),
    },
    {
        id: "yellow",
        name: "Yellow (single)",
        alt: "A plain yellow rectangle.",
        meaning:
            "Danger beside or partly on the track. Slow down, no overtaking, be ready to change direction.",
        art: flag("#f4c20d"),
    },
    {
        id: "double-yellow",
        name: "Double yellow",
        alt: "Two yellow rectangles side by side.",
        meaning:
            "The hazard blocks the track or marshals are working on it. Slow down significantly and be ready to stop.",
        art: (
            <>
                <rect width={27} height={38} fill="#f4c20d" />
                <rect x={29} width={27} height={38} fill="#f4c20d" />
            </>
        ),
    },
    {
        id: "slippery",
        name: "Yellow with red stripes",
        alt: "A yellow rectangle with vertical red stripes.",
        meaning: "Reduced grip ahead, for example from oil or water.",
        art: (
            <>
                {flag("#f4c20d")}
                {[6, 18, 30, 42].map((x) => (
                    <rect key={x} x={x} width={6} height={38} fill="#e5252a" />
                ))}
            </>
        ),
    },
    {
        id: "red",
        name: "Red",
        alt: "A plain red rectangle.",
        meaning: "The session or race is stopped. Cars slow down and return to the pit lane.",
        art: flag("#e5252a"),
    },
    {
        id: "blue",
        name: "Blue",
        alt: "A plain blue rectangle.",
        meaning:
            "A faster car is about to overtake. A driver about to be lapped must let it through at the first opportunity.",
        art: flag("#1d6fe0"),
    },
    {
        id: "white",
        name: "White",
        alt: "A plain white rectangle.",
        meaning: "A much slower vehicle is in that sector.",
        art: flag("#ffffff"),
    },
    {
        id: "chequered",
        name: "Chequered",
        alt: "A black and white chequerboard.",
        meaning: "The session or race is over.",
        art: (
            <>
                {flag("#ffffff")}
                {Array.from({ length: 8 * 5 }, (_, i) => {
                    const col = i % 8;
                    const row = Math.floor(i / 8);
                    return (col + row) % 2 === 0 ? (
                        <rect
                            key={i}
                            x={col * 7}
                            y={row * 7.6}
                            width={7}
                            height={7.6}
                            fill="#111"
                        />
                    ) : null;
                })}
            </>
        ),
    },
    {
        id: "black",
        name: "Black",
        alt: "A plain black rectangle.",
        meaning:
            "A driver must stop at the pits on the next lap. It is shown with the car number; the stewards decide.",
        art: flag("#111111"),
    },
    {
        id: "black-white",
        name: "Black and white (diagonal)",
        alt: "A rectangle split diagonally into a white triangle and a black triangle.",
        meaning: "A one-time warning for unsportsmanlike behaviour.",
        art: (
            <>
                <polygon points="0,0 56,0 0,38" fill="#ffffff" />
                <polygon points="56,0 56,38 0,38" fill="#111111" />
            </>
        ),
    },
    {
        id: "black-orange",
        name: "Black with orange disc",
        alt: "A black rectangle with a large orange circle in the middle.",
        meaning:
            "The car has a mechanical problem that is dangerous to the driver or others. It must pit on the next lap.",
        art: (
            <>
                {flag("#111111")}
                <circle cx={28} cy={19} r={13} fill="#f57c00" />
            </>
        ),
    },
];

export function FlagGuide() {
    return (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FLAGS.map((fl) => (
                <li key={fl.id} className="flex gap-3 rounded-md border p-3">
                    <Svg
                        id={`flag-${fl.id}`}
                        title={`${fl.name} flag`}
                        desc={fl.alt}
                        viewBox="0 0 56 38"
                        className="w-14 shrink-0 self-start rounded-sm"
                    >
                        {fl.art}
                        <rect width={56} height={38} fill="none" stroke={STROKE} strokeWidth={2} />
                    </Svg>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">{fl.name}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {fl.meaning}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

/* ---------- Weekend timelines ---------- */

type Day = { label: string; sessions: { name: string; detail: string; accent?: boolean }[] };

function TimelineRow({ title, days }: { title: string; days: Day[] }) {
    return (
        <div>
            <h4 className="mb-2 text-sm font-semibold">{title}</h4>
            <ol className="grid gap-3 md:grid-cols-3">
                {days.map((day) => (
                    <li key={day.label} className="rounded-md border bg-background/40 p-3">
                        <p className="label mb-2">{day.label}</p>
                        <ol className="space-y-2">
                            {day.sessions.map((s) => (
                                <li
                                    key={s.name}
                                    className={cn(
                                        "rounded-md border-l-4 bg-muted px-3 py-2",
                                        s.accent ? "border-accent" : "border-border-strong",
                                    )}
                                >
                                    <p className="text-sm font-semibold">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{s.detail}</p>
                                </li>
                            ))}
                        </ol>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export function WeekendTimelines() {
    return (
        <div className="flex flex-col gap-6">
            <TimelineRow
                title="Standard weekend"
                days={[
                    {
                        label: "Day 1 (usually Friday)",
                        sessions: [
                            { name: "Free Practice 1 (FP1)", detail: "60 minutes" },
                            { name: "Free Practice 2 (FP2)", detail: "60 minutes" },
                        ],
                    },
                    {
                        label: "Day 2 (usually Saturday)",
                        sessions: [
                            { name: "Free Practice 3 (FP3)", detail: "60 minutes" },
                            {
                                name: "Qualifying",
                                detail: "Q1 18 min, Q2 15 min, Q3 13 min. Sets the grid.",
                                accent: true,
                            },
                        ],
                    },
                    {
                        label: "Day 3 (usually Sunday)",
                        sessions: [
                            {
                                name: "Grand Prix (Race)",
                                detail: "Fewest laps over 305 km (260 km at Monaco), up to 2 hours.",
                                accent: true,
                            },
                        ],
                    },
                ]}
            />
            <TimelineRow
                title="Sprint weekend"
                days={[
                    {
                        label: "Day 1 (usually Friday)",
                        sessions: [
                            { name: "Free Practice 1 (FP1)", detail: "60 minutes" },
                            {
                                name: "Sprint Qualifying (SQ)",
                                detail: "SQ1 12 min, SQ2 10 min, SQ3 8 min. Sets the Sprint grid.",
                                accent: true,
                            },
                        ],
                    },
                    {
                        label: "Day 2 (usually Saturday)",
                        sessions: [
                            {
                                name: "Sprint",
                                detail: "Fewest laps over 100 km, about 30 minutes, no mandatory stop.",
                                accent: true,
                            },
                            {
                                name: "Qualifying",
                                detail: "Same format as a standard weekend. Sets the Race grid.",
                                accent: true,
                            },
                        ],
                    },
                    {
                        label: "Day 3 (usually Sunday)",
                        sessions: [
                            {
                                name: "Grand Prix (Race)",
                                detail: "Same distance as on a standard weekend.",
                                accent: true,
                            },
                        ],
                    },
                ]}
            />
        </div>
    );
}

/* ---------- Qualifying funnel ---------- */

const FUNNEL = [
    { stage: "Q1", cars: 22, out: 6, range: "P17 to P22" },
    { stage: "Q2", cars: 16, out: 6, range: "P11 to P16" },
    { stage: "Q3", cars: 10, out: 0, range: "" },
];

export function QualifyingFunnel() {
    return (
        <ol className="space-y-3">
            {FUNNEL.map((row) => (
                <li key={row.stage} className="grid items-center gap-2 sm:grid-cols-[7rem_1fr]">
                    <div>
                        <p className="font-mono text-sm font-bold">{row.stage}</p>
                        <p className="text-xs text-muted-foreground">
                            {row.cars} cars
                            {row.out
                                ? `, ${row.out} eliminated (${row.range})`
                                : ", fastest takes pole"}
                        </p>
                    </div>
                    <div aria-hidden="true" className="flex flex-wrap gap-1">
                        {Array.from({ length: row.cars }, (_, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "h-4 w-4 rounded-sm",
                                    i >= row.cars - row.out
                                        ? "bg-muted-foreground/40"
                                        : "bg-accent",
                                )}
                            />
                        ))}
                    </div>
                </li>
            ))}
        </ol>
    );
}

/* ---------- Points ---------- */

const GP_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

function Bar({ value, max }: { value: number | undefined; max: number }) {
    if (value === undefined) return <span className="text-muted-foreground">-</span>;
    return (
        <div className="flex items-center gap-2">
            <span className="w-6 text-right font-semibold tabular-nums">{value}</span>
            <span
                aria-hidden="true"
                className="h-2 rounded-full bg-accent"
                style={{ width: `${(value / max) * 100}%` }}
            />
        </div>
    );
}

export function PointsTable() {
    return (
        <div className="rounded-lg border bg-card p-2">
            <Table>
                <caption className="sr-only">
                    Championship points by finishing position for a Grand Prix and a Sprint, 2026
                </caption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Grand Prix</TableHead>
                        <TableHead>Sprint</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {GP_POINTS.map((gp, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-semibold text-foreground">
                                P{i + 1}
                            </TableCell>
                            <TableCell className="min-w-40">
                                <Bar value={gp} max={25} />
                            </TableCell>
                            <TableCell className="min-w-40">
                                <Bar value={SPRINT_POINTS[i]} max={25} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/* ---------- Pit-stop strategy (hypothetical) ---------- */

const COMPOUND_STYLE = {
    Medium: "bg-[#f4c20d] text-black",
    Hard: "bg-white text-black ring-1 ring-inset ring-black/25",
} as const;

type Stint = { compound: keyof typeof COMPOUND_STYLE; from: number; to: number };

function StintRow({ driver, stints, total }: { driver: string; stints: Stint[]; total: number }) {
    return (
        <li className="grid items-center gap-2 sm:grid-cols-[6rem_1fr]">
            <p className="text-sm font-semibold">{driver}</p>
            <div className="flex h-10 overflow-hidden rounded-md border">
                {stints.map((s) => (
                    <div
                        key={s.from}
                        className={cn(
                            "flex flex-col justify-center border-r px-2 text-xs leading-tight last:border-r-0",
                            COMPOUND_STYLE[s.compound],
                        )}
                        style={{ width: `${((s.to - s.from + 1) / total) * 100}%` }}
                    >
                        <span className="font-semibold">{s.compound}</span>
                        <span>
                            Laps {s.from}-{s.to}
                        </span>
                    </div>
                ))}
            </div>
        </li>
    );
}

export function StintChart() {
    return (
        <div>
            <ol className="space-y-2">
                <StintRow
                    driver="Driver A"
                    total={50}
                    stints={[
                        { compound: "Medium", from: 1, to: 22 },
                        { compound: "Hard", from: 23, to: 50 },
                    ]}
                />
                <StintRow
                    driver="Driver B"
                    total={50}
                    stints={[
                        { compound: "Medium", from: 1, to: 20 },
                        { compound: "Hard", from: 21, to: 50 },
                    ]}
                />
            </ol>
            <div aria-hidden="true" className="mt-1 grid sm:grid-cols-[6rem_1fr]">
                <span />
                <div className="flex justify-between text-[0.7rem] text-muted-foreground">
                    <span>Lap 1</span>
                    <span>Lap 25</span>
                    <span>Lap 50</span>
                </div>
            </div>
        </div>
    );
}

/* ---------- Annotated telemetry trace (hypothetical) ---------- */

const W = { left: 56, right: 624 };
const X = (u: number) => W.left + u * (W.right - W.left);
const PANELS = {
    speed: { top: 20, height: 130, min: 60, max: 340 },
    throttle: { top: 176, height: 62, min: 0, max: 100 },
    brake: { top: 262, height: 26 },
};
const speedY = (v: number) =>
    PANELS.speed.top +
    PANELS.speed.height -
    ((v - PANELS.speed.min) / (PANELS.speed.max - PANELS.speed.min)) * PANELS.speed.height;
const throttleY = (v: number) =>
    PANELS.throttle.top + PANELS.throttle.height - (v / 100) * PANELS.throttle.height;

// [lap fraction, km/h]. Invented values that only mimic the shape of a lap.
const SPEED_A: [number, number][] = [
    [0, 285],
    [0.1, 325],
    [0.22, 332],
    [0.3, 150],
    [0.34, 95],
    [0.42, 250],
    [0.5, 302],
    [0.56, 140],
    [0.6, 110],
    [0.7, 262],
    [0.8, 318],
    [0.86, 170],
    [0.9, 130],
    [0.97, 270],
    [1, 285],
];
const SPEED_B: [number, number][] = [
    [0, 282],
    [0.1, 322],
    [0.22, 330],
    [0.315, 150],
    [0.35, 92],
    [0.42, 247],
    [0.5, 300],
    [0.575, 140],
    [0.605, 106],
    [0.7, 259],
    [0.8, 316],
    [0.87, 168],
    [0.905, 127],
    [0.97, 267],
    [1, 282],
];
const THROTTLE_A: [number, number][] = [
    [0, 95],
    [0.05, 100],
    [0.27, 100],
    [0.285, 0],
    [0.35, 0],
    [0.38, 55],
    [0.43, 100],
    [0.53, 100],
    [0.545, 0],
    [0.62, 0],
    [0.65, 60],
    [0.69, 100],
    [0.82, 100],
    [0.835, 0],
    [0.91, 0],
    [0.935, 70],
    [0.96, 100],
    [1, 100],
];
const BRAKE_ZONES: [number, number][] = [
    [0.285, 0.35],
    [0.545, 0.62],
    [0.835, 0.91],
];

// Catmull-Rom spline through the points, as cubic Béziers.
function smooth(points: [number, number][]) {
    const p = points.map(([u, v]) => [X(u), speedY(v)] as const);
    let d = `M${f(p[0][0])},${f(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[Math.max(i - 1, 0)];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[Math.min(i + 2, p.length - 1)];
        d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d;
}

const MARKERS = [
    { n: 1, u: 0.16, v: 332 },
    { n: 2, u: 0.28, v: 215 },
    { n: 3, u: 0.34, v: 95 },
    { n: 4, u: 0.42, v: 250 },
    { n: 5, u: 0.315, v: 150 },
];

export const TRACE_NOTES = [
    "Straight: throttle at 100%, brake off, speed at its highest.",
    "Braking zone: the driver brakes hard, throttle drops to 0% and speed falls quickly.",
    "Apex: the slowest point of the corner, where minimum speed is reached.",
    "Corner exit: throttle comes back on and speed builds again.",
    "Where the two lines separate, the drivers are doing something different. Here Driver B brakes slightly later.",
];

export function AnnotatedTrace() {
    const throttlePath = THROTTLE_A.map(
        ([u, v], i) => `${i ? "L" : "M"}${f(X(u))},${f(throttleY(v))}`,
    ).join(" ");
    return (
        <div className="overflow-x-auto">
            <Svg
                id="trace"
                title="Annotated lap trace (hypothetical data)"
                desc="Three stacked charts share one horizontal axis, the distance along a lap. The top chart shows speed in kilometres per hour for two invented drivers: speed rises on straights and drops sharply at three corners. The middle chart shows throttle percentage for Driver A, at 100 on straights and 0 under braking. The bottom chart shows when Driver A is braking, in three blocks that match the three speed drops. Five numbered markers point out the straight, braking zone, apex, corner exit and the place where Driver B brakes slightly later."
                viewBox="0 0 640 330"
                className="min-w-[34rem]"
            >
                {/* Panel frames */}
                {[
                    { label: "Speed (km/h)", ...PANELS.speed },
                    { label: "Throttle (%)", ...PANELS.throttle },
                    { label: "Brake (on / off)", ...PANELS.brake },
                ].map((p) => (
                    <g key={p.label}>
                        <rect
                            x={W.left}
                            y={p.top}
                            width={W.right - W.left}
                            height={p.height}
                            fill="none"
                            className="stroke-border"
                        />
                        <text
                            x={W.left}
                            y={p.top - 5}
                            className="fill-muted-foreground text-[11px] font-medium"
                        >
                            {p.label}
                        </text>
                    </g>
                ))}
                {[100, 200, 300].map((v) => (
                    <g key={v}>
                        <line
                            x1={W.left}
                            x2={W.right}
                            y1={speedY(v)}
                            y2={speedY(v)}
                            strokeDasharray="3 4"
                            className="stroke-border"
                        />
                        <text
                            x={W.left - 6}
                            y={speedY(v) + 4}
                            textAnchor="end"
                            className="fill-muted-foreground text-[11px]"
                        >
                            {v}
                        </text>
                    </g>
                ))}
                {[0, 100].map((v) => (
                    <text
                        key={v}
                        x={W.left - 6}
                        y={throttleY(v) + 4}
                        textAnchor="end"
                        className="fill-muted-foreground text-[11px]"
                    >
                        {v}
                    </text>
                ))}

                {/* Braking zones shade all three panels so the link between them is visible. */}
                {BRAKE_ZONES.map(([a, b]) => (
                    <g key={a}>
                        <rect
                            x={X(a)}
                            y={PANELS.speed.top}
                            width={X(b) - X(a)}
                            height={PANELS.speed.height}
                            className="fill-accent"
                            opacity={0.08}
                        />
                        <rect
                            x={X(a)}
                            y={PANELS.brake.top}
                            width={X(b) - X(a)}
                            height={PANELS.brake.height}
                            className="fill-accent"
                            opacity={0.55}
                        />
                    </g>
                ))}

                <path
                    d={smooth(SPEED_B)}
                    fill="none"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    style={{ stroke: "#f4a50d" }}
                />
                <path
                    d={smooth(SPEED_A)}
                    fill="none"
                    strokeWidth={2.5}
                    style={{ stroke: "#2f7de1" }}
                />
                <path d={throttlePath} fill="none" strokeWidth={2} style={{ stroke: "#2f7de1" }} />

                {MARKERS.map((m) => (
                    <g key={m.n}>
                        <circle
                            cx={X(m.u)}
                            cy={speedY(m.v)}
                            r={10}
                            className="fill-card stroke-foreground"
                            strokeWidth={1.5}
                        />
                        <text
                            x={X(m.u)}
                            y={speedY(m.v) + 4}
                            textAnchor="middle"
                            className="fill-foreground text-[12px] font-bold"
                        >
                            {m.n}
                        </text>
                    </g>
                ))}

                {/* Legend */}
                <line
                    x1={W.left + 110}
                    x2={W.left + 136}
                    y1={14}
                    y2={14}
                    strokeWidth={2.5}
                    style={{ stroke: "#2f7de1" }}
                />
                <text x={W.left + 142} y={18} className="fill-foreground text-[11px]">
                    Driver A
                </text>
                <line
                    x1={W.left + 206}
                    x2={W.left + 232}
                    y1={14}
                    y2={14}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    style={{ stroke: "#f4a50d" }}
                />
                <text x={W.left + 238} y={18} className="fill-foreground text-[11px]">
                    Driver B
                </text>
                <text
                    x={W.right}
                    y={14}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px] font-semibold uppercase tracking-wider"
                >
                    Hypothetical data
                </text>

                <text
                    x={W.right}
                    y={314}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                >
                    Distance along the lap, from the start/finish line back to it
                </text>
            </Svg>
        </div>
    );
}
