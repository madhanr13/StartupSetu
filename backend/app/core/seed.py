"""
Seed data for development and demo purposes.

Creates demo departments and user accounts for each role.
All passwords are hashed with Argon2 — never stored in plaintext.
"""

import logging

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.department import Department
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

# ── Demo Departments ────────────────────────────────────────────────────────

DEMO_DEPARTMENTS = [
    {
        "id": "dept-meity",
        "name": "Ministry of Electronics & Information Technology",
        "code": "MeitY",
        "description": "Responsible for IT policy, electronics, and e-governance.",
    },
    {
        "id": "dept-mohfw",
        "name": "Ministry of Health & Family Welfare",
        "code": "MoHFW",
        "description": "Responsible for health policy, disease control, and public health.",
    },
    {
        "id": "dept-mod",
        "name": "Ministry of Defence",
        "code": "MoD",
        "description": "Responsible for defence policy, armed forces, and national security.",
    },
    {
        "id": "dept-mohua",
        "name": "Ministry of Housing & Urban Affairs",
        "code": "MoHUA",
        "description": "Responsible for urban planning, housing policy, and smart cities.",
    },
]

# ── Demo User Accounts ──────────────────────────────────────────────────────

DEMO_USERS = [
    {
        "id": "user-gov-01",
        "email": "gov@demo.sih",
        "name": "Rajesh Kumar",
        "password": "demo1234",
        "role": UserRole.GOVERNMENT_OFFICER,
        "department_id": "dept-meity",
    },
    {
        "id": "user-startup-01",
        "email": "startup@demo.sih",
        "name": "Priya Sharma",
        "password": "demo1234",
        "role": UserRole.STARTUP,
        "department_id": None,
    },
    {
        "id": "user-evaluator-01",
        "email": "evaluator@demo.sih",
        "name": "Dr. Anand Mehta",
        "password": "demo1234",
        "role": UserRole.EVALUATOR,
        "department_id": None,
    },
    {
        "id": "user-admin-01",
        "email": "admin@demo.sih",
        "name": "Suresh Patel",
        "password": "demo1234",
        "role": UserRole.ADMIN,
        "department_id": None,
    },
    {
        "id": "user-auditor-01",
        "email": "auditor@demo.sih",
        "name": "Meena Iyer",
        "password": "demo1234",
        "role": UserRole.AUDITOR,
        "department_id": None,
    },
]


def seed_demo_data(db: Session) -> None:
    """
    Populate the database with demo departments and users.
    Skips seeding if data already exists (idempotent).
    """
    # Check if seed data already exists
    existing_users = db.query(User).count()
    if existing_users > 0:
        logger.info("Seed data already exists (%d users), skipping.", existing_users)
        return

    logger.info("Seeding demo data...")

    # Create departments
    for dept_data in DEMO_DEPARTMENTS:
        dept = Department(**dept_data)
        db.add(dept)
    db.flush()  # Ensure department IDs are available for FK references

    # Create users
    for user_data in DEMO_USERS:
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            hashed_password=hash_password(user_data["password"]),
            role=user_data["role"],
            department_id=user_data["department_id"],
            is_active=True,
        )
        db.add(user)

    db.commit()
    logger.info(
        "Seeded %d departments and %d demo users.",
        len(DEMO_DEPARTMENTS),
        len(DEMO_USERS),
    )
