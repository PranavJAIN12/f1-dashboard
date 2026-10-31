import { api } from "@/lib/api";
export default async function Home() {
    let races: any[] = [];
    try {
        races = (await api<any>("/races?year=2024")).races;
    } catch { }
    return (
        <div className="content">
            <div className="hero">
                <div className="eyebrow">APEX / Race Intelligence</div>
                <h1>
                    Read the race.
                    <br />
                    Find the time.
                </h1>
                <p className="sub">
                    F1 session data, telemetry and strategy analytics in one
                    engineering-focused workspace.
                </p>
            </div>
            <div className="grid four">
                <div className="card">
                    <div className="sub">DATA ENGINE</div>
                    <div className="value">FastF1</div>
                </div>
                <div className="card">
                    <div className="sub">API</div>
                    <div className="value">REST</div>
                </div>
                <div className="card">
                    <div className="sub">SWAGGER</div>
                    <div className="value">Live</div>
                </div>
                <div className="card">
                    <div className="sub">EVENTS</div>
                    <div className="value">{races.length || "—"}</div>
                </div>
            </div>
            <div className="section card">
                <h2>API surface</h2>
                <p className="sub">
                    Open Swagger to test every endpoint interactively.
                </p>
                <div className="api">
                    {[
                        "/races",
                        "/drivers",
                        "/teams",
                        "/analytics",
                        "/telemetry",
                        "/live",
                        "/ai",
                    ].map((x) => (
                        <div className="row" key={x}>
                            <span className="method">API</span>
                            <span className="code">/api/v1{x}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
