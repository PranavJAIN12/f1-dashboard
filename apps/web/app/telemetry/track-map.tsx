"use client";

import { useMemo, useState } from "react";
import { field, type Row, type Slot } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

export type TrackSeries = { slot: Slot; driver: string; colour: string };

type Props = {
    rows: Row[];
    series: TrackSeries[];
    hover: number | null;
};

type Mode = "speed" | "faster";

const WIDTH = 400;
const HEIGHT = 300;
const PAD = 24;
const MINI_SECTORS = 25;

function speedColour(fraction: number) {
    return `hsl(${Math.round(220 - 220 * fraction)} 85% 50%)`;
}

export function TrackMap({ rows, series, hover }: Props) {
    const a = series.find((s) => s.slot === "a");
    const b = series.find((s) => s.slot === "b");
    const [mode, setMode] = useState<Mode>(b ? "faster" : "speed");
    const active: Mode = b ? mode : "speed";

    const layout = useMemo(() => {
        const xs: number[] = [];
        const ys: number[] = [];
        for (const row of rows) {
            const x = row[field("x", "a")];
            const y = row[field("y", "a")];
            if (x !== null && y !== null) {
                xs.push(x);
                ys.push(y);
            }
        }
        if (xs.length < 2) return null;
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const spanX = Math.max(...xs) - minX || 1;
        const spanY = Math.max(...ys) - minY || 1;
        const scale = Math.min((WIDTH - 2 * PAD) / spanX, (HEIGHT - 2 * PAD) / spanY);
        const offsetX = (WIDTH - spanX * scale) / 2;
        const offsetY = (HEIGHT - spanY * scale) / 2;
        // Screen y grows downwards, so flip it to keep the circuit the way up it is drawn on TV.
        const project = (slot: Slot, row: Row) => {
            const x = row[field("x", slot)];
            const y = row[field("y", slot)];
            return x === null || y === null
                ? null
                : { x: offsetX + (x - minX) * scale, y: HEIGHT - offsetY - (y - minY) * scale };
        };
        return { project };
    }, [rows]);

    const segments = useMemo(() => {
        if (!layout) return [];
        const speeds = rows.map((r) => r[field("speed", "a")]);
        const known = speeds.filter((v): v is number => v !== null);
        const lo = known.length ? Math.min(...known) : 0;
        const hi = known.length ? Math.max(...known) : 1;
        const size = (rows.length - 1) / MINI_SECTORS;

        // Who took less time through each mini-sector decides its colour in comparison mode.
        const faster = (index: number) => {
            const start = Math.floor(Math.floor(index / size) * size);
            const end = Math.min(rows.length - 1, Math.ceil((Math.floor(index / size) + 1) * size));
            const dA =
                (rows[end][field("time", "a")] ?? 0) - (rows[start][field("time", "a")] ?? 0);
            const dB =
                (rows[end][field("time", "b")] ?? 0) - (rows[start][field("time", "b")] ?? 0);
            return Math.abs(dA - dB) < 0.005 ? null : dA < dB ? "a" : "b";
        };

        const out: { x1: number; y1: number; x2: number; y2: number; colour: string }[] = [];
        for (let i = 0; i < rows.length - 1; i++) {
            const from = layout.project("a", rows[i]);
            const to = layout.project("a", rows[i + 1]);
            if (!from || !to) continue;
            let colour = "hsl(var(--muted-foreground))";
            if (active === "speed") {
                const v = speeds[i];
                colour = v === null ? colour : speedColour((v - lo) / (hi - lo || 1));
            } else {
                const winner = faster(i);
                colour =
                    winner === "a"
                        ? (a?.colour ?? colour)
                        : winner === "b"
                          ? (b?.colour ?? colour)
                          : colour;
            }
            out.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, colour });
        }
        return out;
    }, [layout, rows, active, a, b]);

    if (!layout || !a) return <p className="muted">No location data was recorded for this lap.</p>;

    const start = layout.project("a", rows[0]);
    const row = hover === null ? null : rows[hover];

    return (
        <div>
            {b ? (
                <div className="mb-3 flex gap-1" role="group" aria-label="Track colouring">
                    {(["faster", "speed"] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            aria-pressed={active === m}
                            onClick={() => setMode(m)}
                            className={cn(
                                "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                                active === m
                                    ? "border-accent/60 bg-accent-soft text-accent-soft-foreground"
                                    : "text-muted-foreground hover:bg-muted",
                            )}
                        >
                            {m === "faster" ? "Faster driver" : "Speed"}
                        </button>
                    ))}
                </div>
            ) : null}

            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                role="img"
                aria-label="Circuit map drawn from the car's position data"
                className="w-full"
            >
                <g strokeLinecap="round" strokeLinejoin="round" fill="none">
                    {segments.map((s, i) => (
                        <line
                            key={`o${i}`}
                            x1={s.x1}
                            y1={s.y1}
                            x2={s.x2}
                            y2={s.y2}
                            strokeWidth={11}
                            style={{ stroke: "hsl(var(--border-strong))" }}
                        />
                    ))}
                    {segments.map((s, i) => (
                        <line
                            key={`c${i}`}
                            x1={s.x1}
                            y1={s.y1}
                            x2={s.x2}
                            y2={s.y2}
                            strokeWidth={6}
                            style={{ stroke: s.colour }}
                        />
                    ))}
                </g>
                {start ? (
                    <g>
                        <circle
                            cx={start.x}
                            cy={start.y}
                            r={4}
                            style={{ fill: "hsl(var(--card))", stroke: "hsl(var(--foreground))" }}
                            strokeWidth={2}
                        />
                        <text
                            x={start.x + 8}
                            y={start.y - 8}
                            fontSize={10}
                            style={{ fill: "hsl(var(--muted-foreground))" }}
                        >
                            S/F
                        </text>
                    </g>
                ) : null}
                {row
                    ? series.map((s) => {
                          const p = layout.project(s.slot, row);
                          return p ? (
                              <circle
                                  key={s.slot}
                                  cx={p.x}
                                  cy={p.y}
                                  r={7}
                                  strokeWidth={2.5}
                                  style={{ fill: s.colour, stroke: "#ffffff" }}
                              />
                          ) : null;
                      })
                    : null}
            </svg>

            {active === "speed" ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Slow</span>
                    <span
                        aria-hidden="true"
                        className="h-2 flex-1 rounded-full"
                        style={{
                            background: `linear-gradient(to right, ${speedColour(0)}, ${speedColour(0.5)}, ${speedColour(1)})`,
                        }}
                    />
                    <span>Fast</span>
                </div>
            ) : (
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {series.map((s) => (
                        <li key={s.slot} className="flex items-center gap-1.5">
                            <span
                                aria-hidden="true"
                                className="h-2 w-4 rounded-full"
                                style={{ background: s.colour }}
                            />
                            {s.driver} faster
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-3 min-h-5 text-xs tabular-nums text-muted-foreground" aria-live="off">
                {row
                    ? `${Math.round(row.distance ?? 0)} m · ` +
                      series
                          .map((s) => {
                              const v = row[field("speed", s.slot)];
                              return `${s.driver} ${v === null ? "-" : Math.round(v)} km/h`;
                          })
                          .join(" · ")
                    : "Hover a chart to follow the car on the map."}
            </p>
        </div>
    );
}
