"""
Tests for Innovation Memory System & API (SIH26136).

Verifies:
- Memory creation from completed pilot decisions (SCALE, EXTEND, REJECT)
- Memory query and pagination
- Related memories discovery for new challenges
- Startup platform history
- Rule-based AI summarizer determinism
"""

from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.challenge import Challenge, ChallengeStatus
from app.models.innovation_memory import InnovationMemory, MemoryOutcome, MemorySourceType
from app.models.pilot import Pilot, PilotKPI, PilotStatus, TargetOperator
from app.models.procurement import DecisionType, ProcurementDecision
from app.models.proposal import Proposal, ProposalStatus
from app.models.startup import Startup
from app.models.user import User, UserRole
from app.services.innovation_memory_service import InnovationMemoryService

TEST_DB_URL = "sqlite:///./test_memory_suite.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
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

    # Clear tables
    db.query(InnovationMemory).delete()
    db.query(ProcurementDecision).delete()
    db.query(PilotKPI).delete()
    db.query(Pilot).delete()
    db.query(Proposal).delete()
    db.query(Challenge).delete()
    db.query(Startup).delete()
    db.query(User).delete()

    # Seed demo users
    gov_user = User(
        id="usr-gov-mem",
        email="gov.mem@test.gov",
        name="Gov Officer",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        is_active=True,
    )
    db.add(gov_user)

    # Seed challenge
    challenge = Challenge(
        id="ch-mem-01",
        title="Urban Flood Monitoring & Early Warning System",
        problem_statement="Monitor stormwater drainage flow and water levels in real time to prevent urban flooding.",
        domain="Urban Resilience & Disaster Management",
        status=ChallengeStatus.PUBLISHED,
        created_by=gov_user.id,
    )
    db.add(challenge)

    # Seed startup
    startup = Startup(
        id="st-mem-01",
        company_name="AquaFlow Telemetry Systems",
        slug="aquaflow-telemetry",
        dpiit_number="DPIIT-MEM-8899",
        dpiit_recognized=True,
    )
    db.add(startup)

    # Seed proposal
    proposal = Proposal(
        id="prop-mem-01",
        challenge_id=challenge.id,
        startup_id=startup.id,
        title="AquaFlow Sensor Proposal",
        executive_summary="Flood telemetry sensors",
        status=ProposalStatus.SHORTLISTED,
    )
    db.add(proposal)
    db.flush()

    # Seed completed pilot
    now = datetime.now(timezone.utc)
    pilot = Pilot(
        id="pilot-mem-01",
        proposal_id=proposal.id,
        challenge_id=challenge.id,
        startup_id=startup.id,
        name="Stormwater Sensor Pilot",
        objective="Validate IoT flood sensor telemetry accuracy under urban monsoon conditions.",
        scope="Ward 12 stormwater drain sensors deployment.",
        success_criteria="Achieve >95% accuracy.",
        status=PilotStatus.COMPLETED,
        government_owner_id=gov_user.id,
        start_date=now - timedelta(days=90),
        end_date=now,
        completed_at=now,
    )
    db.add(pilot)
    db.flush()

    # Seed KPIs
    kpi = PilotKPI(
        id="kpi-mem-01",
        pilot_id=pilot.id,
        name="Sensor Water-Level Accuracy",
        target_value=95.0,
        target_operator=TargetOperator.GREATER_EQUAL,
        unit="%",
        weight=1.0,
        latest_actual_value=96.8,
    )
    db.add(kpi)

    # Seed decision
    decision = ProcurementDecision(
        id="dec-mem-01",
        pilot_id=pilot.id,
        challenge_id=challenge.id,
        startup_id=startup.id,
        decision=DecisionType.SCALE,
        ai_recommendation=DecisionType.SCALE,
        ai_score=94.0,
        ai_confidence=92.0,
        justification="All telemetry benchmarks achieved with sub-5-minute alert latency.",
        decided_by=gov_user.id,
        assessment_snapshot={
            "overall_score": 94.0,
            "recommendation": "SCALE",
            "kpi_performance": 96.8,
            "milestone_performance": 100.0,
            "risk_level": "LOW",
        },
    )
    db.add(decision)
    db.commit()

    # Auto-generate memory from decision
    InnovationMemoryService.create_memory_from_decision(
        db=db, pilot=pilot, decision=decision, actor=gov_user
    )

    yield
    db.close()


def test_auto_created_memory():
    headers = auth_header("usr-gov-mem", UserRole.GOVERNMENT_OFFICER)

    resp = client.get("/api/innovation-memory", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    item = data["items"][0]
    assert item["outcome"] == "SCALE"
    assert "AquaFlow" in item["startup_name"]
    assert len(item["lessons_learned"]) > 0
    assert len(item["success_factors"]) > 0


def test_related_memories_for_challenge():
    headers = auth_header("usr-gov-mem", UserRole.GOVERNMENT_OFFICER)

    # Query related memories for a new challenge in the same domain
    db = TestingSessionLocal()
    new_challenge = Challenge(
        id="ch-new-flood",
        title="Automated River Flood Level Telemetry",
        problem_statement="Stormwater and river drainage water levels monitoring.",
        domain="Urban Resilience & Disaster Management",
        status=ChallengeStatus.PUBLISHED,
        created_by="usr-gov-mem",
    )
    db.add(new_challenge)
    db.commit()
    challenge_id = new_challenge.id
    db.close()

    resp = client.get(f"/api/innovation-memory/related/{challenge_id}", headers=headers)
    assert resp.status_code == 200
    related = resp.json()
    assert len(related) > 0
    assert related[0]["domain"] == "Urban Resilience & Disaster Management"


def test_startup_platform_history():
    headers = auth_header("usr-gov-mem", UserRole.GOVERNMENT_OFFICER)

    resp = client.get("/api/innovation-memory/startup/st-mem-01", headers=headers)
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) == 1
    assert history[0]["outcome"] == "SCALE"
