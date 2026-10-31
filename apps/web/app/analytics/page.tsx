export default function Analytics() {
    const a = [
        "pace",
        "driver-comparison",
        "sector-times",
        "tyre-strategy",
        "stints",
        "degradation",
        "position-changes",
        "gap-analysis",
    ];
    return (
        <div className="content">
            <div className="eyebrow">Race analysis</div>
            <h1>Analytics</h1>
            <div className="grid two section">
                {a.map((x) => (
                    <div className="card" key={x}>
                        <div className="sub">ANALYTICS API</div>
                        <h2>{x}</h2>
                        <div className="code">/api/v1/analytics/{x}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
