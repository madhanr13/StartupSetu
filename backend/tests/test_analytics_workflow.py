"""
Unit & Workflow Tests for AI Decision Intelligence & Analytics Module.
Verifies that all metrics, funnels, startup intelligence, and bottlenecks
are calculated strictly from live database records and update dynamically.
"""

from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.challenge import Challenge, ChallengeStatus
from app.models.department import Department
from app.models.pilot import (
    KPIMeasurement,
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotKPI,
    PilotMilestone,
    PilotRisk,
    PilotStatus,
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
from app.models.proposal import (
    EvaluationStatus,
    Proposal,
    ProposalEvaluation,
    ProposalStatus,
)
from app.models.startup import Startup, StartupReadinessScore
from app.models.user import User, UserRole
from app.services.analytics_service import AnalyticsService
from app.ai.analytics_insights import RuleBasedInsightService, AIInsightService


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
def test_data(db_session):
    """Seed base entities for analytics testing."""
    now = datetime.now(timezone.utc)

    dept = Department(id="dept-1", name="Ministry of Transport", code="MoT")
    db_session.add(dept)

    gov_user = User(
        id="user-gov",
        email="officer@gov.in",
        name="Transport Officer",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        department_id="dept-1",
    )
    eval_user = User(
        id="user-eval",
        email="eval@gov.in",
        name="Evaluator One",
        hashed_password="hash",
        role=UserRole.EVALUATOR,
    )
    startup_user = User(
        id="user-startup",
        email="ceo@roadtech.in",
        name="Startup CEO",
        hashed_password="hash",
        role=UserRole.STARTUP,
    )
    db_session.add_all([gov_user, eval_user, startup_user])

    # Challenge 1: Road Damage Detection
    ch1 = Challenge(
        id="ch-1",
        title="AI Pothole & Road Quality Survey",
        description="Automate road quality audit using machine vision",
        status=ChallengeStatus.PUBLISHED,
        created_by="user-gov",
        department_id="dept-1",
        created_at=now - timedelta(days=30),
    )
    # Challenge 2: Traffic Light Optimization
    ch2 = Challenge(
        id="ch-2",
        title="Dynamic Traffic Signal AI",
        description="Adaptive signaling based on live vehicle density",
        status=ChallengeStatus.PUBLISHED,
        created_by="user-gov",
        department_id="dept-1",
        created_at=now - timedelta(days=15),
    )
    db_session.add_all([ch1, ch2])

    # Startup 1
    s1 = Startup(
        id="st-1",
        company_name="RoadVision AI",
        slug="roadvision-ai",
        user_id="user-startup",
        dpiit_recognized=True,
    )
    db_session.add(s1)

    readiness = StartupReadinessScore(
        id="rs-1",
        startup_id="st-1",
        overall_score=88.0,
        team_strength=90.0,
        technical_capability=85.0,
        domain_experience=86.0,
        security_readiness=92.0,
        financial_readiness=87.0,
    )
    db_session.add(readiness)

    # Proposal for CH1
    p1 = Proposal(
        id="prop-1",
        challenge_id="ch-1",
        startup_id="st-1",
        title="Edge Optical Pothole Scanner",
        status=ProposalStatus.EVALUATED,
        submitted_at=now - timedelta(days=25),
    )
    db_session.add(p1)

    # Evaluation for P1
    ev1 = ProposalEvaluation(
        id="ev-1",
        proposal_id="prop-1",
        evaluator_id="user-eval",
        evaluator_name="Evaluator One",
        total_weighted_score=86.0,
        status=EvaluationStatus.COMPLETED,
        submitted_at=now - timedelta(days=20),
    )
    db_session.add(ev1)

    # Pilot for CH1 + S1
    pilot1 = Pilot(
        id="pilot-1",
        proposal_id="prop-1",
        challenge_id="ch-1",
        startup_id="st-1",
        name="Delhi PWD 100km AI Road Pilot",
        objective="Validate automated pavement scanning under variable weather conditions",
        scope="100km arterial road network in New Delhi",
        status=PilotStatus.COMPLETED,
        government_owner_id="user-gov",
        start_date=now - timedelta(days=20),
        end_date=now - timedelta(days=2),
    )
    db_session.add(pilot1)

    # Milestones
    m1 = PilotMilestone(
        id="ms-1",
        pilot_id="pilot-1",
        name="Hardware Vehicle Mounting",
        status=MilestoneStatus.COMPLETED,
        planned_start=now - timedelta(days=19),
        planned_end=now - timedelta(days=15),
    )
    m2 = PilotMilestone(
        id="ms-2",
        pilot_id="pilot-1",
        name="500km Sensor Road Scanning",
        status=MilestoneStatus.COMPLETED,
        planned_start=now - timedelta(days=14),
        planned_end=now - timedelta(days=5),
    )
    db_session.add_all([m1, m2])

    # KPIs
    kpi1 = PilotKPI(
        id="kpi-1",
        pilot_id="pilot-1",
        name="Defect Detection Accuracy",
        target_value=90.0,
        latest_actual_value=94.5,
        unit="%",
        target_operator=TargetOperator.GREATER_EQUAL,
        status=KPIStatus.ACHIEVED,
        weight=0.6,
    )
    kpi2 = PilotKPI(
        id="kpi-2",
        pilot_id="pilot-1",
        name="Processing Latency",
        target_value=30.0,
        latest_actual_value=25.0,
        unit="ms",
        target_operator=TargetOperator.LESS_EQUAL,
        status=KPIStatus.ACHIEVED,
        weight=0.4,
    )
    db_session.add_all([kpi1, kpi2])

    # Measurement log
    m_log = KPIMeasurement(
        id="meas-1",
        pilot_kpi_id="kpi-1",
        actual_value=94.5,
        measurement_date=now - timedelta(days=3),
        notes="Final benchmark calibration",
        recorded_by_id="user-gov",
    )
    db_session.add(m_log)

    # Risk
    r1 = PilotRisk(
        id="risk-1",
        pilot_id="pilot-1",
        title="Monsoon Lens Flare",
        severity=RiskSeverity.LOW,
        status=RiskStatus.MITIGATED,
    )
    db_session.add(r1)

    # Procurement Decision
    dec1 = ProcurementDecision(
        id="dec-1",
        pilot_id="pilot-1",
        challenge_id="ch-1",
        startup_id="st-1",
        decision=DecisionType.SCALE,
        ai_recommendation=DecisionType.SCALE,
        ai_score=92.0,
        ai_confidence=0.95,
        justification="Exceeded accuracy targets with low latency.",
        decided_by="user-gov",
        decided_at=now - timedelta(days=1),
    )
    db_session.add(dec1)

    # Scale-Up record
    sc1 = ProcurementScaleUp(
        id="scale-1",
        pilot_id="pilot-1",
        decision_id="dec-1",
        challenge_id="ch-1",
        startup_id="st-1",
        department_id="dept-1",
        solution_name="RoadVision AI Full Deployment",
        pilot_outcome_summary="Pilot succeeded across 500km road network.",
        proposed_scale_scope="National highway rollout",
        status=ScaleUpStatus.READY_FOR_PROCUREMENT,
    )
    db_session.add(sc1)

    db_session.commit()
    return {"gov_user": gov_user, "s1": s1, "ch1": ch1, "ch2": ch2, "pilot1": pilot1, "kpi1": kpi1}


def test_overview_metrics_calculation(db_session, test_data):
    """Verifies macro metrics are calculated from real stored rows."""
    user = test_data["gov_user"]
    metrics = AnalyticsService.get_overview_metrics(db_session, user)

    assert metrics.total_challenges == 2
    assert metrics.published_challenges == 2
    assert metrics.completed_pilots == 1
    assert metrics.solutions_ready_for_procurement == 1
    assert metrics.scaled_solutions == 0
    assert metrics.extended_pilots == 0
    assert metrics.rejected_solutions == 0
    assert metrics.avg_evaluation_score == 86.0  # From ProposalEvaluation ev-1
    assert metrics.avg_kpi_achievement > 90.0
    assert metrics.avg_time_to_decision_days > 0.0


def test_data_change_alters_analytics(db_session, test_data):
    """
    CRITICAL ACCEPTANCE TEST:
    Modifying proposal evaluation score or KPI values MUST immediately and
    automatically change the calculated analytics.
    """
    user = test_data["gov_user"]
    initial_metrics = AnalyticsService.get_overview_metrics(db_session, user)
    assert initial_metrics.avg_evaluation_score == 86.0

    # Add second evaluation with a score of 94.0
    ev2 = ProposalEvaluation(
        id="ev-2",
        proposal_id="prop-1",
        evaluator_id="user-eval",
        evaluator_name="Evaluator Two",
        total_weighted_score=94.0,
        status=EvaluationStatus.COMPLETED,
    )
    db_session.add(ev2)
    db_session.commit()

    updated_metrics = AnalyticsService.get_overview_metrics(db_session, user)
    # Average of 86.0 and 94.0 is 90.0
    assert updated_metrics.avg_evaluation_score == 90.0

    # Alter KPI actual value and test KPI achievement update
    kpi = test_data["kpi1"]
    kpi.latest_actual_value = 45.0  # Significant drop from 94.5 (target was 90)
    db_session.commit()

    after_kpi_drop = AnalyticsService.get_overview_metrics(db_session, user)
    assert after_kpi_drop.avg_kpi_achievement < initial_metrics.avg_kpi_achievement


def test_pipeline_counts_and_conversion(db_session, test_data):
    """Validates 9-stage procurement funnel counts and step-to-step drop-off rates."""
    user = test_data["gov_user"]
    pipeline = AnalyticsService.get_procurement_pipeline(db_session, user)

    assert pipeline.total_stages == 9
    stage_map = {s.stage_id: s for s in pipeline.stages}

    assert stage_map["challenges"].count == 2
    assert stage_map["proposals"].count == 1
    assert stage_map["evaluated"].count == 1
    assert stage_map["pilots"].count == 1
    assert stage_map["completed"].count == 1
    assert stage_map["decisions"].count == 1
    assert stage_map["procurement"].count == 1
    assert stage_map["scaled"].count == 0


def test_startup_intelligence_profile(db_session, test_data):
    """
    Verifies startup performance radar scores:
    Match Quality, Proposal Quality, Pilot Performance, KPI Achievement, Overall Readiness
    are calculated dynamically from DB and not hardcoded.
    """
    user = test_data["gov_user"]
    intel = AnalyticsService.get_startup_intelligence(db_session, user, startup_id="st-1")

    assert intel.total == 1
    st_item = intel.startups[0]
    profile = st_item.performance_profile

    assert profile.match_quality > 0
    assert profile.proposal_quality == 86.0  # exactly matches evaluation score 86
    assert profile.pilot_performance == 100.0  # 2/2 milestones completed + 0 open risks
    assert profile.kpi_achievement > 90.0
    assert profile.overall_readiness > 80.0
    assert st_item.completed_pilots == 1
    assert "SCALE" in st_item.final_procurement_outcomes


def test_bottleneck_detection_rules(db_session, test_data):
    """
    Verifies deterministic detection of bottlenecks:
    Challenge 2 has status PUBLISHED but 0 proposals.
    """
    user = test_data["gov_user"]
    bottlenecks = AnalyticsService.get_bottlenecks(db_session, user)

    assert bottlenecks.total_bottlenecks >= 1
    ch2_bn = next((b for b in bottlenecks.bottlenecks if b.affected_entity_id == "ch-2"), None)
    assert ch2_bn is not None
    assert ch2_bn.category == "PROPOSAL"
    assert "Zero Proposals" in ch2_bn.title


def test_rule_based_fallback_insights(db_session, test_data):
    """
    Verifies structured insights are generated deterministically
    with evidence citations when AI is offline.
    """
    user = test_data["gov_user"]
    service = RuleBasedInsightService()
    insights = service.generate_insights(db_session, user)

    assert insights.source == "rule_based"
    assert len(insights.key_insights) >= 1 or len(insights.top_opportunities) >= 1
    # Evidence must be grounded
    all_evidence = [k.evidence for k in insights.key_insights] + [o.evidence for o in insights.top_opportunities]
    assert any("KPI" in e or "pilot" in e.lower() or "startup" in e.lower() for e in all_evidence)


def test_report_export(db_session, test_data):
    """Verifies that markdown summary reports are generated for pilots, challenges, and platform."""
    user = test_data["gov_user"]
    pilot_report = AnalyticsService.export_summary_report(
        db_session, user, entity_type="PILOT", entity_id="pilot-1", export_format="markdown"
    )
    assert "Government Innovation Procurement Intelligence Report" in pilot_report.report_content
    assert "Delhi PWD 100km AI Road Pilot" in pilot_report.report_content
    assert "SCALE" in pilot_report.report_content

    platform_report = AnalyticsService.export_summary_report(
        db_session, user, entity_type="PLATFORM", export_format="markdown"
    )
    assert "Platform-Wide Procurement Intelligence & Pipeline Report" in platform_report.report_content


def test_rbac_security_blocks_startup_user(test_data):
    """Verify that startup users are blocked from government analytics by RBAC."""
    from app.api.deps import require_roles
    from fastapi import HTTPException

    checker = require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)

    startup_user = User(
        id="u-st-test",
        email="st@test.in",
        name="Startup User",
        hashed_password="pw",
        role=UserRole.STARTUP,
    )
    with pytest.raises(HTTPException) as exc_info:
        checker(current_user=startup_user)
    assert exc_info.value.status_code == 403
    assert "not authorized" in exc_info.value.detail.lower()

    # Government officer is authorized
    authorized_user = checker(current_user=test_data["gov_user"])
    assert authorized_user.id == "user-gov"
