import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000"

def test_api_health_and_pilots():
    # Login as gov officer
    data = json.dumps({"email": "gov@demo.sih", "password": "demo1234"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        body = json.loads(resp.read().decode())
        token = body["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Fetch pilots
    req = urllib.request.Request(f"{BASE_URL}/api/pilots", headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        pilots = json.loads(resp.read().decode())
        assert len(pilots) > 0, "No pilots returned"

    # Select pilot with milestones (e.g. pilot-road-01)
    pilot = next((p for p in pilots if p.get("id") == "pilot-road-01"), pilots[0])
    pilot_id = pilot["id"]
    req = urllib.request.Request(f"{BASE_URL}/api/pilots/{pilot_id}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        detail = json.loads(resp.read().decode())
        assert detail["health"]["health_label"] is not None
        assert len(detail["kpis"]) > 0
        assert len(detail["milestones"]) > 0


