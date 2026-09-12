"""
End-to-End System Hardening, RBAC & Complete Workflow Integration Tests (SIH26136).

Verifies the complete end-to-end operational lifecycle across all roles and models:
1. Government Challenge Creation & Validation
2. Challenge Publishing (Only Creator/Admin, requires complete criteria)
3. AI Startup Discovery & Capability Matching
4. Proposal Submission by Startup
5. IDOR & RBAC Security Verification (Startup A cannot access Startup B's proposal)
6. Evaluator Assignment & Restricted Evaluator Access
7. Human Evaluation & Criteria Scoring (Updates status to EVALUATED)
8. Government Officer Shortlisting with Rationale
9. Pilot Creation Constraints (Only SHORTLISTED proposals allowed)
10. Pilot Telemetry, Milestone Tracking & KPI Measurements
11. Pilot Completion & Ready for Assessment State Machine
12. AI Assessment Telemetry Analysis & Confidence Generation
13. Final Procurement Decisions (SCALE, EXTEND, REJECT) & Input Validation
14. Procurement Scale-Up Entity Creation (Public Procurement transition)
15. Audit Trail Verification across all lifecycle actions
"""

import os
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models import (
    AnalysisStatus,
    AuditAction,
    AuditEvent,
    Challenge,
    ChallengeEvaluationCriterion,
    ChallengeKPI,
    ChallengeRequirement,
    ChallengeStatus,
    Department,
    EvaluationStatus,
    IssueStatus,
    KPIMeasurement,
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotEvidence,
    PilotIssue,
    PilotKPI,
    PilotMilestone,
    PilotRisk,
    PilotStatus,
    Proposal,
    ProposalAnalysis,
    ProposalDocument,
    ProposalEvaluation,
    ProposalStatus,
    Startup,
    StartupCertification,
    StartupDomain,
    StartupProject,
    StartupReadinessScore,
    StartupTechnology,
    TargetOperator,
    User,
    UserRole,
)
from app.models.procurement import (
    DecisionType,
    ProcurementDecision,
    ProcurementScaleUp,
    ScaleUpStatus,
)

TEST_DB_URL = "sqlite:///./test_e2e_integration.db"
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
    db.query(ProcurementScaleUp).delete()
    db.query(ProcurementDecision).delete()
    db.query(AuditEvent).delete()
    db.query(KPIMeasurement).delete()
    db.query(PilotMilestone).delete()
    db.query(PilotKPI).delete()
    db.query(PilotRisk).delete()
    db.query(PilotIssue).delete()
    db.query(PilotEvidence).delete()
    db.query(Pilot).delete()
    db.query(ProposalEvaluation).delete()
    db.query(ProposalAnalysis).delete()
    db.query(ProposalDocument).delete()
    db.query(Proposal).delete()
    db.query(ChallengeEvaluationCriterion).delete()
    db.query(ChallengeKPI).delete()
    db.query(ChallengeRequirement).delete()
    db.query(Challenge).delete()
    db.query(StartupTechnology).delete()
    db.query(StartupDomain).delete()
    db.query(StartupProject).delete()
    db.query(StartupCertification).delete()
    db.query(StartupReadinessScore).delete()
    db.query(Startup).delete()
    db.query(User).delete()
    db.query(Department).delete()
    db.commit()

    # Seed Department
    dept = Department(id="dept-test", name="Ministry of Municipal Administration", code="MMA")
    db.add(dept)

    # Seed Users
    gov_officer = User(
        id="usr-officer-1",
        email="officer@mma.gov.in",
        name="Officer Rajesh Kumar",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        department_id=dept.id,
    )
    other_officer = User(
        id="usr-officer-2",
        email="other@mma.gov.in",
        name="Officer Sunita Sen",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        department_id=dept.id,
    )
    evaluator_1 = User(
        id="usr-eval-1",
        email="evaluator1@ai.edu.in",
        name="Dr. Vikram Sarabhai",
        hashed_password="hash",
        role=UserRole.EVALUATOR,
    )
    evaluator_unassigned = User(
        id="usr-eval-unassigned",
        email="unassigned@ai.edu.in",
        name="Prof. Anita Roy",
        hashed_password="hash",
        role=UserRole.EVALUATOR,
    )
    startup_user_a = User(
        id="usr-startup-a",
        email="founder@droneai.in",
        name="Rohan Verma",
        hashed_password="hash",
        role=UserRole.STARTUP,
    )
    startup_user_b = User(
        id="usr-startup-b",
        email="founder@competitor.in",
        name="Kavita Iyer",
        hashed_password="hash",
        role=UserRole.STARTUP,
    )
    db.add_all([gov_officer, other_officer, evaluator_1, evaluator_unassigned, startup_user_a, startup_user_b])

    # Seed Startups
    startup_a = Startup(
        id="st-startup-a",
        user_id=startup_user_a.id,
        company_name="DroneVision Robotics",
        slug="dronevision-robotics",
        short_description="Edge AI and drone aerial vision systems for infrastructure auditing.",
        dpiit_recognized=True,
        dpiit_number="DPIIT-99101",
    )
    startup_b = Startup(
        id="st-startup-b",
        user_id=startup_user_b.id,
        company_name="Competitor Systems",
        slug="competitor-systems",
        short_description="General IT software consultancy.",
        dpiit_recognized=False,
    )
    db.add_all([startup_a, startup_b])
    db.commit()
    db.close()

    yield
    app.dependency_overrides.pop(get_db, None)

    # Teardown
    if os.path.exists("./test_e2e_integration.db"):
        try:
            os.remove("./test_e2e_integration.db")
        except PermissionError:
            pass


def test_complete_platform_end_to_end_lifecycle(tmp_path):
    """
    Executes the entire SIH26136 innovation procurement lifecycle from challenge creation
    to AI matching, proposal submission, evaluation, shortlisting, pilot tracking,
    AI assessment, and SCALE procurement decision.
    """
    headers_officer = auth_header("usr-officer-1", UserRole.GOVERNMENT_OFFICER)
    headers_startup_a = auth_header("usr-startup-a", UserRole.STARTUP)
    headers_startup_b = auth_header("usr-startup-b", UserRole.STARTUP)
    headers_eval_1 = auth_header("usr-eval-1", UserRole.EVALUATOR)
    headers_eval_unassigned = auth_header("usr-eval-unassigned", UserRole.EVALUATOR)

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 1: Government Challenge Creation (Draft)
    # ──────────────────────────────────────────────────────────────────────────
    challenge_payload = {
        "title": "Autonomous AI Thermal Drone Monitoring for Urban Heat Islands",
        "description": "Deploy thermal drone scanners to detect urban heat micro-climates and building energy leaks across municipal wards.",
        "problem_statement": "Municipalities lack granular thermal mapping to plan green cover and mitigate localized extreme heat hotspots.",
        "domain": "Environmental Monitoring",
        "budget_min": 2000000.0,
        "budget_max": 4500000.0,
        "pilot_duration_weeks": 12,
        "department_id": "dept-test",
        "requirements": [
            {"description": "Thermal camera payload with resolution >= 640x512", "is_mandatory": True, "order": 0},
            {"description": "Real-time edge GIS heat-map orthomosaic generation", "is_mandatory": True, "order": 1},
        ],
        "kpis": [
            {"name": "Thermal Accuracy", "description": "Correlation with calibrated ground surface probes", "target_value": 92.0, "unit": "%", "weight": 0.5},
            {"name": "Flight Survey Coverage", "description": "Hectares surveyed per flight mission", "target_value": 50.0, "unit": "hectares", "weight": 0.5},
        ],
        "evaluation_criteria": [
            {"name": "Thermal Optics Resolution", "description": "Camera precision and thermal sensitivity", "weight": 50.0, "max_score": 10.0},
            {"name": "Edge Analytics Pipeline", "description": "Processing speed and cloud sync", "weight": 50.0, "max_score": 10.0},
        ],
    }

    create_ch_resp = client.post("/api/challenges", json=challenge_payload, headers=headers_officer)
    assert create_ch_resp.status_code == 201, create_ch_resp.text
    ch_data = create_ch_resp.json()
    ch_id = ch_data["id"]
    assert ch_data["status"] == "DRAFT"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 2: Challenge Publishing with Authorization Guard
    # ──────────────────────────────────────────────────────────────────────────
    # Unauthorized publish attempt by Startup should fail
    fail_pub = client.post(f"/api/challenges/{ch_id}/publish", headers=headers_startup_a)
    assert fail_pub.status_code in [401, 403], fail_pub.text

    # Authorized publish by officer
    pub_resp = client.post(f"/api/challenges/{ch_id}/publish", headers=headers_officer)
    assert pub_resp.status_code == 200, pub_resp.text
    assert pub_resp.json()["status"] == "PUBLISHED"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 3: Startup Discovery & Capability Matching
    # ──────────────────────────────────────────────────────────────────────────
    match_resp = client.get(f"/api/challenges/{ch_id}/startup-recommendations", headers=headers_officer)
    assert match_resp.status_code == 200, match_resp.text
    recommendations = match_resp.json()
    assert len(recommendations) >= 1
    # Startup A has drone optics and should be ranked higher
    assert any(r["startup"]["id"] == "st-startup-a" for r in recommendations)

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 4: Proposal Submission by Startup A
    # ──────────────────────────────────────────────────────────────────────────
    proposal_payload = {
        "title": "ThermalEye: Autonomous Edge-AI Urban Heat Scanner",
        "executive_summary": "High-resolution thermal UAV mapping system with real-time temperature anomaly detection and automated municipal GIS report generation.",
        "estimated_cost": 3200000.0,
        "implementation_duration_days": 80,
        "contact_name": "Rohan Verma",
        "contact_email": "founder@droneai.in",
    }

    create_prop_resp = client.post(f"/api/proposals?challenge_id={ch_id}", json=proposal_payload, headers=headers_startup_a)
    assert create_prop_resp.status_code == 201, create_prop_resp.text
    prop_data = create_prop_resp.json()
    prop_id = prop_data["id"]
    assert prop_data["status"] == "DRAFT"

    # Upload PDF Document
    dummy_pdf = tmp_path / "thermal_proposal.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4\n%Thermal drone technical architecture\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")

    with open(dummy_pdf, "rb") as f:
        up_resp = client.post(
            f"/api/proposals/{prop_id}/document",
            files={"file": ("thermal_proposal.pdf", f, "application/pdf")},
            headers=headers_startup_a,
        )
    assert up_resp.status_code == 200, up_resp.text
    assert up_resp.json()["document"]["file_name"] == "thermal_proposal.pdf"

    # Submit Proposal
    sub_resp = client.post(f"/api/proposals/{prop_id}/submit", headers=headers_startup_a)
    assert sub_resp.status_code == 200, sub_resp.text
    assert sub_resp.json()["status"] in ["SUBMITTED", "AI_ANALYSIS_READY"]

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 5: IDOR & Security Access Checks
    # ──────────────────────────────────────────────────────────────────────────
    # Startup B attempting to view Startup A's proposal MUST be rejected with 403
    idor_resp = client.get(f"/api/proposals/{prop_id}", headers=headers_startup_b)
    assert idor_resp.status_code == 403, "IDOR check failed: Startup B accessed Startup A's proposal"

    # Unassigned evaluator attempting to view proposal MUST be rejected with 403
    unauth_eval_resp = client.get(f"/api/proposals/{prop_id}", headers=headers_eval_unassigned)
    assert unauth_eval_resp.status_code == 403, "Evaluator without assignment viewed proposal"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 6: Evaluator Assignment by Officer
    # ──────────────────────────────────────────────────────────────────────────
    assign_resp = client.post(
        f"/api/proposals/{prop_id}/assign-evaluators",
        json={"evaluator_ids": ["usr-eval-1"]},
        headers=headers_officer,
    )
    assert assign_resp.status_code == 200, assign_resp.text
    assert assign_resp.json()["status"] == "UNDER_REVIEW"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 7: Evaluation Scoring by Assigned Evaluator
    # ──────────────────────────────────────────────────────────────────────────
    # Unassigned evaluator submitting evaluation should fail
    unauth_sub = client.post(
        f"/api/proposals/{prop_id}/evaluate",
        json={"criterion_scores": [], "general_comments": "Hack attempt"},
        headers=headers_eval_unassigned,
    )
    assert unauth_sub.status_code == 403, "Unassigned evaluator submitted evaluation"

    # Assigned evaluator scores criteria
    criteria_ids = [c["id"] for c in create_ch_resp.json()["evaluation_criteria"]]
    eval_payload = {
        "criterion_scores": [
            {"criterion_id": criteria_ids[0], "score": 9.0, "comment": "Excellent FLIR thermal sensor payload"},
            {"criterion_id": criteria_ids[1], "score": 9.5, "comment": "Fast edge tensor processing"},
        ],
        "general_comments": "Superior thermal accuracy and proven field deployment readiness.",
    }
    eval_resp = client.post(f"/api/proposals/{prop_id}/evaluate", json=eval_payload, headers=headers_eval_1)
    assert eval_resp.status_code == 200, eval_resp.text
    # Weighted score: (9/10 * 50) + (9.5/10 * 50) = 45 + 47.5 = 92.5
    assert eval_resp.json()["total_weighted_score"] == 92.5

    # Check proposal status updated to EVALUATED
    detail_resp = client.get(f"/api/proposals/{prop_id}", headers=headers_officer)
    assert detail_resp.json()["status"] == "EVALUATED"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 8: Pilot Creation Guard (Must Reject Non-Shortlisted Proposals)
    # ──────────────────────────────────────────────────────────────────────────
    pilot_payload = {
        "proposal_id": prop_id,
        "name": "Urban Thermal Mapping Field Trial",
        "objective": "Field test drone thermal sensor calibration across 3 municipal zones.",
        "scope": "Ward 12 and Ward 15 covering 200 hectares.",
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
        "initial_milestones": [
            {
                "name": "Phase 1 Drone Flight Calibration",
                "description": "Baseline thermal sensor calibration against ground probes",
                "planned_start": datetime.now(timezone.utc).isoformat(),
                "planned_end": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            }
        ],
        "initial_kpis": [
            {
                "name": "Thermal Anomaly Precision",
                "description": "Correct identification of surface heat leaks",
                "target_value": 90.0,
                "target_operator": ">=",
                "unit": "%",
                "frequency": "Weekly",
                "weight": 1.0,
            }
        ],
    }

    # Attempting to create pilot while proposal is only EVALUATED (not shortlisted) MUST fail
    premature_pilot_resp = client.post("/api/pilots", json=pilot_payload, headers=headers_officer)
    assert premature_pilot_resp.status_code == 400, "Pilot creation succeeded for non-shortlisted proposal"
    assert "SHORTLISTED" in premature_pilot_resp.text

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 9: Officer Shortlists Proposal with Mandatory Rationale
    # ──────────────────────────────────────────────────────────────────────────
    shortlist_payload = {
        "decision": "SHORTLISTED",
        "reason": "Top technical evaluation score of 92.5% and superior thermal camera payload.",
    }
    short_resp = client.post(f"/api/proposals/{prop_id}/shortlist", json=shortlist_payload, headers=headers_officer)
    assert short_resp.status_code == 200, short_resp.text
    assert short_resp.json()["status"] == "SHORTLISTED"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 10: Authorized Pilot Creation from Shortlisted Proposal
    # ──────────────────────────────────────────────────────────────────────────
    create_pilot_resp = client.post("/api/pilots", json=pilot_payload, headers=headers_officer)
    assert create_pilot_resp.status_code == 201, create_pilot_resp.text
    pilot_data = create_pilot_resp.json()
    pilot_id = pilot_data["id"]
    assert pilot_data["proposal_id"] == prop_id
    assert pilot_data["challenge_id"] == ch_id
    assert pilot_data["startup_id"] == "st-startup-a"

    # IDOR check: Startup B cannot view Startup A's pilot
    pilot_idor_resp = client.get(f"/api/pilots/{pilot_id}", headers=headers_startup_b)
    assert pilot_idor_resp.status_code == 403, "Startup B accessed Startup A's private pilot"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 11: Pilot Execution, KPI Measurements & Completion
    # ──────────────────────────────────────────────────────────────────────────
    # Transition to ACTIVE
    activate_resp = client.patch(f"/api/pilots/{pilot_id}", json={"status": "ACTIVE"}, headers=headers_officer)
    assert activate_resp.status_code == 200, activate_resp.text
    assert activate_resp.json()["status"] == "ACTIVE"

    # Mark Milestone Complete
    milestone_id = pilot_data["milestones"][0]["id"]
    m_update_resp = client.patch(
        f"/api/pilots/{pilot_id}/milestones/{milestone_id}",
        json={"status": "COMPLETED", "completion_percentage": 100.0},
        headers=headers_officer,
    )
    assert m_update_resp.status_code == 200, m_update_resp.text
    assert m_update_resp.json()["status"] == "COMPLETED"

    # Record KPI Measurement
    kpi_id = pilot_data["kpis"][0]["id"]
    meas_payload = {
        "actual_value": 94.5,
        "measurement_date": datetime.now(timezone.utc).isoformat(),
        "notes": "Surface temperature audit confirmed 94.5% correlation.",
    }
    meas_resp = client.post(f"/api/pilots/{pilot_id}/kpis/{kpi_id}/measurements", json=meas_payload, headers=headers_officer)
    assert meas_resp.status_code == 200, meas_resp.text
    assert meas_resp.json()["actual_value"] == 94.5

    # Complete Pilot (Transitions to READY_FOR_ASSESSMENT)
    comp_resp = client.post(f"/api/pilots/{pilot_id}/complete", headers=headers_officer)
    assert comp_resp.status_code == 200, comp_resp.text
    assert comp_resp.json()["status"] == "READY_FOR_ASSESSMENT"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 12: AI Pilot Assessment Generation
    # ──────────────────────────────────────────────────────────────────────────
    assess_resp = client.post(f"/api/pilots/{pilot_id}/assessment", headers=headers_officer)
    assert assess_resp.status_code == 200, assess_resp.text
    assessment = assess_resp.json()
    assert assessment["overall_score"] >= 80.0
    assert assessment["recommendation"] == "SCALE"
    assert assessment["confidence"] > 70.0

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 13: Procurement Decisions & Boundary Validations
    # ──────────────────────────────────────────────────────────────────────────
    # Test EXTEND with 0 or negative days -> Must be rejected
    bad_extend = client.post(
        f"/api/pilots/{pilot_id}/decision",
        json={"decision": "EXTEND", "justification": "Needs more time", "extension_duration": 0},
        headers=headers_officer,
    )
    assert bad_extend.status_code == 422, "EXTEND with 0 duration was accepted"

    # Test REJECT with empty reason -> Must be rejected
    bad_reject = client.post(
        f"/api/pilots/{pilot_id}/decision",
        json={"decision": "REJECT", "justification": "Rejected", "rejection_reason": ""},
        headers=headers_officer,
    )
    assert bad_reject.status_code == 422, "REJECT without reason was accepted"

    # Submit Valid SCALE Decision
    scale_payload = {
        "decision": "SCALE",
        "justification": "Outstanding thermal accuracy of 94.5% achieved. Ready for state-wide deployment.",
    }
    scale_resp = client.post(f"/api/pilots/{pilot_id}/decision", json=scale_payload, headers=headers_officer)
    assert scale_resp.status_code == 201, scale_resp.text
    decision_data = scale_resp.json()
    assert decision_data["decision"] == "SCALE"

    # Verify Scale-Up record created and available in /api/procurement/scale-up
    scale_ups_resp = client.get("/api/procurement/scale-up", headers=headers_officer)
    assert scale_ups_resp.status_code == 200
    scale_ups = scale_ups_resp.json()
    our_scale_up = next((s for s in scale_ups if s["pilot_id"] == pilot_id), None)
    assert our_scale_up is not None
    assert our_scale_up["status"] == "READY_FOR_PROCUREMENT"

    # Verify Pilot Status updated to SCALED
    final_pilot = client.get(f"/api/pilots/{pilot_id}", headers=headers_officer).json()
    assert final_pilot["status"] == "SCALED"

    # ──────────────────────────────────────────────────────────────────────────
    # STEP 14: Analytics & Audit Log Verification
    # ──────────────────────────────────────────────────────────────────────────
    # Analytics Overview reflects newly scaled pilot
    overview_resp = client.get("/api/analytics/overview", headers=headers_officer)
    assert overview_resp.status_code == 200, overview_resp.text
    analytics = overview_resp.json()
    assert analytics["total_challenges"] >= 1
    assert analytics["published_challenges"] >= 1
    assert analytics["solutions_ready_for_procurement"] >= 1
    assert analytics["avg_evaluation_score"] > 0.0
    assert analytics["avg_kpi_achievement"] > 0.0

    # Audit Trail contains complete lifecycle events
    audit_resp = client.get(f"/api/proposals/{prop_id}/audit-trail", headers=headers_officer)
    assert audit_resp.status_code == 200, audit_resp.text
    audit_actions = [e["action"] for e in audit_resp.json()]
    assert "PROPOSAL_SUBMITTED" in audit_actions
    assert "EVALUATOR_ASSIGNED" in audit_actions
    assert "EVALUATION_SUBMITTED" in audit_actions
    assert "PROPOSAL_SHORTLISTED" in audit_actions
