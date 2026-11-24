"use client";

import {
    Line,
    LineChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLapTime } from "@/lib/format";
import type { PacePoint } from "@/lib/compare";

export type PaceSeries = { driver: string; colour: string; dashed: boolean };

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
const TOOLTIP_STYLE = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
};

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

export function PaceCharts({
    points,
    a,
    b,
    showGap,
}: {
    points: PacePoint[];
    a: PaceSeries;
    b: PaceSeries;
    showGap: boolean;
}) {
    const grid = (
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
    );
    const xAxis = (
        <XAxis
            dataKey="lap"
            type="number"
            domain={[1, "dataMax"]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            allowDecimals={false}
        />
    );
    const line = (key: "a" | "b", s: PaceSeries) => (
        <Line
            key={key}
            dataKey={key}
            name={s.driver}
            stroke={s.colour}
            strokeDasharray={s.dashed ? "5 3" : undefined}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
        />
    );

    return (
        <div className="flex flex-col gap-4">
            <Panel
                title="Lap times"
                description="Representative laps only: pit, in and out laps and laps more than 7% off the driver's best are left out."
            >
                <div role="img" aria-label={`Lap times for ${a.driver} and ${b.driver}`}>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                            {grid}
                            {xAxis}
                            <YAxis
                                width={60}
                                tick={AXIS_TICK}
                                tickLine={false}
                                axisLine={false}
                                domain={["auto", "auto"]}
                                reversed
                                tickFormatter={(v: number) => formatLapTime(v)}
                            />
                            <Tooltip
                                isAnimationActive={false}
                                cursor={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.4 }}
                                labelFormatter={(v) => `Lap ${v}`}
                                formatter={(value, name) => [
                                    typeof value === "number" ? formatLapTime(value) : "-",
                                    String(name),
                                ]}
                                contentStyle={TOOLTIP_STYLE}
                                itemStyle={{ padding: 0 }}
                            />
                            {line("a", a)}
                            {line("b", b)}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Panel>
            {showGap ? (
                <Panel
                    title="Race gap"
                    description={`Accumulated time of ${b.driver} relative to ${a.driver}. Above zero means ${b.driver} is behind.`}
                >
                    <div role="img" aria-label={`Race gap between ${a.driver} and ${b.driver}`}>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart
                                data={points}
                                margin={{ top: 6, right: 8, bottom: 0, left: 0 }}
                            >
                                {grid}
                                {xAxis}
                                <YAxis
                                    width={60}
                                    tick={AXIS_TICK}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v: number) =>
                                        `${v > 0 ? "+" : ""}${v.toFixed(0)}s`
                                    }
                                />
                                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                                <Tooltip
                                    isAnimationActive={false}
                                    cursor={{
                                        stroke: "hsl(var(--foreground))",
                                        strokeOpacity: 0.4,
                                    }}
                                    labelFormatter={(v) => `After lap ${v}`}
                                    formatter={(value) => [
                                        typeof value === "number"
                                            ? `${value > 0 ? "+" : ""}${value.toFixed(3)} s`
                                            : "-",
                                        `${b.driver} vs ${a.driver}`,
                                    ]}
                                    contentStyle={TOOLTIP_STYLE}
                                    itemStyle={{ padding: 0 }}
                                />
                                <Line
                                    dataKey="gap"
                                    stroke={b.colour}
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>
            ) : null}
        </div>
    );
}
