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
