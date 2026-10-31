import { getRaces, type RaceListItem } from "@/lib/api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Races() {
    let rs: RaceListItem[] = [];
    try {
        rs = (await getRaces(2026)).races;
    } catch {}
    return (
        <div className="content">
            <div className="eyebrow">Championship</div>
            <h1>Races</h1>
            <p className="sub">FastF1 event schedule.</p>
            <Card className="section overflow-hidden">
                <CardHeader className="border-b bg-muted/40">
                    <CardTitle>2026 event schedule</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="api">
                        {rs.map((r) => (
                            <Link className="row" href={`/races/${r.round}`} key={r.round}>
                                <Badge variant="accent">R{String(r.round).padStart(2, "0")}</Badge>
                                <span>
                                    {r.event_name} · {r.country}
                                </span>
                                <Button asChild variant="ghost" size="sm" className="row-arrow">
                                    <span>View race -&gt;</span>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
