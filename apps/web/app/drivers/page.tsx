import { api, type SessionResult } from "@/lib/api";
export default async function Drivers() {
    let ds: SessionResult[] = [];
    try {
        ds = (await api<{ drivers: SessionResult[] }>("/drivers?year=2026&round=8")).drivers;
    } catch {}
    return (
        <div className="content">
            <div className="eyebrow">Driver intelligence</div>
            <h1>Drivers</h1>
            <div className="grid three section">
                {ds.map((d) => (
                    <div className="card" key={d.driver_id}>
                        <div className="sub">P{d.position}</div>
                        <h2>{d.full_name}</h2>
                        <p className="sub">
                            {d.abbreviation} · {d.team}
                        </p>
                        <div className="value">{d.points} pts</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
