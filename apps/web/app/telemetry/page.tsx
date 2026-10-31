export default function Telemetry() {
    return (
        <div className="content">
            <div className="eyebrow">Vehicle data</div>
            <h1>Telemetry</h1>
            <p className="sub">
                Speed, throttle, brake, gear, RPM, DRS and track coordinates.
            </p>
            <div className="card section api">
                {[
                    "/telemetry/{driver_id}",
                    "/telemetry/{driver_id}/lap/{lap_number}",
                    "/telemetry/compare",
                    "/telemetry/track",
                ].map((x) => (
                    <div className="row" key={x}>
                        <span className="method">GET</span>
                        <span className="code">/api/v1{x}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
