"use client";

import { useState } from "react";
import { CloudRain, Droplets, Gauge, Sun, Thermometer, Wind } from "lucide-react";
import { formatLapTime, formatSessionTime } from "@/lib/format";
import type { LapRow, WeatherSample } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Only the columns the table shows cross the server/client boundary.
export type LapTableRow = Pick<
    LapRow,
    "driver_id" | "driver" | "lap_number" | "lap_time_seconds" | "compound" | "position"
>;

const LAP_PAGE_SIZE = 25;
const WEATHER_PAGE_SIZE = 12;

function metric(value: string | number | null | undefined) {
    return value === null || value === undefined || value === "" ? "-" : value;
}
const TYRES: Record<string, string> = {
    SOFT: "🔴",
    MEDIUM: "🟡",
    HARD: "⚪",
    INTERMEDIATE: "🟢",
    WET: "🔵",
};
function tyre(compound: string | null | undefined) {
    return compound ? `${TYRES[compound.toUpperCase()] ?? "⚫"} ${compound}` : "-";
}
function numbers(values: Array<number | null | undefined>) {
    return values.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
    );
}
function average(values: Array<number | null | undefined>) {
    const valid = numbers(values);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
function range(values: Array<number | null | undefined>) {
    const valid = numbers(values);
    return valid.length
        ? `${Math.min(...valid).toFixed(1)} - ${Math.max(...valid).toFixed(1)}`
        : "-";
}

export function LapsTable({ laps }: { laps: LapTableRow[] }) {
    const [page, setPage] = useState(1);
    const lapCount = new Set(laps.map((lap) => lap.lap_number)).size;
    const visible = laps.slice((page - 1) * LAP_PAGE_SIZE, page * LAP_PAGE_SIZE);
    const bestTime = Math.min(...numbers(laps.map((lap) => lap.lap_time_seconds)));

    return (
        <Card>
            <CardHeader>
                <div className="section-heading">
                    <CardTitle>⏱️ Lap data</CardTitle>
                    <Badge variant="secondary">{laps.length} records</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>🏎️ Driver</TableHead>
                            <TableHead>Lap</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>🛞 Tyre</TableHead>
                            <TableHead>Pos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:nth-child(even)]:bg-muted/30">
                        {visible.map((lap) => (
                            <TableRow key={`${lap.driver_id}-${lap.lap_number}`}>
                                <TableCell className="font-medium text-foreground">
                                    {lap.driver}
                                </TableCell>
                                <TableCell>{metric(lap.lap_number)}</TableCell>
                                <TableCell
                                    className={
                                        lap.lap_time_seconds === bestTime
                                            ? "font-mono font-bold text-accent"
                                            : "font-mono"
                                    }
                                >
                                    {formatLapTime(lap.lap_time_seconds)}
                                    {lap.lap_time_seconds === bestTime ? (
                                        <span className="table-secondary">🟣 Fastest lap</span>
                                    ) : null}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{tyre(lap.compound)}</Badge>
                                </TableCell>
                                <TableCell>{metric(lap.position)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataPagination
                    page={page}
                    pageSize={LAP_PAGE_SIZE}
                    totalItems={laps.length}
                    onPageChange={setPage}
                />
                <p className="table-note">
                    {laps.length} records across {lapCount} laps.
                </p>
            </CardContent>
        </Card>
    );
}

export function WeatherPanel({ weather }: { weather: WeatherSample[] }) {
    const [page, setPage] = useState(1);
    const visible = weather.slice((page - 1) * WEATHER_PAGE_SIZE, page * WEATHER_PAGE_SIZE);
    const wetSamples = weather.filter((sample) => sample.Rainfall === true).length;
    const averageAir = average(weather.map((sample) => sample.AirTemp));
    const averageTrack = average(weather.map((sample) => sample.TrackTemp));

    return (
        <Card>
            <CardHeader>
                <div className="section-heading">
                    <CardTitle>🌦️ Track conditions</CardTitle>
                    <Badge variant="secondary">{weather.length} samples</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="weather-summary">
                    <div>
                        <span className="label flex items-center gap-1.5">
                            <Thermometer
                                aria-hidden="true"
                                className="h-3.5 w-3.5 text-orange-500"
                            />
                            Average air
                        </span>
                        <strong>{averageAir === null ? "-" : `${averageAir.toFixed(1)} °C`}</strong>
                    </div>
                    <div>
                        <span className="label flex items-center gap-1.5">
                            <Gauge aria-hidden="true" className="h-3.5 w-3.5 text-red-500" />
                            Average track
                        </span>
                        <strong>
                            {averageTrack === null ? "-" : `${averageTrack.toFixed(1)} °C`}
                        </strong>
                    </div>
                    <div>
                        <span className="label flex items-center gap-1.5">
                            <Sun aria-hidden="true" className="h-3.5 w-3.5 text-yellow-500" />
                            Air range
                        </span>
                        <strong>{range(weather.map((sample) => sample.AirTemp))} °C</strong>
                    </div>
                    <div>
                        <span className="label flex items-center gap-1.5">
                            <CloudRain aria-hidden="true" className="h-3.5 w-3.5 text-blue-500" />
                            Rain samples
                        </span>
                        <strong>{wetSamples}</strong>
                    </div>
                </div>
                <p className="table-note mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                        <Droplets aria-hidden="true" className="h-3.5 w-3.5" /> Humidity{" "}
                        {average(weather.map((s) => s.Humidity))?.toFixed(0) ?? "-"}% avg
                    </span>
                    <span className="flex items-center gap-1">
                        <Wind aria-hidden="true" className="h-3.5 w-3.5" /> Wind{" "}
                        {average(weather.map((s) => s.WindSpeed))?.toFixed(1) ?? "-"} m/s avg
                    </span>
                </p>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>🕒 Time</TableHead>
                            <TableHead>🌡️ Air</TableHead>
                            <TableHead>🛣️ Track</TableHead>
                            <TableHead>💧 Humidity</TableHead>
                            <TableHead>📊 Pressure</TableHead>
                            <TableHead>💨 Wind</TableHead>
                            <TableHead>☔ Rain</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr:nth-child(even)]:bg-muted/30">
                        {visible.map((sample) => (
                            <TableRow key={sample.Time}>
                                <TableCell>{formatSessionTime(sample.Time)}</TableCell>
                                <TableCell>{metric(sample.AirTemp)} °C</TableCell>
                                <TableCell>{metric(sample.TrackTemp)} °C</TableCell>
                                <TableCell>{metric(sample.Humidity)}%</TableCell>
                                <TableCell>{metric(sample.Pressure)} hPa</TableCell>
                                <TableCell>{metric(sample.WindSpeed)} m/s</TableCell>
                                <TableCell>
                                    {sample.Rainfall === null ? (
                                        "-"
                                    ) : sample.Rainfall ? (
                                        <Badge variant="accent">🌧️ Wet</Badge>
                                    ) : (
                                        <Badge variant="outline">☀️ Dry</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataPagination
                    page={page}
                    pageSize={WEATHER_PAGE_SIZE}
                    totalItems={weather.length}
                    onPageChange={setPage}
                />
            </CardContent>
        </Card>
    );
}

export function LoadingRows({ columns }: { columns: number }) {
    return (
        <div className={`skeleton-rows ${columns === 7 ? "weather-skeleton" : ""}`}>
            {Array.from({ length: 7 }, (_, row) => (
                <div className="skeleton-row" key={row}>
                    {Array.from({ length: columns }, (_, column) => (
                        <Skeleton className="h-4" key={column} />
                    ))}
                </div>
            ))}
        </div>
    );
}
