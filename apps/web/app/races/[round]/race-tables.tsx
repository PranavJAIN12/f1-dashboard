"use client";

import { useState } from "react";
import { formatElapsed, formatLapTime, type PitStop, type SessionResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = { results: SessionResult[]; pitStops: PitStop[]; pitStopNote?: string };
function metric(value: string | number | null | undefined) { return value === null || value === undefined || value === "" ? "-" : value; }

export default function RaceTables({ results, pitStops, pitStopNote }: Props) {
    const [resultsPage, setResultsPage] = useState(1);
    const [pitStopsPage, setPitStopsPage] = useState(1);
    const resultPageSize = 10;
    const pitStopPageSize = 10;
    const visibleResults = results.slice((resultsPage - 1) * resultPageSize, resultsPage * resultPageSize);
    const visiblePitStops = pitStops.slice((pitStopsPage - 1) * pitStopPageSize, pitStopsPage * pitStopPageSize);

    return <>
        <Card className="section"><CardHeader><div className="section-heading"><CardTitle>Race results</CardTitle><Badge variant="secondary">{results.length} classified</Badge></div></CardHeader><CardContent>{results.length ? <><Table><TableHeader><TableRow><TableHead>Pos</TableHead><TableHead>Driver</TableHead><TableHead>Team</TableHead><TableHead>Grid</TableHead><TableHead>Laps</TableHead><TableHead>Fastest lap</TableHead><TableHead>Pts</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{visibleResults.map((result) => <TableRow key={result.driver_id}><TableCell className="font-bold text-white">{metric(result.position)}</TableCell><TableCell><b>{result.abbreviation}</b><span className="table-secondary">{result.full_name}</span></TableCell><TableCell>{metric(result.team)}</TableCell><TableCell>{metric(result.grid)}</TableCell><TableCell>{metric(result.laps)}</TableCell><TableCell>{formatLapTime(result.fastest_lap)}</TableCell><TableCell className="font-bold text-white">{result.points}</TableCell><TableCell><Badge variant={result.status === "Finished" ? "secondary" : "outline"}>{result.status}</Badge></TableCell></TableRow>)}</TableBody></Table><DataPagination page={resultsPage} pageSize={resultPageSize} totalItems={results.length} onPageChange={setResultsPage} /></> : <p className="muted">Race results unavailable.</p>}</CardContent></Card>
        <Card className="section"><CardHeader><div className="section-heading"><CardTitle>Pit stops</CardTitle><Badge variant="secondary">{pitStops.length} stops</Badge></div></CardHeader><CardContent>{pitStops.length ? <><Table><TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Lap</TableHead><TableHead>Duration</TableHead><TableHead>Pit in</TableHead><TableHead>Pit out</TableHead></TableRow></TableHeader><TableBody>{visiblePitStops.map((stop, index) => <TableRow key={`${stop.driver_id}-${stop.lap_number}-${index}`}><TableCell className="font-medium text-white">{metric(stop.driver_id)}</TableCell><TableCell>{metric(stop.lap_number)}</TableCell><TableCell>{formatElapsed(stop.duration_seconds)}</TableCell><TableCell>{metric(stop.pit_in_time)}</TableCell><TableCell>{metric(stop.pit_out_time)}</TableCell></TableRow>)}</TableBody></Table><DataPagination page={pitStopsPage} pageSize={pitStopPageSize} totalItems={pitStops.length} onPageChange={setPitStopsPage} /></> : <p className="muted">{pitStopNote ?? "No pit-stop records returned for this race."}</p>}</CardContent></Card>
    </>;
}
