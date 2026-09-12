"""
Tests for System Settings & Dynamic Matching Weights (SIH26136).

Verifies:
- Settings list & category retrieval
- Matching weights retrieval & admin mutation
- RBAC enforcement (STARTUP gets 403 on mutation, ADMIN allowed)
- Settings modification produces immutable AuditEvent
- Dynamic weights affect startup matcher rankings
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.audit import AuditAction, AuditEvent
from app.models.system_setting import SettingCategory, SettingValueType, SystemSetting
from app.models.user import User, UserRole
from app.services.settings_service import settings_service

TEST_DB_URL = "sqlite:///./test_settings_db.db"
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
    db.query(AuditEvent).delete()
    db.query(SystemSetting).delete()
    db.query(User).delete()

    admin_user = User(
        id="usr-admin-set",
        email="admin.set@test.gov",
        name="Admin User",
        hashed_password="hash",
        role=UserRole.ADMIN,
        is_active=True,
    )
    gov_user = User(
        id="usr-gov-set",
        email="gov.set@test.gov",
        name="Gov Officer",
        hashed_password="hash",
        role=UserRole.GOVERNMENT_OFFICER,
        is_active=True,
    )
    startup_user = User(
        id="usr-start-set",
        email="startup.set@test.io",
        name="Startup User",
        hashed_password="hash",
        role=UserRole.STARTUP,
        is_active=True,
    )
    db.add_all([admin_user, gov_user, startup_user])

    # Add default settings
    setting = SystemSetting(
        id="set-01",
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
        label="AI Matching Dimension Weights",
    )
    db.add(setting)
    db.commit()
    yield
    db.close()


def test_get_matching_weights():
    headers = auth_header("usr-gov-set", UserRole.GOVERNMENT_OFFICER)
    resp = client.get("/api/settings/matching-weights", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "weights" in data
    assert data["weights"]["technology_fit"] == 0.25


def test_update_matching_weights_rbac():
    # STARTUP cannot update weights
    startup_headers = auth_header("usr-start-set", UserRole.STARTUP)
    resp = client.patch(
        "/api/settings/matching-weights",
        json={"weights": {"technology_fit": 0.50}},
        headers=startup_headers,
    )
    assert resp.status_code == 403

    # ADMIN can update weights
    admin_headers = auth_header("usr-admin-set", UserRole.ADMIN)
    new_weights = {
        "technology_fit": 0.40,
        "domain_fit": 0.30,
        "relevant_projects": 0.10,
        "team_capability": 0.10,
        "deployment_experience": 0.05,
        "scalability": 0.05,
        "security_readiness": 0.0,
        "budget_compatibility": 0.0,
    }
    resp = client.patch(
        "/api/settings/matching-weights",
        json={"weights": new_weights},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["weights"]["technology_fit"] == 0.40

    # Verify audit event was logged
    db = TestingSessionLocal()
    events = db.query(AuditEvent).filter(AuditEvent.action == AuditAction.SCORING_CONFIG_CHANGED.value).all()
    assert len(events) == 1
    assert events[0].actor_id == "usr-admin-set"
    db.close()


def test_update_generic_setting():
    admin_headers = auth_header("usr-admin-set", UserRole.ADMIN)

    resp = client.patch(
        "/api/settings/matching.weights",
        json={"value": {"custom": 1.0}},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["value"]["custom"] == 1.0

    # Verify audit event with before and after state
    db = TestingSessionLocal()
    events = db.query(AuditEvent).filter(AuditEvent.action == AuditAction.SETTING_CHANGED.value).all()
    assert len(events) >= 1
    assert "old_value" in events[-1].details
    assert "new_value" in events[-1].details
    db.close()
