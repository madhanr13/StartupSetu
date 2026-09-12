"""
Unit & Integration Tests for Module 3: Proposal Management & AI Evaluation Workspace.
"""

import os
from pathlib import Path
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
    ChallengeStatus,
    Department,
    EvaluationStatus,
    Proposal,
    ProposalAnalysis,
    ProposalDocument,
    ProposalEvaluation,
    ProposalStatus,
    Startup,
    User,
    UserRole,
)

TEST_DB_URL = "sqlite:///./test_proposal.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Clear tables
    db.query(AuditEvent).delete()
    try:
        from app.models.procurement import ProcurementScaleUp, ProcurementDecision
        from app.models.pilot import Pilot, PilotMilestone, PilotKPI, KPIMeasurement, PilotRisk, PilotIssue, PilotEvidence
        db.query(ProcurementScaleUp).delete()
        db.query(ProcurementDecision).delete()
        db.query(KPIMeasurement).delete()
        db.query(PilotMilestone).delete()
        db.query(PilotKPI).delete()
        db.query(PilotRisk).delete()
        db.query(PilotIssue).delete()
        db.query(PilotEvidence).delete()
        db.query(Pilot).delete()
    except Exception:
        pass
    db.query(ProposalEvaluation).delete()
    db.query(ProposalAnalysis).delete()
    db.query(ProposalDocument).delete()
    db.query(Proposal).delete()
    db.query(ChallengeEvaluationCriterion).delete()
    db.query(Challenge).delete()
    db.query(Startup).delete()
    db.query(User).delete()
    db.query(Department).delete()
    db.commit()


    # Seed test users
    gov_user = User(
        id="usr-gov",
        email="officer@gov.test",
        name="Officer Test",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
    )
    eval_user = User(
        id="usr-eval",
        email="eval@test.com",
        name="Evaluator Test",
        hashed_password="hash",
        role=UserRole.EVALUATOR,
    )
    startup_user = User(
        id="usr-start",
        email="startup@test.com",
        name="Startup Founder",
        hashed_password="hash",
        role=UserRole.STARTUP,
    )
    db.add_all([gov_user, eval_user, startup_user])

    # Seed Startup
    startup = Startup(
        id="st-test",
        user_id="usr-start",
        company_name="Test Robotics Tech",
        slug="test-robotics",
        short_description="AI Robotics",
        dpiit_number="DPIIT12345",
    )
    db.add(startup)

    # Seed Challenge with Evaluation Criteria
    ch = Challenge(
        id="ch-test",
        title="Automated Inspection System",
        problem_statement="Detect infra defects automatically",
        status=ChallengeStatus.PUBLISHED,
        department_id="dept-1",
        created_by="usr-gov",
    )
    db.add(ch)
    db.flush()

    c1 = ChallengeEvaluationCriterion(
        id="crit-1",
        challenge_id=ch.id,
        name="Technical Solution Feasibility",
        weight=50.0,
        description="Feasibility score",
    )
    c2 = ChallengeEvaluationCriterion(
        id="crit-2",
        challenge_id=ch.id,
        name="Cost & Budget Efficiency",
        weight=50.0,
        description="Budget score",
    )
    db.add_all([c1, c2])
    db.commit()
    db.close()

    yield
    app.dependency_overrides.pop(get_db, None)

    # Teardown DB file
    if os.path.exists("./test_proposal.db"):
        try:
            os.remove("./test_proposal.db")
        except PermissionError:
            pass


def get_auth_header(user_id: str, role: UserRole):
    token = create_access_token(data={"sub": user_id, "role": role.value})
    return {"Authorization": f"Bearer {token}"}


def test_proposal_lifecycle_end_to_end(tmp_path):
    # 1. Create Proposal Draft by Startup
    headers_startup = get_auth_header("usr-start", UserRole.STARTUP)
    create_payload = {
        "title": "AI Autonomous Drone Defect Scanner",
        "executive_summary": "High precision drone camera scanning system with edge detection neural networks for automated infrastructure defect detection.",
        "estimated_cost": 2500000.0,
        "implementation_duration_days": 60,
        "contact_name": "Startup Founder",
        "contact_email": "startup@test.com",
    }
    resp = client.post("/api/proposals?challenge_id=ch-test", json=create_payload, headers=headers_startup)
    assert resp.status_code == 201, resp.text
    p_data = resp.json()
    p_id = p_data["id"]
    assert p_data["status"] == "DRAFT"

    # 2. Upload Proposal PDF Document
    dummy_pdf = tmp_path / "test_proposal.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4\n%Test Proposal Document Content\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")

    with open(dummy_pdf, "rb") as f:
        upload_resp = client.post(
            f"/api/proposals/{p_id}/document",
            files={"file": ("test_proposal.pdf", f, "application/pdf")},
            headers=headers_startup,
        )
    assert upload_resp.status_code == 200, upload_resp.text
    up_data = upload_resp.json()
    assert up_data["document"] is not None
    assert up_data["document"]["file_name"] == "test_proposal.pdf"
    assert up_data["analysis"] is not None
    assert up_data["analysis"]["analysis_status"] == "ANALYSIS_READY"
    assert "source_traceability" in up_data["analysis"]

    # 3. Final Submit Proposal
    sub_resp = client.post(f"/api/proposals/{p_id}/submit", headers=headers_startup)
    assert sub_resp.status_code == 200, sub_resp.text
    assert sub_resp.json()["status"] in ["SUBMITTED", "AI_ANALYSIS_READY"]

    # 4. Officer Assigns Evaluator
    headers_gov = get_auth_header("usr-gov", UserRole.GOVERNMENT_OFFICER)
    assign_resp = client.post(
        f"/api/proposals/{p_id}/assign-evaluators",
        json={"evaluator_ids": ["usr-eval"]},
        headers=headers_gov,
    )
    assert assign_resp.status_code == 200, assign_resp.text
    assert assign_resp.json()["status"] == "UNDER_REVIEW"

    # 5. Evaluator Submits Criterion Scores
    headers_eval = get_auth_header("usr-eval", UserRole.EVALUATOR)
    eval_payload = {
        "criterion_scores": [
            {"criterion_id": "crit-1", "score": 8.0, "comment": "Robust drone AI design"},
            {"criterion_id": "crit-2", "score": 9.0, "comment": "Highly cost effective"},
        ],
        "general_comments": "Strong technical and economic candidate.",
    }
    eval_resp = client.post(f"/api/proposals/{p_id}/evaluate", json=eval_payload, headers=headers_eval)
    assert eval_resp.status_code == 200, eval_resp.text
    ev_data = eval_resp.json()
    
    # Check weighted score: (8/10 * 50) + (9/10 * 50) = 40 + 45 = 85.0
    assert ev_data["total_weighted_score"] == 85.0

    # 6. Officer Shortlists Proposal with Reasoning
    shortlist_payload = {
        "decision": "SHORTLISTED",
        "reason": "Top technical score of 85% and proven drone edge capability.",
    }
    short_resp = client.post(f"/api/proposals/{p_id}/shortlist", json=shortlist_payload, headers=headers_gov)
    assert short_resp.status_code == 200, short_resp.text
    final_p = short_resp.json()
    assert final_p["status"] == "SHORTLISTED"
    assert final_p["shortlist_reason"] == "Top technical score of 85% and proven drone edge capability."

    # 7. Audit Trail check
    audit_resp = client.get(f"/api/proposals/{p_id}/audit-trail", headers=headers_gov)
    assert audit_resp.status_code == 200, audit_resp.text
    events = audit_resp.json()
    assert len(events) >= 5
    actions = [e["action"] for e in events]
    assert "PROPOSAL_SUBMITTED" in actions
    assert "DOCUMENT_UPLOADED" in actions
    assert "AI_ANALYSIS_COMPLETED" in actions
    assert "EVALUATION_SUBMITTED" in actions
    assert "PROPOSAL_SHORTLISTED" in actions
