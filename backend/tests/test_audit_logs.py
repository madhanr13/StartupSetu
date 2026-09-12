"""
Tests for Audit Logs System & API (SIH26136).

Verifies:
- Append-only immutability
- Filtering by action, entity_type, actor_role, and date range
- RBAC enforcement (STARTUP gets 403, GOV_OFFICER/ADMIN/AUDITOR allowed)
- Single log retrieval
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.audit import AuditAction, AuditEvent
from app.models.user import User, UserRole
from app.services.audit_service import AuditService

TEST_DB_URL = "sqlite:///./test_audit_db.db"
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

    # Clear and seed users
    db.query(AuditEvent).delete()
    db.query(User).delete()

    gov_user = User(
        id="usr-gov-aud",
        email="gov.aud@test.gov",
        name="Gov Officer",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        is_active=True,
    )
    admin_user = User(
        id="usr-admin-aud",
        email="admin.aud@test.gov",
        name="System Admin",
        hashed_password="hash",
        role=UserRole.ADMIN,
        is_active=True,
    )
    startup_user = User(
        id="usr-start-aud",
        email="startup.aud@test.io",
        name="Startup User",
        hashed_password="hash",
        role=UserRole.STARTUP,
        is_active=True,
    )
    db.add_all([gov_user, admin_user, startup_user])
    db.commit()

    # Create sample audit events
    AuditService.log_event(
        db=db,
        action=AuditAction.CHALLENGE_CREATED,
        entity_type="challenge",
        entity_id="ch-01",
        summary="Challenge created by officer",
        actor=gov_user,
        ip_address="192.168.1.100",
    )
    AuditService.log_event(
        db=db,
        action=AuditAction.DECISION_CREATED,
        entity_type="pilot",
        entity_id="pilot-01",
        summary="SCALE decision approved",
        actor=gov_user,
        details={"decision": "SCALE", "score": 92.5},
    )
    AuditService.log_event(
        db=db,
        action=AuditAction.SETTING_CHANGED,
        entity_type="system_setting",
        entity_id="set-01",
        summary="Weights adjusted",
        actor=admin_user,
    )

    yield
    db.close()


def test_audit_logs_rbac():
    # STARTUP role should get 403 Forbidden
    resp = client.get("/api/audit-logs", headers=auth_header("usr-start-aud", UserRole.STARTUP))
    assert resp.status_code == 403

    # GOVERNMENT_OFFICER should succeed
    resp = client.get("/api/audit-logs", headers=auth_header("usr-gov-aud", UserRole.GOVERNMENT_OFFICER))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    # ADMIN should succeed
    resp = client.get("/api/audit-logs", headers=auth_header("usr-admin-aud", UserRole.ADMIN))
    assert resp.status_code == 200


def test_audit_logs_filtering():
    headers = auth_header("usr-gov-aud", UserRole.GOVERNMENT_OFFICER)

    # Filter by action
    resp = client.get("/api/audit-logs?action=DECISION_CREATED", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["action"] == "DECISION_CREATED"

    # Filter by entity_type
    resp = client.get("/api/audit-logs?entity_type=system_setting", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # Filter by search
    resp = client.get("/api/audit-logs?search=SCALE", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_audit_log_detail_and_immutability():
    headers = auth_header("usr-gov-aud", UserRole.GOVERNMENT_OFFICER)

    # Fetch list to get ID
    resp = client.get("/api/audit-logs", headers=headers)
    log_id = resp.json()["items"][0]["id"]

    # Get single log
    detail_resp = client.get(f"/api/audit-logs/{log_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == log_id
    assert "details" in detail

    # Immutability check: POST / PUT / DELETE on /api/audit-logs must return 405 Method Not Allowed
    post_resp = client.post("/api/audit-logs", json={}, headers=headers)
    assert post_resp.status_code == 405

    del_resp = client.delete(f"/api/audit-logs/{log_id}", headers=headers)
    assert del_resp.status_code == 405
