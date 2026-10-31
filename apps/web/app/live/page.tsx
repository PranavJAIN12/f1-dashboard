export default function Live() {
    return (
        <div className="content">
            <div className="eyebrow">Race control</div>
            <h1>Live</h1>
            <p className="sub">
                Live API contracts are defined and ready for the future ingestion worker.
            </p>
            <div className="card section api">
                {["session", "leaderboard", "timing", "pit-stops", "track-status"].map((x) => (
                    <div className="row" key={x}>
                        <span className="method">GET</span>
                        <span className="code">/api/v1/live/{x}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
