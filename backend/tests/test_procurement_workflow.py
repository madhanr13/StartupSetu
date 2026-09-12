"""
Unit & Workflow Tests for Final Procurement Decision & Scale-Up Transitions.
"""

from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.challenge import Challenge, ChallengeStatus
from app.models.department import Department
from app.models.pilot import (
    IssueStatus,
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotEvidence,
    PilotIssue,
    PilotKPI,
    PilotMilestone,
    PilotRisk,
    PilotStatus,
    RiskCategory,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)
from app.models.procurement import (
    DecisionType,
    ProcurementDecision,
    ProcurementScaleUp,
    ScaleUpStatus,
)
from app.models.proposal import Proposal, ProposalStatus
from app.models.startup import Startup
from app.models.user import User, UserRole
from app.ai.pilot_assessor import DeterministicPilotAssessor
from app.schemas.procurement import ProcurementDecisionCreate, ProcurementScaleUpUpdate
from app.services.procurement_service import ProcurementService
from fastapi import HTTPException


@pytest.fixture
def db_session():
    """In-memory SQLite database session isolated per test."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def seeded_entities(db_session):
    """Fixture providing department, users, challenge, startup, proposal, and pilot."""
    now = datetime.now(timezone.utc)

    dept = Department(id="dept-mohua", name="Ministry of Housing & Urban Affairs", code="MoHUA")
    db_session.add(dept)

    officer = User(
        id="user-gov-01",
        email="gov@demo.sih",
        name="Rajesh Kumar",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        department_id=dept.id,
    )
    startup_user = User(
        id="user-startup-01",
        email="founder@roadsense.ai",
        name="Priya Sharma",
        hashed_password="hash",
        role=UserRole.STARTUP,
    )
    db_session.add_all([officer, startup_user])
    db_session.flush()

    startup = Startup(
        id="st-01",
        company_name="RoadSense Technologies",
        slug="roadsense-technologies",
        user_id=startup_user.id,
        dpiit_number="DPIIT-2024-9876",
        contact_email="founder@roadsense.ai",
    )
    challenge = Challenge(
        id="ch-road-01",
        title="AI Road Anomaly Detection",
        department_id=dept.id,
        status=ChallengeStatus.PUBLISHED,
        created_by=officer.id,
        budget_min=1000000.0,
        budget_max=5000000.0,
    )
    db_session.add_all([startup, challenge])
    db_session.flush()

    proposal = Proposal(
        id="prop-01",
        challenge_id=challenge.id,
        startup_id=startup.id,
        title="RoadSense Edge Proposal",
        status=ProposalStatus.SHORTLISTED,
    )
    db_session.add(proposal)
    db_session.flush()

    pilot = Pilot(
        id="pilot-test-01",
        proposal_id=proposal.id,
        challenge_id=challenge.id,
        startup_id=startup.id,
        name="RoadSense Pothole Detection Pilot",
        objective="Validate CV road inspection accuracy across 50 municipal survey vehicles.",
        scope="50 municipal vehicles, 500 km network.",
        success_criteria="Accuracy >= 90%, latency <= 30s.",
        government_owner_id=officer.id,
        start_date=now - timedelta(days=60),
        end_date=now,
        status=PilotStatus.READY_FOR_ASSESSMENT,
        overall_progress_percentage=100.0,
    )
    db_session.add(pilot)
    db_session.flush()

    # Milestones (All completed)
    m1 = PilotMilestone(
        id="pm-01",
        pilot_id=pilot.id,
        name="Deployment & Sensor Setup",
        planned_start=now - timedelta(days=60),
        planned_end=now - timedelta(days=30),
        status=MilestoneStatus.COMPLETED,
        completion_percentage=100.0,
    )
    m2 = PilotMilestone(
        id="pm-02",
        pilot_id=pilot.id,
        name="Field Trial & GIS Integration",
        planned_start=now - timedelta(days=30),
        planned_end=now,
        status=MilestoneStatus.COMPLETED,
        completion_percentage=100.0,
    )
    db_session.add_all([m1, m2])

    # KPIs (Met targets)
    k1 = PilotKPI(
        id="pkpi-01",
        pilot_id=pilot.id,
        name="Detection Accuracy",
        target_value=90.0,
        target_operator=TargetOperator.GREATER_EQUAL,
        unit="%",
        weight=0.6,
        status=KPIStatus.ACHIEVED,
        latest_actual_value=93.5,
    )
    k2 = PilotKPI(
        id="pkpi-02",
        pilot_id=pilot.id,
        name="Processing Latency",
        target_value=30.0,
        target_operator=TargetOperator.LESS_EQUAL,
        unit="seconds",
        weight=0.4,
        status=KPIStatus.ACHIEVED,
        latest_actual_value=22.0,
    )
    db_session.add_all([k1, k2])

    # Evidence
    ev = PilotEvidence(
        id="ev-01",
        pilot_id=pilot.id,
        file_name="Audit_Report.pdf",
        storage_key="pilots/pilot-test-01/audit.pdf",
        file_type="application/pdf",
        file_size=1024000,
        uploaded_by_id=startup_user.id,
        uploaded_by_name="Priya Sharma",
    )
    db_session.add(ev)
    db_session.commit()

    return {
        "dept": dept,
        "officer": officer,
        "startup_user": startup_user,
        "startup": startup,
        "challenge": challenge,
        "proposal": proposal,
        "pilot": pilot,
        "k1": k1,
        "k2": k2,
    }


def test_ai_assessment_deterministic(db_session, seeded_entities):
    """Test AI assessment evaluates pilot telemetry and recommends SCALE for high achievements."""
    pilot = seeded_entities["pilot"]
    assessor = DeterministicPilotAssessor()
    res = assessor.assess_pilot(pilot)

    assert res["overall_score"] >= 80.0
    assert res["kpi_performance"] >= 90.0
    assert res["milestone_performance"] == 100.0
    assert res["risk_level"] == "LOW"
    assert res["confidence"] >= 80.0
    assert res["recommendation"] == "SCALE"
    assert len(res["reasons"]) > 0
    assert len(res["strengths"]) > 0


def test_ai_assessment_changes_when_data_changes(db_session, seeded_entities):
    """Test AI assessment changes recommendation to EXTEND or REJECT when KPIs fail or risks exist."""
    pilot = seeded_entities["pilot"]
    k1 = seeded_entities["k1"]
    k2 = seeded_entities["k2"]

    # Degrade KPIs significantly
    k1.latest_actual_value = 52.0  # Target was 90%
    k1.status = KPIStatus.BELOW_TARGET
    k2.latest_actual_value = 65.0  # Target was <= 30s
    k2.status = KPIStatus.BELOW_TARGET

    # Add open critical risk
    risk = PilotRisk(
        pilot_id=pilot.id,
        title="Edge Sensor Thermal Overheating",
        description="Sensors overheat after 3 hours in tropical heat.",
        category=RiskCategory.TECHNICAL,
        severity=RiskSeverity.CRITICAL,
        status=RiskStatus.OPEN,
    )
    db_session.add(risk)
    db_session.commit()

    assessor = DeterministicPilotAssessor()
    res = assessor.assess_pilot(pilot)

    # Now score should plummet and recommendation should NOT be SCALE
    assert res["overall_score"] < 60.0
    assert res["recommendation"] in ["EXTEND", "REJECT"]
    assert res["risk_level"] == "HIGH"
    assert any("Sensor Thermal Overheating" in c for c in res["concerns"])


def test_submit_scale_decision_workflow(db_session, seeded_entities):
    """Test valid SCALE decision creates scale-up entity and transitions pilot status."""
    pilot = seeded_entities["pilot"]
    officer = seeded_entities["officer"]

    input_data = ProcurementDecisionCreate(
        decision=DecisionType.SCALE,
        justification="Solution met all key accuracy thresholds and demonstrated operational stability in municipal testing.",
    )

    decision = ProcurementService.create_procurement_decision(db_session, pilot.id, input_data, officer)

    assert decision.id is not None
    assert decision.decision == DecisionType.SCALE
    assert decision.ai_recommendation == DecisionType.SCALE
    assert decision.decided_by == officer.id

    # Verify pilot status updated
    db_session.refresh(pilot)
    assert pilot.status == PilotStatus.SCALED

    # Verify ProcurementScaleUp record created
    scale_up = db_session.query(ProcurementScaleUp).filter(ProcurementScaleUp.pilot_id == pilot.id).first()
    assert scale_up is not None
    assert scale_up.status == ScaleUpStatus.READY_FOR_PROCUREMENT
    assert scale_up.decision_id == decision.id
    assert scale_up.solution_name == pilot.name
    assert len(scale_up.approved_kpis) == 2


def test_submit_extend_decision_workflow(db_session, seeded_entities):
    """Test valid EXTEND decision updates pilot end date and status."""
    pilot = seeded_entities["pilot"]
    officer = seeded_entities["officer"]
    orig_end_date = pilot.end_date

    input_data = ProcurementDecisionCreate(
        decision=DecisionType.EXTEND,
        justification="Pilot needs 45 additional days of heavy monsoon testing before final procurement scale.",
        extension_duration=45,
        extension_reason="Monsoon durability validation.",
    )

    decision = ProcurementService.create_procurement_decision(db_session, pilot.id, input_data, officer)

    assert decision.decision == DecisionType.EXTEND
    assert decision.extension_duration == 45

    db_session.refresh(pilot)
    assert pilot.status == PilotStatus.EXTENDED
    assert pilot.end_date == orig_end_date + timedelta(days=45)
    assert "Monsoon durability validation" in pilot.government_team_notes


def test_submit_reject_decision_workflow(db_session, seeded_entities):
    """Test valid REJECT decision marks pilot solution as closed."""
    pilot = seeded_entities["pilot"]
    officer = seeded_entities["officer"]

    input_data = ProcurementDecisionCreate(
        decision=DecisionType.REJECT,
        justification="Solution did not demonstrate sufficient false positive mitigation during field evaluation.",
        rejection_reason="Excessive false positives during municipal trials.",
    )

    decision = ProcurementService.create_procurement_decision(db_session, pilot.id, input_data, officer)

    assert decision.decision == DecisionType.REJECT
    assert decision.rejection_reason == "Excessive false positives during municipal trials."

    db_session.refresh(pilot)
    assert pilot.status == PilotStatus.CLOSED
    assert "CLOSED/REJECTED" in pilot.government_team_notes


def test_rejection_without_reason_fails():
    """Test Pydantic validator rejects REJECT decision if rejection_reason is omitted."""
    with pytest.raises(ValueError) as exc:
        ProcurementDecisionCreate(
            decision=DecisionType.REJECT,
            justification="Did not meet requirements.",
            rejection_reason=None,
        )
    assert "rejection reason is required" in str(exc.value)


def test_extension_without_duration_fails():
    """Test Pydantic validator rejects EXTEND decision if duration is omitted."""
    with pytest.raises(ValueError) as exc:
        ProcurementDecisionCreate(
            decision=DecisionType.EXTEND,
            justification="Requires extra testing.",
            extension_duration=None,
        )
    assert "Extension duration in days is required" in str(exc.value)


def test_unauthorized_startup_decision_forbidden(db_session, seeded_entities):
    """Test startup users cannot submit procurement decisions."""
    pilot = seeded_entities["pilot"]
    startup_user = seeded_entities["startup_user"]

    input_data = ProcurementDecisionCreate(
        decision=DecisionType.SCALE,
        justification="Attempting unauthorized decision submission.",
    )

    with pytest.raises(HTTPException) as exc:
        ProcurementService.create_procurement_decision(db_session, pilot.id, input_data, startup_user)
    assert exc.value.status_code == 403


def test_decision_history_preserved(db_session, seeded_entities):
    """Test decision history retains multiple records without overwriting."""
    pilot = seeded_entities["pilot"]
    officer = seeded_entities["officer"]

    # First decision: EXTEND
    input_1 = ProcurementDecisionCreate(
        decision=DecisionType.EXTEND,
        justification="First evaluation round: extended for 30 days.",
        extension_duration=30,
        extension_reason="Need more samples.",
    )
    ProcurementService.create_procurement_decision(db_session, pilot.id, input_1, officer)

    # Second decision: SCALE
    input_2 = ProcurementDecisionCreate(
        decision=DecisionType.SCALE,
        justification="Second evaluation round: validated and approved for procurement.",
    )
    ProcurementService.create_procurement_decision(db_session, pilot.id, input_2, officer)

    history = ProcurementService.get_decision_history(db_session, pilot.id, officer)
    assert len(history) == 2
    assert history[0].decision == DecisionType.SCALE
    assert history[1].decision == DecisionType.EXTEND


def test_scale_up_status_transition(db_session, seeded_entities):
    """Test updating scale-up project status through procurement lifecycle."""
    pilot = seeded_entities["pilot"]
    officer = seeded_entities["officer"]

    # Scale the pilot
    input_scale = ProcurementDecisionCreate(
        decision=DecisionType.SCALE,
        justification="Approved for city-wide procurement roll-out.",
    )
    ProcurementService.create_procurement_decision(db_session, pilot.id, input_scale, officer)

    scale_up = db_session.query(ProcurementScaleUp).filter(ProcurementScaleUp.pilot_id == pilot.id).first()
    assert scale_up.status == ScaleUpStatus.READY_FOR_PROCUREMENT

    # Advance status to PROCUREMENT_IN_PROGRESS
    update_1 = ProcurementScaleUpUpdate(
        status=ScaleUpStatus.PROCUREMENT_IN_PROGRESS,
        budget_allocation=7500000.0,
        procurement_notes="Tender specifications published on GeM portal.",
    )
    updated = ProcurementService.update_scale_up_project(db_session, scale_up.id, update_1, officer)
    assert updated.status == ScaleUpStatus.PROCUREMENT_IN_PROGRESS
    assert updated.budget_allocation == 7500000.0

    # Advance status to SCALED
    update_2 = ProcurementScaleUpUpdate(
        status=ScaleUpStatus.SCALED,
        procurement_notes="Contract executed and solution deployed citywide.",
    )
    final_scaled = ProcurementService.update_scale_up_project(db_session, scale_up.id, update_2, officer)
    assert final_scaled.status == ScaleUpStatus.SCALED
