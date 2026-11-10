"use client";

import { memo, useCallback, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { field, type Metric, type Row, type Slot } from "@/lib/telemetry";
import { TrackMap } from "./track-map";

export type ChartSeries = { slot: Slot; driver: string; colour: string; dashed: boolean };

type Panel = {
    title: string;
    unit: string;
    metric: Metric | "delta";
    kind: "line" | "step" | "area";
    height: number;
    domain?: [number | "auto", number | "auto"];
    ticks?: number[];
    format?: (value: number) => string;
};

const PANELS: Panel[] = [
    { title: "Speed", unit: "km/h", metric: "speed", kind: "line", height: 210 },
    {
        title: "Throttle",
        unit: "%",
        metric: "throttle",
        kind: "line",
        height: 120,
        domain: [0, 100],
    },
    {
        title: "Brake",
        unit: "",
        metric: "brake",
        kind: "area",
        height: 80,
        domain: [0, 100],
        ticks: [0, 100],
    },
    {
        title: "Gear",
        unit: "",
        metric: "gear",
        kind: "step",
        height: 120,
        domain: [1, 8],
        ticks: [2, 4, 6, 8],
    },
    { title: "RPM", unit: "rpm", metric: "rpm", kind: "line", height: 120 },
    {
        title: "DRS",
        unit: "",
        metric: "drs",
        kind: "area",
        height: 80,
        domain: [0, 1],
        ticks: [0, 1],
        format: (v) => (v >= 1 ? "Open" : "Closed"),
    },
];

const DELTA_PANEL: Panel = {
    title: "Gap to first driver",
    unit: "s",
    metric: "delta",
    kind: "line",
    height: 140,
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(3)}`,
};

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
const Y_AXIS_WIDTH = 44;
const X_AXIS_HEIGHT = 40;

type PanelProps = {
    panel: Panel;
    rows: Row[];
    series: ChartSeries[];
    showAxis: boolean;
    onHover: (index: number | null) => void;
};

const ChartPanel = memo(function ChartPanel({
    panel,
    rows,
    series,
    showAxis,
    onHover,
}: PanelProps) {
    const keyOf = (s: ChartSeries) =>
        panel.metric === "delta" ? "delta" : field(panel.metric, s.slot);
    const shown = panel.metric === "delta" ? series.filter((s) => s.slot === "b") : series;
    const margin = { top: 6, right: 8, bottom: 0, left: 0 };
    const shared = {
        data: rows,
        syncId: "telemetry",
        margin,
        onMouseMove: (state: { activeTooltipIndex?: number | string | null }) => {
            const index = Number(state.activeTooltipIndex);
            onHover(Number.isFinite(index) ? index : null);
        },
        onMouseLeave: () => onHover(null),
    };
    const axes = (
        <>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
                dataKey="distance"
                type="number"
                domain={[0, "dataMax"]}
                tick={AXIS_TICK}
                tickFormatter={(v: number) => `${Math.round(v)}`}
                hide={!showAxis}
                height={showAxis ? X_AXIS_HEIGHT : 0}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                label={
                    showAxis
                        ? {
                              value: "Distance (m)",
                              position: "insideBottomRight",
                              offset: -2,
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                          }
                        : undefined
                }
            />
            <YAxis
                width={Y_AXIS_WIDTH}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                domain={panel.domain ?? ["auto", "auto"]}
                ticks={panel.ticks}
                tickFormatter={panel.format ? (v: number) => panel.format!(v) : undefined}
            />
            <Tooltip
                isAnimationActive={false}
                cursor={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.4 }}
                labelFormatter={(v) => `${Math.round(Number(v))} m`}
                formatter={(value, name) => [
                    typeof value === "number"
                        ? panel.format
                            ? panel.format(value)
                            : `${value.toFixed(0)} ${panel.unit}`.trim()
                        : "-",
                    String(name),
                ]}
                contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                }}
                itemStyle={{ padding: 0 }}
            />
        </>
    );

    return (
        <section aria-label={`${panel.title} trace`}>
            <h3 className="mb-1 flex items-baseline gap-2 text-sm font-semibold">
                {panel.title}
                {panel.unit ? (
                    <span className="text-xs font-normal text-muted-foreground">{panel.unit}</span>
                ) : null}
            </h3>
            <ResponsiveContainer
                width="100%"
                height={panel.height + (showAxis ? X_AXIS_HEIGHT : 0)}
            >
                {panel.kind === "area" ? (
                    <AreaChart {...shared}>
                        {axes}
                        {shown.map((s) => (
                            <Area
                                key={s.slot}
                                type="stepAfter"
                                dataKey={keyOf(s)}
                                name={s.driver}
                                stroke={s.colour}
                                fill={s.colour}
                                fillOpacity={0.22}
                                strokeWidth={1.5}
                                strokeDasharray={s.dashed ? "5 3" : undefined}
                                dot={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </AreaChart>
                ) : (
                    <LineChart {...shared}>
                        {axes}
                        {panel.metric === "delta" ? (
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                        ) : null}
                        {shown.map((s) => (
                            <Line
                                key={s.slot}
                                type={panel.kind === "step" ? "stepAfter" : "monotone"}
                                dataKey={keyOf(s)}
                                name={s.driver}
                                stroke={s.colour}
                                strokeWidth={1.75}
                                strokeDasharray={s.dashed ? "5 3" : undefined}
                                dot={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                )}
            </ResponsiveContainer>
        </section>
    );
});

type Props = { rows: Row[]; series: ChartSeries[] };

export function TelemetryCharts({ rows, series }: Props) {
    const [hover, setHover] = useState<number | null>(null);
    const onHover = useCallback((index: number | null) => setHover(index), []);
    const panels = series.some((s) => s.slot === "b") ? [...PANELS, DELTA_PANEL] : PANELS;

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card>
                <CardHeader>
                    <CardTitle>Lap traces</CardTitle>
                    <p className="muted">
                        Distance is estimated from speed, so corners are aligned by position along
                        the lap rather than measured track metres.
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {panels.map((panel, i) => (
                        <ChartPanel
                            key={panel.metric}
                            panel={panel}
                            rows={rows}
                            series={series}
                            showAxis={i === panels.length - 1}
                            onHover={onHover}
                        />
                    ))}
                </CardContent>
            </Card>
            <Card className="h-fit lg:sticky lg:top-4">
                <CardHeader>
                    <CardTitle>Track map</CardTitle>
                </CardHeader>
                <CardContent>
                    <TrackMap rows={rows} series={series} hover={hover} />
                </CardContent>
            </Card>
        </div>
    );
}
