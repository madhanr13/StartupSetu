"""
Tests for Pilot Management, KPI calculation engine, and target auditability rules.
"""

from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.pilot import (
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotKPI,
    PilotMilestone,
    PilotRisk,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)
from app.services.kpi_service import KPICalculationService


def test_evaluate_kpi_status_deterministic():
    # >= 90.0
    assert KPICalculationService.evaluate_kpi_status(92.0, 90.0, TargetOperator.GREATER_EQUAL) == KPIStatus.ACHIEVED
    assert KPICalculationService.evaluate_kpi_status(88.0, 90.0, TargetOperator.GREATER_EQUAL) == KPIStatus.BELOW_TARGET

    # <= 5.0
    assert KPICalculationService.evaluate_kpi_status(4.2, 5.0, TargetOperator.LESS_EQUAL) == KPIStatus.ACHIEVED
    assert KPICalculationService.evaluate_kpi_status(6.1, 5.0, TargetOperator.LESS_EQUAL) == KPIStatus.BELOW_TARGET

    # = 100.0
    assert KPICalculationService.evaluate_kpi_status(100.0, 100.0, TargetOperator.EQUAL) == KPIStatus.ACHIEVED
    assert KPICalculationService.evaluate_kpi_status(99.0, 100.0, TargetOperator.EQUAL) == KPIStatus.BELOW_TARGET


def test_calculate_pilot_health_rules():
    pilot = Pilot(
        id="test-p1",
        name="Test Pilot Health",
        kpis=[
            PilotKPI(id="k1", status=KPIStatus.ACHIEVED),
            PilotKPI(id="k2", status=KPIStatus.ACHIEVED),
        ],
        milestones=[
            PilotMilestone(id="m1", status=MilestoneStatus.COMPLETED),
        ],
        risks=[],
        issues=[],
    )
    health = KPICalculationService.calculate_pilot_health(pilot)
    assert health["health_label"] == "ON_TRACK"
    assert health["kpis_achieved"] == 2

    # Add open critical risk -> AT_RISK
    pilot.risks = [PilotRisk(id="r1", severity=RiskSeverity.CRITICAL, status=RiskStatus.OPEN)]
    health2 = KPICalculationService.calculate_pilot_health(pilot)
    assert health2["health_label"] == "AT_RISK"
    assert "Critical risk" in health2["rules_applied"][0]


def test_create_pilot_service_workflow():
    # Use isolated in-memory DB for pure unit testing
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    from app.schemas.pilot import PilotCreateInput, PilotKPICreate, PilotMilestoneCreate
    from app.services.pilot_service import PilotService
    from app.models.user import User, UserRole
    from app.models.proposal import Proposal, ProposalStatus
    from app.models.challenge import Challenge
    from app.models.startup import Startup
    from app.models.department import Department

    db = TestingSessionLocal()
    try:
        # Create department, user, challenge, startup
        dept = Department(id="dept-1", name="Department of Transport", code="MoT")
        db.add(dept)

        user = User(
            id="user-1",
            email="gov@test.com",
            name="Officer Rajesh",
            hashed_password="pw",
            role=UserRole.GOVERNMENT_OFFICER,
            department_id="dept-1",
        )
        db.add(user)

        ch = Challenge(
            id="ch-1",
            title="Road Damage Detection",
            description="Detect road defects automatically",
            problem_statement="Road potholes issue",
            domain="Infrastructure",
            department_id="dept-1",
            created_by="user-1",
        )
        db.add(ch)

        st = Startup(
            id="st-1",
            company_name="RoadSense AI",
            slug="roadsense-ai",
            short_description="Road inspection AI",
            dpiit_recognized=True,
            dpiit_number="DPIIT-12345",
        )
        db.add(st)

        prop = Proposal(
            id="prop-1",
            challenge_id="ch-1",
            startup_id="st-1",
            title="AI Road Detection Proposal",
            executive_summary="Deep learning pothole detection",
            status=ProposalStatus.SHORTLISTED,
        )
        db.add(prop)
        db.commit()

        input_data = PilotCreateInput(
            proposal_id="prop-1",
            name="Test Automated Pilot Launch",
            objective="Field testing road damage detection across municipal vehicles.",
            scope="Ward 4 and Ward 7 road network.",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=90),
            initial_milestones=[
                PilotMilestoneCreate(
                    name="Phase 1 Setup",
                    description="Camera installation",
                    planned_start=datetime.now(timezone.utc),
                    planned_end=datetime.now(timezone.utc) + timedelta(days=30),
                )
            ],
            initial_kpis=[
                PilotKPICreate(
                    name="Detection Precision",
                    target_value=90.0,
                    target_operator=TargetOperator.GREATER_EQUAL,
                    unit="%",
                )
            ],
        )

        pilot = PilotService.create_pilot_from_proposal(db, input_data, user)
        assert pilot is not None
        assert pilot.name == "Test Automated Pilot Launch"
        assert len(pilot.milestones) == 1
        health = KPICalculationService.calculate_pilot_health(pilot)
        assert health["health_label"] == "ON_TRACK"

    finally:
        db.close()
