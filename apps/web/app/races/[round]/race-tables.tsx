"use client";

import { useState } from "react";
import { formatLapTime, formatSeconds, formatUtcTime } from "@/lib/format";
import type { PitStop, SessionResult } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

function metric(value: string | number | null | undefined) {
    return value === null || value === undefined || value === "" ? "-" : value;
}

export function ResultsTable({
    title,
    results,
    hasPoints,
}: {
    title: string;
    results: SessionResult[];
    hasPoints: boolean;
}) {
    const [page, setPage] = useState(1);
    const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <Card className="section">
            <CardHeader>
                <div className="section-heading">
                    <CardTitle>{title}</CardTitle>
                    <Badge variant="secondary">{results.length} classified</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Grid</TableHead>
                            <TableHead>Laps</TableHead>
                            <TableHead>Fastest lap</TableHead>
                            {hasPoints ? <TableHead>Pts</TableHead> : null}
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visible.map((result) => (
                            <TableRow key={result.driver_id}>
                                <TableCell className="font-bold text-foreground">
                                    {metric(result.position)}
                                </TableCell>
                                <TableCell>
                                    <b>{result.abbreviation}</b>
                                    <span className="table-secondary">{result.full_name}</span>
                                </TableCell>
                                <TableCell>{metric(result.team)}</TableCell>
                                <TableCell>{metric(result.grid)}</TableCell>
                                <TableCell>{metric(result.laps)}</TableCell>
                                <TableCell>{formatLapTime(result.fastest_lap)}</TableCell>
                                {hasPoints ? (
                                    <TableCell className="font-bold text-foreground">
                                        {metric(result.points)}
                                    </TableCell>
                                ) : null}
                                <TableCell>
                                    <Badge
                                        variant={
                                            result.status === "Finished" ? "secondary" : "outline"
                                        }
                                    >
                                        {result.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataPagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalItems={results.length}
                    onPageChange={setPage}
                />
            </CardContent>
        </Card>
    );
}

export function PitStopsTable({ pitStops }: { pitStops: PitStop[] }) {
    const [page, setPage] = useState(1);
    const visible = pitStops.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <Card className="section">
            <CardHeader>
                <div className="section-heading">
                    <CardTitle>Pit stops</CardTitle>
                    <Badge variant="secondary">{pitStops.length} stops</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Driver</TableHead>
                            <TableHead>Lap</TableHead>
                            <TableHead>Pit lane</TableHead>
                            <TableHead>Stationary</TableHead>
                            <TableHead>Recorded (UTC)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visible.map((stop) => (
                            <TableRow key={stop.stop_number}>
                                <TableCell className="font-medium text-foreground">
                                    {stop.driver_id}
                                </TableCell>
                                <TableCell>{metric(stop.lap_number)}</TableCell>
                                <TableCell>{formatSeconds(stop.duration_seconds, 1)}</TableCell>
                                <TableCell>{formatSeconds(stop.stationary_seconds, 1)}</TableCell>
                                <TableCell>{formatUtcTime(stop.recorded_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataPagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalItems={pitStops.length}
                    onPageChange={setPage}
                />
            </CardContent>
        </Card>
    );
}
