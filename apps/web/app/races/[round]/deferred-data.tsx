"use client";

import { useEffect, useState } from "react";
import { formatLapTime, type LapRow, type WeatherSample } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = { year: number; round: number };
type LoadState = { laps: LapRow[]; weather: WeatherSample[]; loading: boolean; error: boolean };

function metric(value: string | number | null | undefined) { return value === null || value === undefined || value === "" ? "-" : value; }
function average(values: Array<number | null | undefined>) {
    const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
function range(values: Array<number | null | undefined>) {
    const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return valid.length ? `${Math.min(...valid).toFixed(1)} - ${Math.max(...valid).toFixed(1)}` : "-";
}

export default function DeferredRaceData({ year, round }: Props) {
    const [state, setState] = useState<LoadState>({ laps: [], weather: [], loading: true, error: false });
    const [lapsPage, setLapsPage] = useState(1);
    const [weatherPage, setWeatherPage] = useState(1);
    const lapPageSize = 25;
    const weatherPageSize = 12;

    useEffect(() => {
        const base = process.env.NEXT_PUBLIC_DATA_ENGINE_URL ?? "http://localhost:8000";
        Promise.all([
            fetch(`${base}/api/v1/races/${year}/${round}/laps?session=R`).then((response) => response.ok ? response.json() : Promise.reject()),
            fetch(`${base}/api/v1/races/${year}/${round}/weather?session=R`).then((response) => response.ok ? response.json() : Promise.reject()),
        ]).then(([laps, weather]) => setState({ laps: laps.laps ?? [], weather: weather.weather ?? [], loading: false, error: false }))
            .catch(() => setState((current) => ({ ...current, loading: false, error: true })));
    }, [round, year]);

    if (state.loading) return <div className="deferred-grid"><Card><CardHeader><div className="section-heading"><CardTitle>Lap data</CardTitle><Skeleton className="h-5 w-20" /></div></CardHeader><CardContent><LoadingRows columns={5} /></CardContent></Card><Card><CardHeader><div className="section-heading"><CardTitle>Track conditions</CardTitle><Skeleton className="h-5 w-20" /></div></CardHeader><CardContent><div className="weather-summary">{Array.from({ length: 4 }, (_, index) => <div key={index}><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-5 w-20" /></div>)}</div><LoadingRows columns={7} /></CardContent></Card></div>;
    if (state.error) return <Card className="section"><CardContent><p className="muted">Detailed lap and weather data could not be loaded. The core race data is still available above.</p></CardContent></Card>;

    const lapCount = new Set(state.laps.map((lap) => lap.lap_number)).size;
    const visibleLaps = state.laps.slice((lapsPage - 1) * lapPageSize, lapsPage * lapPageSize);
    const visibleWeather = state.weather.slice((weatherPage - 1) * weatherPageSize, weatherPage * weatherPageSize);
    const wetSamples = state.weather.filter((sample) => sample.Rainfall === true).length;
    const averageAir = average(state.weather.map((sample) => sample.AirTemp));
    const averageTrack = average(state.weather.map((sample) => sample.TrackTemp));
    return <>
        <div className="deferred-grid">
            <Card>
                <CardHeader><div className="section-heading"><CardTitle>Lap data</CardTitle><Badge variant="secondary">{state.laps.length} records</Badge></div></CardHeader>
                <CardContent><Table><TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Lap</TableHead><TableHead>Time</TableHead><TableHead>Tyre</TableHead><TableHead>Pos</TableHead></TableRow></TableHeader><TableBody>{visibleLaps.map((lap, index) => <TableRow key={`${lap.driver_id}-${lap.lap_number}-${index}`}><TableCell className="font-medium text-white">{lap.driver}</TableCell><TableCell>{metric(lap.lap_number)}</TableCell><TableCell>{formatLapTime(lap.lap_time_seconds)}</TableCell><TableCell><Badge variant="outline">{metric(lap.compound)}</Badge></TableCell><TableCell>{metric(lap.position)}</TableCell></TableRow>)}</TableBody></Table><DataPagination page={lapsPage} pageSize={lapPageSize} totalItems={state.laps.length} onPageChange={setLapsPage} /><p className="table-note">{state.laps.length} records across {lapCount} laps.</p></CardContent>
            </Card>
            <Card>
                <CardHeader><div className="section-heading"><CardTitle>Track conditions</CardTitle><Badge variant="secondary">{state.weather.length} samples</Badge></div></CardHeader>
                <CardContent>{state.weather.length ? <><div className="weather-summary"><div><span className="label">Average air</span><strong>{averageAir === null ? "-" : `${averageAir.toFixed(1)} C`}</strong></div><div><span className="label">Average track</span><strong>{averageTrack === null ? "-" : `${averageTrack.toFixed(1)} C`}</strong></div><div><span className="label">Air range</span><strong>{range(state.weather.map((sample) => sample.AirTemp))} C</strong></div><div><span className="label">Rain samples</span><strong>{wetSamples}</strong></div></div><Table><TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Air</TableHead><TableHead>Track</TableHead><TableHead>Humidity</TableHead><TableHead>Pressure</TableHead><TableHead>Wind</TableHead><TableHead>Rain</TableHead></TableRow></TableHeader><TableBody>{visibleWeather.map((sample, index) => <TableRow key={index}><TableCell>{metric(sample.Time)}</TableCell><TableCell>{metric(sample.AirTemp)} C</TableCell><TableCell>{metric(sample.TrackTemp)} C</TableCell><TableCell>{metric(sample.Humidity)}%</TableCell><TableCell>{metric(sample.Pressure)} hPa</TableCell><TableCell>{metric(sample.WindSpeed)} km/h</TableCell><TableCell>{sample.Rainfall ? <Badge variant="accent">Wet</Badge> : <Badge variant="outline">Dry</Badge>}</TableCell></TableRow>)}</TableBody></Table><DataPagination page={weatherPage} pageSize={weatherPageSize} totalItems={state.weather.length} onPageChange={setWeatherPage} /></> : <p className="muted">No weather samples returned.</p>}</CardContent>
            </Card>
        </div>
    </>;
}

function LoadingRows({ columns }: { columns: number }) {
    return <div className={`skeleton-rows ${columns === 7 ? "weather-skeleton" : ""}`}>{Array.from({ length: 7 }, (_, row) => <div className="skeleton-row" key={row}>{Array.from({ length: columns }, (_, column) => <Skeleton className="h-4" key={column} />)}</div>)}</div>;
}