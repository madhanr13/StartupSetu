"""
Seed data for development and demo purposes.

Creates demo departments and user accounts for each role.
All passwords are hashed with Argon2 — never stored in plaintext.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.challenge import (
    Challenge,
    ChallengeEvaluationCriterion,
    ChallengeKPI,
    ChallengeRequirement,
    ChallengeStatus,
)

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

    db.flush()

    # ── Seed Demo Challenges ────────────────────────────────────────────────

    now = datetime.now(timezone.utc)

    # Challenge 1: Published — Road Damage Detection
    ch1 = Challenge(
        id="ch-road-01",
        title="AI-Based Road Damage & Pothole Detection System",
        description=(
            "Deploy an intelligent system that uses computer vision to detect "
            "road surface damage including potholes, cracks, and surface "
            "deterioration from vehicle-mounted cameras, then prioritize "
            "maintenance activities based on severity and traffic impact."
        ),
        problem_statement=(
            "Our roads have significant maintenance backlogs. We need a system "
            "to automatically identify potholes and road damage from road images "
            "captured by survey vehicles and prioritize maintenance scheduling."
        ),
        domain="Infrastructure & Transport",
        status=ChallengeStatus.PUBLISHED,
        budget_min=2500000,
        budget_max=5000000,
        pilot_duration_weeks=12,
        deadline=now + timedelta(days=30),
        department_id="dept-mohua",
        created_by="user-gov-01",
        published_at=now - timedelta(days=5),
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(days=5),
    )
    db.add(ch1)
    db.flush()

    for i, req_desc in enumerate([
        "Computer vision model with ≥90% detection accuracy for potholes and cracks",
        "Real-time geo-tagged damage reporting with GPS coordinates",
        "Integration with existing municipal GIS systems",
        "Dashboard for maintenance prioritization based on severity scoring",
        "Mobile app for field teams to verify and update reports",
    ]):
        db.add(ChallengeRequirement(
            challenge_id=ch1.id, description=req_desc,
            is_mandatory=i < 4, order=i,
        ))

    for name, desc, target, unit, weight in [
        ("Detection Accuracy", "Correctly identified damage instances", 90, "%", 0.3),
        ("False Positive Rate", "Incorrect damage detections", 5, "%", 0.15),
        ("Processing Latency", "Image to report generation time", 30, "seconds", 0.15),
        ("Coverage Area", "Road network covered during pilot", 500, "km", 0.2),
        ("Response Time Reduction", "Reduction in maintenance response time", 40, "% reduction", 0.2),
    ]:
        db.add(ChallengeKPI(
            challenge_id=ch1.id, name=name, description=desc,
            target_value=target, unit=unit, weight=weight,
        ))

    for name, desc, weight, max_score in [
        ("Technical Approach", "Feasibility of proposed architecture", 0.25, 10),
        ("AI Model Performance", "Accuracy and robustness of models", 0.25, 10),
        ("Scalability", "Ability to scale across regions", 0.15, 10),
        ("Team Capability", "Experience and technical expertise", 0.2, 10),
        ("Cost Effectiveness", "Value for money projections", 0.15, 10),
    ]:
        db.add(ChallengeEvaluationCriterion(
            challenge_id=ch1.id, name=name, description=desc,
            weight=weight, max_score=max_score,
        ))

    # Challenge 2: Accepting Proposals — Water Quality Monitoring
    ch2 = Challenge(
        id="ch-water-01",
        title="Real-Time Water Quality IoT Monitoring System",
        description=(
            "Implement an IoT-based continuous water quality monitoring system "
            "that tracks key parameters across municipal water distribution "
            "networks and generates automated alerts when thresholds are breached."
        ),
        problem_statement=(
            "We need a way to continuously monitor water quality across our "
            "city's distribution network. Currently we rely on manual sampling "
            "which is slow and incomplete."
        ),
        domain="Environmental Monitoring",
        status=ChallengeStatus.ACCEPTING_PROPOSALS,
        budget_min=3000000,
        budget_max=7000000,
        pilot_duration_weeks=16,
        deadline=now + timedelta(days=15),
        department_id="dept-mohua",
        created_by="user-gov-01",
        published_at=now - timedelta(days=8),
        created_at=now - timedelta(days=12),
        updated_at=now - timedelta(days=3),
    )
    db.add(ch2)
    db.flush()

    for i, req_desc in enumerate([
        "IoT sensors monitoring pH, turbidity, dissolved oxygen, and conductivity",
        "Cloud-based real-time data aggregation and visualization dashboard",
        "Automated SMS and email alerts for threshold breaches",
        "API integration with existing municipal water management systems",
        "Historical data analytics with trend prediction",
    ]):
        db.add(ChallengeRequirement(
            challenge_id=ch2.id, description=req_desc,
            is_mandatory=i < 4, order=i,
        ))

    for name, desc, target, unit, weight in [
        ("Sensor Uptime", "Operational and transmitting data", 99, "%", 0.25),
        ("Alert Latency", "Time from breach to alert delivery", 5, "minutes", 0.25),
        ("Measurement Accuracy", "Correlation with lab measurements", 95, "%", 0.25),
        ("Coverage Points", "Monitoring stations deployed", 50, "stations", 0.25),
    ]:
        db.add(ChallengeKPI(
            challenge_id=ch2.id, name=name, description=desc,
            target_value=target, unit=unit, weight=weight,
        ))

    for name, desc, weight, max_score in [
        ("Sensor Technology", "Reliability and accuracy of hardware", 0.25, 10),
        ("Platform Architecture", "Scalability and reliability", 0.2, 10),
        ("Data Analytics", "Analytics and prediction capabilities", 0.2, 10),
        ("Deployment Feasibility", "Ease of field installation", 0.2, 10),
        ("Cost Effectiveness", "Total cost of ownership", 0.15, 10),
    ]:
        db.add(ChallengeEvaluationCriterion(
            challenge_id=ch2.id, name=name, description=desc,
            weight=weight, max_score=max_score,
        ))

    # Challenge 3: Published — Health Queue Management
    ch3 = Challenge(
        id="ch-health-01",
        title="Automated OPD Queue Management for Government Hospitals",
        description=(
            "Develop an intelligent queue management and resource allocation "
            "system for government hospitals that reduces patient wait times, "
            "optimizes doctor scheduling, and improves facility throughput."
        ),
        problem_statement=(
            "Our government hospitals have long OPD wait times, sometimes 3-4 hours. "
            "We need a system to manage patient queues and optimize doctor allocation."
        ),
        domain="Healthcare & Public Health",
        status=ChallengeStatus.PUBLISHED,
        budget_min=1500000,
        budget_max=4000000,
        pilot_duration_weeks=10,
        deadline=now + timedelta(days=20),
        department_id="dept-mohfw",
        created_by="user-gov-01",
        published_at=now - timedelta(days=3),
        created_at=now - timedelta(days=7),
        updated_at=now - timedelta(days=3),
    )
    db.add(ch3)
    db.flush()

    for i, req_desc in enumerate([
        "Patient flow prediction using historical visit patterns",
        "Dynamic queue management with estimated wait time display",
        "Doctor and resource scheduling optimization engine",
        "Integration with existing Hospital Management Information Systems",
    ]):
        db.add(ChallengeRequirement(
            challenge_id=ch3.id, description=req_desc,
            is_mandatory=True, order=i,
        ))

    for name, desc, target, unit, weight in [
        ("Wait Time Reduction", "Reduction in average patient wait time", 30, "% reduction", 0.3),
        ("Throughput Increase", "More patients served per day", 20, "% increase", 0.25),
        ("Doctor Utilization", "Doctor utilization rate improvement", 85, "%", 0.2),
        ("Patient Satisfaction", "Post-visit satisfaction score", 4, "out of 5", 0.25),
    ]:
        db.add(ChallengeKPI(
            challenge_id=ch3.id, name=name, description=desc,
            target_value=target, unit=unit, weight=weight,
        ))

    for name, desc, weight, max_score in [
        ("Algorithm Quality", "Prediction and optimization effectiveness", 0.25, 10),
        ("User Experience", "Ease of use for staff and patients", 0.2, 10),
        ("Integration Capability", "Ability to integrate with hospital systems", 0.2, 10),
        ("Scalability", "Scale from single facility to district-wide", 0.15, 10),
        ("Team Experience", "Healthcare technology deployment track record", 0.2, 10),
    ]:
        db.add(ChallengeEvaluationCriterion(
            challenge_id=ch3.id, name=name, description=desc,
            weight=weight, max_score=max_score,
        ))

    # Challenge 4: Draft — Land Records (incomplete, for testing)
    ch4 = Challenge(
        id="ch-land-01",
        title="Blockchain-Based Land Records Fraud Detection",
        description=(
            "Implement a blockchain-backed system to detect fraudulent land "
            "title transfers and mutations in revenue department records."
        ),
        problem_statement=(
            "Land records fraud is a significant issue in our state. "
            "We need to detect duplicate registrations and suspicious mutations."
        ),
        domain="Digital Governance",
        status=ChallengeStatus.DRAFT,
        budget_min=2000000,
        budget_max=5000000,
        pilot_duration_weeks=14,
        department_id="dept-meity",
        created_by="user-gov-01",
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=1),
    )
    db.add(ch4)

    db.commit()
    logger.info(
        "Seeded %d departments, %d demo users, and 4 demo challenges.",
        len(DEMO_DEPARTMENTS),
        len(DEMO_USERS),
    )

