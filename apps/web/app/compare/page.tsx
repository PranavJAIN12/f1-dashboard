export default function Compare() {
    return (
        <div className="content">
            <div className="eyebrow">Performance engineering</div>
            <h1>Compare</h1>
            <p className="sub">Driver pace and telemetry comparison.</p>
            <div className="grid two section">
                <div className="card">
                    <div className="code">POST /api/v1/analytics/driver-comparison</div>
                </div>
                <div className="card">
                    <div className="code">GET /api/v1/telemetry/compare</div>
                </div>
            </div>
        </div>
    );
}
