from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

def test_openapi_contains_f1_api_groups():
    paths = client.get("/openapi.json").json()["paths"]
    required = [
        "/api/v1/races", "/api/v1/races/{year}/{round_number}/results",
        "/api/v1/drivers", "/api/v1/teams",
        "/api/v1/analytics/pace", "/api/v1/analytics/driver-comparison",
        "/api/v1/telemetry/compare", "/api/v1/live/leaderboard",
        "/api/v1/ai/ask"
    ]
    assert all(x in paths for x in required)


def test_telemetry_routes_accept_session_and_return_typed_laps():
    paths = client.get("/openapi.json").json()["paths"]
    for route in ("/api/v1/telemetry/{driver_id}", "/api/v1/telemetry/compare", "/api/v1/telemetry/track"):
        names = {p["name"] for p in paths[route]["get"]["parameters"]}
        assert "session" in names, route
    ok = paths["/api/v1/telemetry/{driver_id}"]["get"]["responses"]["200"]
    assert ok["content"]["application/json"]["schema"]["$ref"].endswith("/TelemetryResponse")
