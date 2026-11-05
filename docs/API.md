# Swagger API

Run the data engine and open `http://localhost:8000/docs`.

Data comes from OpenF1 and covers the 2023 season onwards. Rounds are numbered by race weekend (testing excluded), and sessions use the codes `R`, `Q`, `S`, `SQ`, `FP1`, `FP2`, `FP3`. Telemetry is sampled at about 3.7 Hz.

Groups:
- Races: schedule, race details, results, laps, pit stops, weather, sessions
- Drivers: profiles, results, laps, telemetry
- Teams: profiles and results
- Analytics: pace, comparison, sectors, tyre strategy, stints, degradation, position changes, gaps
- Telemetry: driver telemetry, lap telemetry, comparison, track coordinates
- Live: session, leaderboard, timing, pit stops, track status
- AI Analyst: ask, race summary, driver analysis, strategy analysis
- Health: service health and OpenAPI
