import Link from "next/link";
import { getRaceDetails, getRacePitStops, getRaceResults, type PitStop, type RaceRef, type SessionInfo } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeferredRaceData from "./deferred-data";
import RaceTables from "./race-tables";

type Props = { params: Promise<{ round: string }> };

function DataState({ message }: { message: string }) { return <p className="muted">{message}</p>; }
function metric(value: string | number | null | undefined) { return value === null || value === undefined || value === "" ? "-" : value; }

export default async function RaceDetail({ params }: Props) {
    const { round: roundParam } = await params;
    const round = Number(roundParam);
    const year = 2026;
    const [detailsResponse, resultsResponse, pitStopsResponse] = await Promise.allSettled([
        getRaceDetails(year, round), getRaceResults(year, round), getRacePitStops(year, round),
    ]);
    const details = detailsResponse.status === "fulfilled" ? detailsResponse.value : null;
    const sessions = details?.sessions ?? [];
    const results = resultsResponse.status === "fulfilled" ? resultsResponse.value.results : [];
    const pitStops = pitStopsResponse.status === "fulfilled" ? pitStopsResponse.value.pit_stops : [];
    const pitStopNote = pitStopsResponse.status === "fulfilled" ? pitStopsResponse.value.note : undefined;
    const race = details?.race ?? (resultsResponse.status === "fulfilled" ? resultsResponse.value.race : undefined) as RaceRef | undefined;
    const winner = results.find((result) => result.position === 1);
    const podium = results.filter((result) => result.position !== null && result.position <= 3);

    if (!race) return <div className="content"><Link className="back" href="/races">&lt;- All races</Link><div className="eyebrow">Race detail</div><h1>Race unavailable</h1><p className="sub">The data engine could not return race {round} for {year}.</p></div>;

    return <div className="content">
        <Link className="back" href="/races">&lt;- All races</Link>
        <div className="eyebrow">{year} / Round {String(round).padStart(2, "0")}</div>
        <div className="title-row"><div><h1>{race.event_name}</h1>
        <p className="sub">{race.country ?? "Unknown country"} / {race.location ?? "Unknown circuit"} / {race.date ?? "Date unavailable"}</p>
        </div><Badge variant="accent">Race data</Badge></div>
        <div className="grid four section">
            <Card><CardHeader><div className="label">Country</div><div className="value small-value">{metric(race.country)}</div></CardHeader></Card>
            <Card><CardHeader><div className="label">Location</div><div className="value small-value">{metric(race.location)}</div></CardHeader></Card>
            <Card><CardHeader><div className="label">Sessions</div><div className="value small-value">{sessions.length}</div></CardHeader></Card>
            <Card><CardHeader><div className="label">Classified drivers</div><div className="value small-value">{results.length || "-"}</div></CardHeader></Card>
        </div>
        <Card className="section snapshot-card"><CardHeader><div className="section-heading"><CardTitle>Race snapshot</CardTitle><Badge variant="accent">Official results</Badge></div></CardHeader><CardContent><div className="snapshot-grid"><div><span className="label">Winner</span><div className="snapshot-value">{winner?.full_name ?? "Unavailable"}</div><p className="muted">{winner ? `${winner.team} · ${winner.points} points` : "Results have not been returned."}</p></div><div><span className="label">Podium</span><div className="podium-list">{podium.length ? podium.map((result) => <Badge variant={result.position === 1 ? "accent" : "outline"} key={result.driver_id}>{result.position}. {result.abbreviation}</Badge>) : <span className="muted">Unavailable</span>}</div></div></div></CardContent></Card>
        <Card className="section"><CardHeader><div className="section-heading"><CardTitle>Session schedule</CardTitle><span className="code">GET /sessions</span></div></CardHeader><CardContent>{sessions.length ? <div className="tag-list">{sessions.map((session: SessionInfo) => <Badge variant="outline" key={session.type}>{session.name} <b>{session.type}</b></Badge>)}</div> : <DataState message="Session metadata unavailable." />}</CardContent></Card>
        <RaceTables results={results} pitStops={pitStops as PitStop[]} pitStopNote={pitStopNote} />
        <DeferredRaceData year={year} round={round} />
    </div>;
}