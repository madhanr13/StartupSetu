"""
Tests for What-If Procurement Simulator (StartupSetu).

Verifies:
- Matching simulation recalculates startup scores with custom weights.
- Matching simulation produces transparent rank changes and deterministic explanations.
- Pilot decision simulation evaluates outcome shifts under modified threshold assumptions.
- Simulation execution NEVER modifies official challenges, startups, pilots, decisions, or system settings.
- Scenario persistence (save, list, retrieve, delete) with audit log recording.
- RBAC enforcement (only authorized roles can access simulation APIs).
"""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.audit import AuditEvent
from app.models.challenge import Challenge, ChallengeStatus
from app.models.department import Department
from app.models.pilot import KPIStatus, Pilot, PilotKPI, PilotMilestone, PilotStatus, TargetOperator
from app.models.proposal import Proposal, ProposalStatus
from app.models.simulation import SimulationScenario
from app.models.startup import Startup, StartupReadinessScore
from app.models.system_setting import SettingCategory, SettingValueType, SystemSetting
from app.models.user import User, UserRole

from sqlalchemy.pool import StaticPool

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


def auth_header(user_id: str, role: UserRole):
    token = create_access_token(data={"sub": user_id, "role": role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    try:
        # Clear relevant tables
        db.query(SimulationScenario).delete()
        db.query(AuditEvent).delete()
        db.query(PilotKPI).delete()
        db.query(PilotMilestone).delete()
        db.query(Pilot).delete()
        db.query(Proposal).delete()
        db.query(StartupReadinessScore).delete()
        db.query(Startup).delete()
        db.query(Challenge).delete()
        db.query(SystemSetting).delete()
        db.query(User).delete()
        db.query(Department).delete()

        # Seed Department
        dept = Department(
            id="dept-sim-1",
            name="Ministry of Urban Development",
            code="MOUD",
        )
        db.add(dept)

        # Seed Users
        gov_user = User(
            id="usr-gov-sim",
            email="officer.sim@gov.in",
            name="Gov Officer Sim",
            hashed_password="hashed_pw_test",
            role=UserRole.GOVERNMENT_OFFICER,
            department_id=dept.id,
            is_active=True,
        )
        admin_user = User(
            id="usr-admin-sim",
            email="admin.sim@gov.in",
            name="Admin Sim",
            hashed_password="hashed_pw_test",
            role=UserRole.ADMIN,
            is_active=True,
        )
        startup_user = User(
            id="usr-startup-sim",
            email="founder.sim@startup.in",
            name="Startup User",
            hashed_password="hashed_pw_test",
            role=UserRole.STARTUP,
            is_active=True,
        )
        db.add_all([gov_user, admin_user, startup_user])

        # Seed Default Matching Weights
        weights_setting = SystemSetting(
            id="set-sim-weights",
            key="matching.weights",
            value={
                "technology_fit": 0.25,
                "domain_fit": 0.20,
                "relevant_projects": 0.15,
                "team_capability": 0.10,
                "deployment_experience": 0.10,
                "scalability": 0.10,
                "security_readiness": 0.05,
                "budget_compatibility": 0.05,
            },
            value_type=SettingValueType.JSON.value,
            category=SettingCategory.MATCHING.value,
            label="Matching Weights",
        )
        db.add(weights_setting)

        # Seed Challenge
        challenge = Challenge(
            id="ch-sim-01",
            title="AI-Assisted Traffic Signal Optimization",
            description="Autonomous adaptive traffic management using computer vision and edge computing.",
            domain="Urban Mobility",
            status=ChallengeStatus.PUBLISHED,
            created_by=gov_user.id,
            department_id=dept.id,
        )
        db.add(challenge)

        # Seed Two Startups with distinct capability profiles
        startup_a = Startup(
            id="st-sim-a",
            company_name="VisionFlow AI",
            slug="visionflow-ai",
            dpiit_number="DIPP99001",
            dpiit_recognized=True,
        )
        readiness_a = StartupReadinessScore(
            startup_id=startup_a.id,
            team_strength=95.0,  # High team capability
            deployment_readiness=60.0,
            scalability=70.0,
            security_readiness=80.0,
        )

        startup_b = Startup(
            id="st-sim-b",
            company_name="GridEdge Solutions",
            slug="gridedge-solutions",
            dpiit_number="DIPP99002",
            dpiit_recognized=True,
        )
        readiness_b = StartupReadinessScore(
            startup_id=startup_b.id,
            team_strength=60.0,
            deployment_readiness=95.0,  # High deployment readiness
            scalability=85.0,
            security_readiness=85.0,
        )
        db.add_all([startup_a, readiness_a, startup_b, readiness_b])
        db.flush()

        # Seed Proposal for Pilot
        proposal = Proposal(
            id="prop-sim-01",
            challenge_id=challenge.id,
            startup_id=startup_a.id,
            title="VisionFlow Urban Traffic AI",
            executive_summary="AI traffic signal optimization demonstration.",
            estimated_cost=2500000.0,
            implementation_duration_days=90,
            status=ProposalStatus.SHORTLISTED,
        )
        db.add(proposal)
        db.flush()

        # Seed Pilot for Decision Simulation
        now = datetime.now(timezone.utc)
        pilot = Pilot(
            id="plt-sim-01",
            proposal_id=proposal.id,
            challenge_id=challenge.id,
            startup_id=startup_a.id,
            name="UrbanFlow Pilot Project",
            objective="Validate CV traffic signal control",
            scope="10 intersections across central corridor",
            success_criteria="Congestion reduced by >= 20%",
            government_owner_id=gov_user.id,
            status=PilotStatus.COMPLETED,
            start_date=now - timedelta(days=90),
            end_date=now,
            overall_progress_percentage=100.0,
        )
        db.add(pilot)

        # Add a KPI with 80% achievement
        kpi = PilotKPI(
            id="kpi-sim-01",
            pilot_id=pilot.id,
            name="Congestion Reduction",
            target_value=20.0,
            target_operator=TargetOperator.GREATER_EQUAL,
            latest_actual_value=16.0,  # 80% achieved
            status=KPIStatus.ACHIEVED,
            weight=1.0,
        )
        db.add(kpi)

        db.commit()
    finally:
        db.close()
    yield


def test_matching_simulation_recalculates_and_compares():
    """Verify that matching simulation recalculates scores and explains rank movement."""
    headers = auth_header("usr-gov-sim", UserRole.GOVERNMENT_OFFICER)

    # Simulation scenario: shift heavily to team capability
    payload = {
        "challenge_id": "ch-sim-01",
        "weights": {
            "technology_fit": 0.10,
            "domain_fit": 0.10,
            "relevant_projects": 0.10,
            "team_capability": 0.50,  # Greatly amplified team weight
            "deployment_experience": 0.05,
            "scalability": 0.05,
            "security_readiness": 0.05,
            "budget_compatibility": 0.05,
        },
    }

    res = client.post("/api/simulations/matching", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["challenge_id"] == "ch-sim-01"
    assert len(data["rankings"]) == 2
    assert "explanation" in data
    assert len(data["explanation"]) > 0

    # VisionFlow AI (with 95 team score) should gain points relative to GridEdge
    vision_flow = next(r for r in data["rankings"] if r["startup_id"] == "st-sim-a")
    assert vision_flow["simulated_score"] > 0
    assert vision_flow["baseline_score"] > 0
    assert "movement_reason" in vision_flow


def test_matching_simulation_never_mutates_database():
    """Verify that matching simulation runs purely in-memory and does not alter DB records."""
    headers = auth_header("usr-gov-sim", UserRole.GOVERNMENT_OFFICER)

    # Capture pre-simulation DB states
    db = TestingSessionLocal()
    orig_setting = db.query(SystemSetting).filter(SystemSetting.key == "matching.weights").first()
    orig_weights = dict(orig_setting.value)
    orig_challenge_title = db.query(Challenge).filter(Challenge.id == "ch-sim-01").first().title
    orig_startup_count = db.query(Startup).count()
    db.close()

    # Run simulation with extreme weights
    payload = {
        "challenge_id": "ch-sim-01",
        "weights": {
            "technology_fit": 0.80,
            "domain_fit": 0.20,
        },
    }
    res = client.post("/api/simulations/matching", json=payload, headers=headers)
    assert res.status_code == 200

    # Verify DB post-simulation
    db = TestingSessionLocal()
    post_setting = db.query(SystemSetting).filter(SystemSetting.key == "matching.weights").first()
    assert post_setting.value == orig_weights, "Official system settings were mutated by simulation!"
    post_challenge = db.query(Challenge).filter(Challenge.id == "ch-sim-01").first()
    assert post_challenge.title == orig_challenge_title
    assert db.query(Startup).count() == orig_startup_count
    db.close()


def test_pilot_simulation_threshold_changes_outcome():
    """Verify that pilot simulation accurately reflects threshold changes without altering pilot status."""
    headers = auth_header("usr-gov-sim", UserRole.GOVERNMENT_OFFICER)

    # 1. Test lenient thresholds (should permit SCALE)
    lenient_payload = {
        "pilot_id": "plt-sim-01",
        "thresholds": {
            "min_overall_score": 40.0,
            "min_kpi_score": 50.0,
            "max_acceptable_risk": "HIGH",
            "require_zero_critical_risks": False,
            "require_zero_blocked_milestones": False,
        },
    }
    res1 = client.post("/api/simulations/pilot", json=lenient_payload, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["simulated_outcome"] == "SCALE"

    # 2. Test strict thresholds where KPI requires 95% (our pilot achieved 80%)
    strict_payload = {
        "pilot_id": "plt-sim-01",
        "thresholds": {
            "min_overall_score": 90.0,
            "min_kpi_score": 95.0,  # Too high for this pilot
            "max_acceptable_risk": "LOW",
            "require_zero_critical_risks": True,
            "require_zero_blocked_milestones": True,
        },
    }
    res2 = client.post("/api/simulations/pilot", json=strict_payload, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["simulated_outcome"] in ["EXTEND", "REJECT"]
    assert "explanation" in data2

    # Verify pilot in DB is still untouched
    db = TestingSessionLocal()
    pilot = db.query(Pilot).filter(Pilot.id == "plt-sim-01").first()
    assert pilot.status == PilotStatus.COMPLETED, "Official pilot record was mutated!"
    db.close()


def test_save_and_retrieve_scenario():
    """Verify scenario saving, listing, retrieval, and deletion with audit trail."""
    headers = auth_header("usr-gov-sim", UserRole.GOVERNMENT_OFFICER)

    save_payload = {
        "title": "High Technical Depth Scenario",
        "description": "Exploration of outcomes when technical competency is prioritized at 50%.",
        "scenario_type": "MATCHING",
        "target_id": "ch-sim-01",
        "target_title": "AI-Assisted Traffic Signal Optimization",
        "input_parameters": {"technology_fit": 0.5, "domain_fit": 0.5},
        "baseline_parameters": {"technology_fit": 0.25, "domain_fit": 0.20},
        "results_summary": {"total_evaluated": 2, "rank_movements": 1},
        "explanation": "Startup A promoted due to high technical compatibility.",
    }

    # Save scenario
    create_res = client.post("/api/simulations/scenarios", json=save_payload, headers=headers)
    assert create_res.status_code == 201, create_res.text
    scenario = create_res.json()
    scenario_id = scenario["id"]
    assert scenario["title"] == "High Technical Depth Scenario"

    # List scenarios
    list_res = client.get("/api/simulations/scenarios", headers=headers)
    assert list_res.status_code == 200
    scenarios = list_res.json()
    assert any(s["id"] == scenario_id for s in scenarios)

    # Get single scenario
    get_res = client.get(f"/api/simulations/scenarios/{scenario_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "High Technical Depth Scenario"

    # Verify AuditEvent was logged
    db = TestingSessionLocal()
    audit_event = db.query(AuditEvent).filter(
        AuditEvent.entity_type == "SimulationScenario",
        AuditEvent.entity_id == scenario_id,
    ).first()
    assert audit_event is not None
    assert audit_event.actor_id == "usr-gov-sim"
    db.close()

    # Delete scenario
    del_res = client.delete(f"/api/simulations/scenarios/{scenario_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deletion
    verify_res = client.get(f"/api/simulations/scenarios/{scenario_id}", headers=headers)
    assert verify_res.status_code == 404


def test_simulation_rbac_enforcement():
    """Verify that unauthorized roles cannot run simulations."""
    startup_headers = auth_header("usr-startup-sim", UserRole.STARTUP)

    res = client.post(
        "/api/simulations/matching",
        json={"challenge_id": "ch-sim-01", "weights": {"technology_fit": 0.5}},
        headers=startup_headers,
    )
    assert res.status_code == 403, "STARTUP role should not have access to matching simulations!"
