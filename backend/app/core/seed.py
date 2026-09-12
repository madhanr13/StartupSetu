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
from app.models.startup import (
    Startup,
    StartupCertification,
    StartupDeployment,
    StartupDomain,
    StartupProject,
    StartupReadinessScore,
    StartupTeamCapability,
    StartupTechnology,
)
from app.models.proposal import (
    AnalysisStatus,
    EvaluationStatus,
    Proposal,
    ProposalAnalysis,
    ProposalDocument,
    ProposalEvaluation,
    ProposalStatus,
)
from app.models.pilot import (
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
    RiskCategory,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)
from app.models.audit import AuditAction, AuditEvent
from app.models.procurement import (
    DecisionType,
    ProcurementDecision,
    ProcurementScaleUp,
    ScaleUpStatus,
)
from app.models.innovation_memory import (
    InnovationMemory,
    MemoryOutcome,
    MemorySourceType,
)
from app.models.system_setting import (
    SettingCategory,
    SettingValueType,
    SystemSetting,
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
    Populate the database with demo departments, users, challenges, and startups.
    Checks each model independently so existing users do not prevent challenges/startups from seeding.
    """
    logger.info("Seeding demo data if missing...")

    # Create departments
    for dept_data in DEMO_DEPARTMENTS:
        if not db.query(Department).filter(Department.id == dept_data["id"]).first():
            dept = Department(**dept_data)
            db.add(dept)
    db.flush()  # Ensure department IDs are available for FK references

    # Create users
    for user_data in DEMO_USERS:
        if not db.query(User).filter(User.id == user_data["id"]).first():
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

    if not db.query(Challenge).filter(Challenge.id == "ch-road-01").first():
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

    # ── Demo Synthetic Startups ──────────────────────────────────────────────
    DEMO_STARTUPS = [
        {
            "id": "st-01",
            "company_name": "RoadSense Analytics",
            "slug": "roadsense-analytics",
            "short_description": "Computer vision and edge AI solutions for road infrastructure condition assessment.",
            "description": "RoadSense Analytics develops specialized computer vision algorithms and low-cost edge sensors mounted on municipal vehicles to automatically detect potholes, road cracks, and signage anomalies in real time.",
            "founded_year": 2021,
            "location": "Bengaluru, Karnataka",
            "website": "https://roadsense.example.in",
            "contact_email": "contact@roadsense.example.in",
            "employee_count": 24,
            "dpiit_recognized": True,
            "dpiit_number": "DPIIT-89412",
            "technologies": [
                ("Computer Vision", "Expert"),
                ("Edge AI", "Expert"),
                ("Geospatial GIS", "Advanced"),
                ("Python", "Expert"),
                ("Deep Learning", "Advanced"),
            ],
            "domains": ["Infrastructure & Mobility", "Smart Cities"],
            "projects": [
                {
                    "name": "Automated Municipal Pothole Mapping",
                    "description": "Deployed camera units on 50 waste collection trucks to scan 1,200 km of city roads daily.",
                    "domain": "Infrastructure & Mobility",
                    "technologies": ["Computer Vision", "Edge AI", "GIS"],
                    "outcome": "Reduced manual inspection costs by 68% and detected 14,000+ pavement defects.",
                    "deployment_scale": "50 vehicles / 1,200 km daily",
                    "client_type": "Municipal Corporation",
                    "year": 2023,
                },
                {
                    "name": "Highway Signage & Asset Inspection",
                    "description": "Automated road sign condition tracking and guardrail damage reporting.",
                    "domain": "Infrastructure & Mobility",
                    "technologies": ["Object Detection", "Python"],
                    "outcome": "Achieved 94% detection accuracy for faded and damaged traffic signs.",
                    "deployment_scale": "450 km Highway Stretch",
                    "client_type": "State Highway Authority",
                    "year": 2024,
                },
            ],
            "certifications": [
                ("ISO 27001", "BSI India", "2023-01-15", "2026-01-14"),
                ("CERT-In Security Cleared", "CERT-In Empanelled Auditor", "2023-06-10", "2025-06-09"),
            ],
            "readiness": {
                "technical_capability": 94.0,
                "team_strength": 88.0,
                "deployment_readiness": 92.0,
                "security_readiness": 86.0,
                "scalability": 94.0,
                "financial_readiness": 85.0,
                "domain_experience": 95.0,
                "government_readiness": 88.0,
                "overall_score": 90.3,
            },
        },
        {
            "id": "st-02",
            "company_name": "CivicVision Labs",
            "slug": "civicvision-labs",
            "short_description": "AI video analytics and smart traffic signal management systems.",
            "description": "CivicVision Labs builds edge AI camera processors that interface directly with traffic signal controllers to dynamically adjust green light duration based on real-time vehicle queue lengths.",
            "founded_year": 2020,
            "location": "Pune, Maharashtra",
            "website": "https://civicvision.example.in",
            "contact_email": "info@civicvision.example.in",
            "employee_count": 32,
            "dpiit_recognized": True,
            "dpiit_number": "DPIIT-71209",
            "technologies": [
                ("Computer Vision", "Expert"),
                ("Edge Computing", "Expert"),
                ("IoT Sensors", "Advanced"),
                ("Video Analytics", "Expert"),
            ],
            "domains": ["Smart Governance & Digital Services", "Infrastructure & Mobility"],
            "projects": [
                {
                    "name": "Smart Corridor Adaptive Signal Pilot",
                    "description": "Adaptive traffic control across 18 major arterial city junctions.",
                    "domain": "Infrastructure & Mobility",
                    "technologies": ["Video Analytics", "Edge Computing"],
                    "outcome": "Reduced peak-hour commuter delay by 22% and reduced idle emissions.",
                    "deployment_scale": "18 Traffic Junctions",
                    "client_type": "City Traffic Police",
                    "year": 2023,
                }
            ],
            "certifications": [
                ("ISO 9001:2015", "TUV SUD", "2022-04-10", "2025-04-09"),
                ("ISO 27001", "Intertek", "2023-02-01", "2026-01-31"),
            ],
            "readiness": {
                "technical_capability": 91.0,
                "team_strength": 86.0,
                "deployment_readiness": 88.0,
                "security_readiness": 84.0,
                "scalability": 90.0,
                "financial_readiness": 82.0,
                "domain_experience": 89.0,
                "government_readiness": 84.0,
                "overall_score": 86.8,
            },
        },
        {
            "id": "st-03",
            "company_name": "AquaMetric Technologies",
            "slug": "aquametric-technologies",
            "short_description": "IoT water quality sensors, telemetry gateways, and pipe leakage detection.",
            "description": "AquaMetric manufactures solar-powered multi-parameter water quality probes and acoustics-based underground pipe leak detectors designed for municipal water distribution networks.",
            "founded_year": 2019,
            "location": "Hyderabad, Telangana",
            "website": "https://aquametric.example.in",
            "contact_email": "contact@aquametric.example.in",
            "employee_count": 18,
            "dpiit_recognized": True,
            "dpiit_number": "DPIIT-55102",
            "technologies": [
                ("IoT Sensors", "Expert"),
                ("Telemetry", "Advanced"),
                ("Water Analytics", "Expert"),
                ("LoRaWAN", "Advanced"),
            ],
            "domains": ["Water Resources & Smart Utilities", "Clean Energy & Environment"],
            "projects": [
                {
                    "name": "District Water Pipeline Telemetry Test",
                    "description": "Deployed 120 acoustic leak sensors and water quality nodes in ward distribution lines.",
                    "domain": "Water Resources & Smart Utilities",
                    "technologies": ["IoT Sensors", "LoRaWAN", "Water Analytics"],
                    "outcome": "Detected 34 non-revenue water leaks and maintained real-time residual chlorine monitoring.",
                    "deployment_scale": "120 Sensor Nodes / 35 km Network",
                    "client_type": "Urban Water Supply Board",
                    "year": 2023,
                }
            ],
            "certifications": [
                ("ISO 14001", "Bureau Veritas", "2022-08-12", "2025-08-11"),
                ("CERT-In Audit Passed", "CERT-In Panel Auditor", "2024-01-10", "2026-01-09"),
            ],
            "readiness": {
                "technical_capability": 89.0,
                "team_strength": 84.0,
                "deployment_readiness": 90.0,
                "security_readiness": 88.0,
                "scalability": 87.0,
                "financial_readiness": 80.0,
                "domain_experience": 94.0,
                "government_readiness": 86.0,
                "overall_score": 87.3,
            },
        },
        {
            "id": "st-04",
            "company_name": "UrbanGrid AI",
            "slug": "urbangrid-ai",
            "short_description": "Smart energy analytics and automated street lighting optimization.",
            "description": "UrbanGrid AI provides centralized smart lighting feeder management units and machine learning energy optimization for municipal streetlight infrastructure.",
            "founded_year": 2022,
            "location": "Ahmedabad, Gujarat",
            "website": "https://urbangrid.example.in",
            "contact_email": "hello@urbangrid.example.in",
            "employee_count": 28,
            "dpiit_recognized": True,
            "dpiit_number": "DPIIT-92811",
            "technologies": [
                ("Smart Grid", "Expert"),
                ("Energy Analytics", "Expert"),
                ("Edge IoT", "Advanced"),
                ("Deep Learning", "Intermediate"),
            ],
            "domains": ["Clean Energy & Environment", "Smart Cities"],
            "projects": [
                {
                    "name": "Smart Streetlight Energy Retrofit",
                    "description": "Automated dimming and fault detection across 12,000 LED streetlights.",
                    "domain": "Clean Energy & Environment",
                    "technologies": ["Smart Grid", "Edge IoT"],
                    "outcome": "Saved 31% energy consumption annually and reduced maintenance response time to < 4 hours.",
                    "deployment_scale": "12,000 Streetlight Nodes",
                    "client_type": "Smart City SPV",
                    "year": 2024,
                }
            ],
            "certifications": [
                ("ISO 50001 (EnMS)", "DNV GL", "2023-05-18", "2026-05-17"),
            ],
            "readiness": {
                "technical_capability": 88.0,
                "team_strength": 85.0,
                "deployment_readiness": 89.0,
                "security_readiness": 82.0,
                "scalability": 92.0,
                "financial_readiness": 86.0,
                "domain_experience": 88.0,
                "government_readiness": 85.0,
                "overall_score": 86.9,
            },
        },
        {
            "id": "st-05",
            "company_name": "InfraSight Systems",
            "slug": "infrasight-systems",
            "short_description": "LiDAR and drone-based structural inspection & asset mapping.",
            "description": "InfraSight Systems utilizes mobile LiDAR point clouds and high-resolution drone photogrammetry to build digital twins for bridges, highways, and public buildings.",
            "founded_year": 2021,
            "location": "Chennai, Tamil Nadu",
            "website": "https://infrasight.example.in",
            "contact_email": "contact@infrasight.example.in",
            "employee_count": 15,
            "dpiit_recognized": True,
            "dpiit_number": "DPIIT-63910",
            "technologies": [
                ("LiDAR Processing", "Expert"),
                ("Computer Vision", "Advanced"),
                ("Geospatial GIS", "Expert"),
                ("Drone Analytics", "Expert"),
            ],
            "domains": ["Infrastructure & Mobility", "Public Works"],
            "projects": [
                {
                    "name": "State Overpass Structural Inspection",
                    "description": "3D LiDAR point cloud scanning and crack depth measurement for 14 major flyovers.",
                    "domain": "Infrastructure & Mobility",
                    "technologies": ["LiDAR Processing", "Drone Analytics"],
                    "outcome": "Identified structural micro-fractures undetectable by manual visual inspection.",
                    "deployment_scale": "14 Flyover Structures",
                    "client_type": "Public Works Department",
                    "year": 2023,
                }
            ],
            "certifications": [
                ("DGCA Approved Drone Operator", "DGCA India", "2022-11-01", "2027-10-31"),
                ("ISO 27001", "TUV Austria", "2023-09-15", "2026-09-14"),
            ],
            "readiness": {
                "technical_capability": 92.0,
                "team_strength": 82.0,
                "deployment_readiness": 86.0,
                "security_readiness": 85.0,
                "scalability": 84.0,
                "financial_readiness": 79.0,
                "domain_experience": 91.0,
                "government_readiness": 83.0,
                "overall_score": 85.3,
            },
        },
        {
            "id": "st-06",
            "company_name": "CivicPulse Technologies",
            "slug": "civicpulse-technologies",
            "short_description": "AI citizen grievance triage and automated helpline dispatch.",
            "description": "CivicPulse builds Indic multi-lingual voice AI agents and NLP ticket routing engines for municipal citizen service helplines (e.g. 1912 / 311).",
            "founded_year": 2020,
            "location": "New Delhi, Delhi NCR",
            "website": "https://civicpulse.example.in",
            "contact_email": "hello@civicpulse.example.in",
            "employee_count": 40,
            "dpiit_recognized": True,
            "dpiit_number": "DPIIT-41829",
            "technologies": [
                ("NLP", "Expert"),
                ("Automated Triage", "Expert"),
                ("Voice AI", "Advanced"),
                ("Citizen CRM", "Advanced"),
            ],
            "domains": ["Smart Governance & Digital Services", "Public Health & Medical Technology"],
            "projects": [
                {
                    "name": "Multi-Lingual Municipal Helpline AI",
                    "description": "Automated voice and chat grievance intake in Hindi, Marathi, and English.",
                    "domain": "Smart Governance & Digital Services",
                    "technologies": ["NLP", "Voice AI"],
                    "outcome": "Handled 180,000 citizen calls with 89% automated classification accuracy.",
                    "deployment_scale": "Citywide Helpline / 180k calls",
                    "client_type": "Municipal Corporation",
                    "year": 2023,
                }
            ],
            "certifications": [
                ("ISO 27001", "BSI", "2022-03-15", "2025-03-14"),
                ("SOC2 Type II", "Deloitte Auditor", "2023-11-20", "2025-11-19"),
            ],
            "readiness": {
                "technical_capability": 90.0,
                "team_strength": 89.0,
                "deployment_readiness": 88.0,
                "security_readiness": 92.0,
                "scalability": 93.0,
                "financial_readiness": 87.0,
                "domain_experience": 86.0,
                "government_readiness": 90.0,
                "overall_score": 89.4,
            },
        },
    ]

    for s_data in DEMO_STARTUPS:
        startup = db.query(Startup).filter(Startup.id == s_data["id"]).first()
        if not startup:
            startup = Startup(
                id=s_data["id"],
                company_name=s_data["company_name"],
                slug=s_data["slug"],
                short_description=s_data["short_description"],
                description=s_data["description"],
                founded_year=s_data["founded_year"],
                location=s_data["location"],
                website=s_data["website"],
                contact_email=s_data["contact_email"],
                employee_count=s_data["employee_count"],
                dpiit_recognized=s_data["dpiit_recognized"],
                dpiit_number=s_data["dpiit_number"],
            )
            db.add(startup)
            db.flush()

            for tech_name, prof in s_data["technologies"]:
                db.add(StartupTechnology(startup_id=startup.id, technology=tech_name, proficiency=prof))

            for dom_name in s_data["domains"]:
                db.add(StartupDomain(startup_id=startup.id, domain=dom_name))

            for proj in s_data["projects"]:
                db.add(
                    StartupProject(
                        startup_id=startup.id,
                        name=proj["name"],
                        description=proj["description"],
                        domain=proj["domain"],
                        technologies=proj["technologies"],
                        outcome=proj["outcome"],
                        deployment_scale=proj["deployment_scale"],
                        client_type=proj["client_type"],
                        year=proj["year"],
                    )
                )

            for cert_name, auth, issue, exp in s_data["certifications"]:
                db.add(
                    StartupCertification(
                        startup_id=startup.id,
                        name=cert_name,
                        issuing_authority=auth,
                        issue_date=issue,
                        expiry_date=exp,
                    )
                )

            r_vals = s_data["readiness"]
            db.add(
                StartupReadinessScore(
                    startup_id=startup.id,
                    technical_capability=r_vals["technical_capability"],
                    team_strength=r_vals["team_strength"],
                    deployment_readiness=r_vals["deployment_readiness"],
                    security_readiness=r_vals["security_readiness"],
                    scalability=r_vals["scalability"],
                    financial_readiness=r_vals["financial_readiness"],
                    domain_experience=r_vals["domain_experience"],
                    government_readiness=r_vals["government_readiness"],
                    overall_score=r_vals["overall_score"],
                )
            )
    # ── Seed Demo Proposals ──────────────────────────────────────────────────
    if not db.query(Proposal).filter(Proposal.id == "prop-demo-01").first():
        from pathlib import Path
        import os

        # Create demo proposal file on disk
        upload_dir = Path("uploads/proposals")
        upload_dir.mkdir(parents=True, exist_ok=True)
        demo_pdf_path = upload_dir / "prop_demo_01_proposal.pdf"
        if not demo_pdf_path.exists():
            with open(demo_pdf_path, "wb") as f:
                f.write(b"%PDF-1.4\n%Demo Proposal Document for NeuralVision Labs\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT /F1 12 Tf 100 700 Td (AI Pothole & Road Anomaly Detection Proposal by NeuralVision Labs) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000052 00000 n\n0000000109 00000 n\n0000000174 00000 n\n0000000269 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n440\n%%EOF")

        p1 = Proposal(
            id="prop-demo-01",
            challenge_id="ch-road-01",
            startup_id="st-01",
            title="AI Edge Pothole & Road Anomaly Detection Platform",
            executive_summary="NeuralVision Labs presents a deep-learning powered edge detection solution that analyzes real-time video feeds from municipal vehicle dashcams to automatically locate, measure depth/severity, and prioritize road repair work orders.",
            estimated_cost=3500000.0,
            implementation_duration_days=90,
            contact_name="Priya Sharma",
            contact_email="startup@demo.sih",
            contact_phone="+91 98765 43210",
            status=ProposalStatus.EVALUATED,
            assigned_evaluator_ids=["user-evaluator-01"],
            submitted_at=now - timedelta(days=5),
        )
        db.add(p1)
        db.flush()

        # Proposal Document
        doc1 = ProposalDocument(
            id="doc-demo-01",
            proposal_id=p1.id,
            file_name="NeuralVision_Road_Detection_Proposal.pdf",
            storage_key=str(demo_pdf_path.as_posix()),
            file_size=485000,
            checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            uploaded_at=now - timedelta(days=5),
        )
        db.add(doc1)

        # AI Extracted Facts
        analysis1 = ProposalAnalysis(
            id="ana-demo-01",
            proposal_id=p1.id,
            analysis_status=AnalysisStatus.ANALYSIS_READY,
            solution_summary="Edge AI detection deployed on city buses & dashcams. Automatic pothole classification, severity calculation, GIS map pin generation, and integration with PWD municipal dispatch.",
            technologies=["YOLOv8", "TensorRT", "FastAPI", "React", "PostGIS", "Docker", "Edge AI Dashcam"],
            architecture_summary="Dual-tier architecture: 1) On-device TensorRT edge inference on Dashcam unit, 2) Central GeoServer dashboard with automated work-order generation.",
            implementation_plan="Month 1: Dashcam mounting & edge software flashing across 50 municipal vehicles.\nMonth 2: Model calibration on local asphalt conditions.\nMonth 3: Live PWD dispatch integration & officer portal launch.",
            timeline_summary="90 Days total (30d Setup, 30d Calibration, 30d System Rollout).",
            budget_summary="Total Budget INR 35,00,000. Breakdown: Hardware & Edge Mounts 30%, Software Development 40%, Deployment & Training 20%, Maintenance 10%.",
            team_summary="Priya Sharma (M.Tech AI IISc, 8 yrs CV), Senior Embedded Systems Engineer (Ex-ISRO intern), Senior Full Stack GIS Lead.",
            previous_deployments="Deployed automated road health system for Bengaluru Smart City (450km scanned, 94.2% detection precision).",
            infrastructure_requirements="50x Edge camera units (provided by startup), Cloud VM with 1x NVIDIA T4 GPU for batch analytics.",
            security_measures="AES-256 encrypted storage, TLS 1.3 data stream, automatic facial and license-plate blurring at edge before cloud upload.",
            data_requirements="Access to city road GIS basemaps and PWD work order API endpoints.",
            scalability_assessment="High. Dockerized microservices scale horizontally across municipal zones with zero architectural changes.",
            risks=[
                "Extreme monsoon weather reducing camera clarity (Mitigation: Rain-repellent lens coating & infrared floodlights).",
                "Transient network dead-zones (Mitigation: Local SSD buffer caching up to 72 hours of offline detections)."
            ],
            expected_outcomes=[
                "90%+ reduction in manual road inspection costs.",
                "Sub-24 hour pothole identification to work order creation cycle time.",
                "Automated repair quality verification scan post-maintenance."
            ],
            key_assumptions=[
                "PWD department will provide API access for work-order integration within 14 days of project start."
            ],
            source_traceability={
                "solution_summary": "Page 1, Section 1 (Executive Summary)",
                "technologies": "Page 2, Section 2.1 (Technical Architecture & Stack)",
                "architecture_summary": "Page 3, Figure 2 (Edge-to-Cloud System Diagram)",
                "budget_summary": "Page 5, Table 3 (Financial Breakdown)",
                "security_measures": "Page 6, Section 4.2 (Data Privacy & Compliance)",
            },
            analyzed_at=now - timedelta(days=5),
        )
        db.add(analysis1)

        # Human Evaluation
        # Fetch challenge criterion IDs
        c1 = db.query(Challenge).filter(Challenge.id == "ch-road-01").first()
        crit_list = []
        if c1 and c1.evaluation_criteria:
            for crit in c1.evaluation_criteria:
                w = float(getattr(crit, 'weight', getattr(crit, 'weight_percentage', 50.0)))
                c_name = getattr(crit, 'name', getattr(crit, 'criterion_name', 'Criterion'))
                sc = 9.0  # High score out of 10
                crit_list.append({
                    "criterion_id": crit.id,
                    "criterion_name": c_name,
                    "score": sc,
                    "max_score": 10.0,
                    "weight": w,
                    "weighted_score": round((sc / 10.0) * w, 2),
                    "comment": f"Excellent proposal demonstration for {c_name}.",
                })

        eval1 = ProposalEvaluation(
            id="eval-demo-01",
            proposal_id=p1.id,
            evaluator_id="user-evaluator-01",
            evaluator_name="Dr. Anand Mehta",
            status=EvaluationStatus.COMPLETED,
            criterion_scores=crit_list,
            total_weighted_score=88.5,
            general_comments="Strong technical architecture, proven past track record in Bengaluru, and realistic cost breakdown.",
            submitted_at=now - timedelta(days=2),
        )
        db.add(eval1)

        # Audit Trail
        events = [
            AuditEvent(
                action=AuditAction.PROPOSAL_SUBMITTED,
                entity_type="proposal",
                entity_id=p1.id,
                actor_id="user-startup-01",
                actor_name="Priya Sharma",
                actor_role="STARTUP",
                summary="Proposal 'AI Edge Pothole & Road Anomaly Detection Platform' draft created.",
                timestamp=now - timedelta(days=5, hours=2),
            ),
            AuditEvent(
                action=AuditAction.DOCUMENT_UPLOADED,
                entity_type="proposal",
                entity_id=p1.id,
                actor_id="user-startup-01",
                actor_name="Priya Sharma",
                actor_role="STARTUP",
                summary="Uploaded proposal document 'NeuralVision_Road_Detection_Proposal.pdf' (485 KB).",
                timestamp=now - timedelta(days=5, hours=1),
            ),
            AuditEvent(
                action=AuditAction.AI_ANALYSIS_COMPLETED,
                entity_type="proposal",
                entity_id=p1.id,
                actor_id=None,
                actor_name="AI Extraction Engine",
                actor_role="SYSTEM",
                summary="AI fact extraction & source traceability completed successfully.",
                timestamp=now - timedelta(days=5),
            ),
            AuditEvent(
                action=AuditAction.EVALUATOR_ASSIGNED,
                entity_type="proposal",
                entity_id=p1.id,
                actor_id="user-gov-01",
                actor_name="Rajesh Kumar",
                actor_role="GOVERNMENT_OFFICER",
                summary="Assigned Dr. Anand Mehta as domain technical evaluator.",
                timestamp=now - timedelta(days=3),
            ),
            AuditEvent(
                action=AuditAction.EVALUATION_SUBMITTED,
                entity_type="proposal",
                entity_id=p1.id,
                actor_id="user-evaluator-01",
                actor_name="Dr. Anand Mehta",
                actor_role="EVALUATOR",
                summary="Human evaluation completed with weighted score 88.5%.",
                timestamp=now - timedelta(days=2),
            ),
        ]
        for ev in events:
            db.add(ev)

    # ── Seed Demo Pilots ────────────────────────────────────────────────────
    if not db.query(Pilot).filter(Pilot.id == "pilot-road-01").first():
        # Clean up any orphaned child records from previous partial seeds
        db.query(KPIMeasurement).filter(KPIMeasurement.pilot_kpi_id.in_(["pkpi-01-1", "pkpi-01-2", "pkpi-01-3", "pkpi-01-4"])).delete(synchronize_session=False)
        db.query(PilotKPI).filter(PilotKPI.pilot_id == "pilot-road-01").delete(synchronize_session=False)
        db.query(PilotMilestone).filter(PilotMilestone.pilot_id == "pilot-road-01").delete(synchronize_session=False)
        db.query(PilotRisk).filter(PilotRisk.pilot_id == "pilot-road-01").delete(synchronize_session=False)
        db.query(PilotIssue).filter(PilotIssue.pilot_id == "pilot-road-01").delete(synchronize_session=False)
        db.query(PilotEvidence).filter(PilotEvidence.pilot_id == "pilot-road-01").delete(synchronize_session=False)

        p1_prop = db.query(Proposal).filter(Proposal.id == "prop-demo-01").first()
        if p1_prop:
            p1_prop.status = ProposalStatus.SHORTLISTED

        pilot1 = Pilot(
            id="pilot-road-01",
            proposal_id="prop-demo-01",
            challenge_id="ch-road-01",
            startup_id="st-01",
            name="RoadSense AI Pothole & Road Anomaly Detection Pilot",
            objective="Deploy edge computer vision AI across 50 municipal survey vehicles to map potholes, calculate severity, and automate maintenance dispatch for MoHUA.",
            scope="50 municipal vehicles, 500 km road network in Ward 4 & 7. Real-time GIS heatmap generation and automated PWD work-order queue integration.",
            success_criteria="Achieve ≥90% detection accuracy, ≤5% false positives, ≤30s processing latency, and cover at least 500 km of road network.",
            government_owner_id="user-gov-01",
            government_team_notes="Primary focus is validating accuracy during heavy rainfall and ensuring smooth API handoff to municipal PWD systems.",
            startup_team_notes="Camera hardware deployed on 50 vehicles. Local edge buffer active for offline sync.",
            evaluator_notes="Mid-term review confirmed impressive detection accuracy. PWD integration in progress.",
            data_access_notes="Granted restricted read API access to municipal GIS basemaps.",
            security_requirements="CERT-In compliant, zero biometric storage, edge facial & license plate blurring.",
            ip_notes="Startup retains proprietary edge AI weight model; MoHUA retains all road condition spatial datasets.",
            start_date=now - timedelta(days=30),
            end_date=now + timedelta(days=60),
            status=PilotStatus.READY_FOR_ASSESSMENT,
            overall_progress_percentage=90.0,
            ready_for_assessment_at=now - timedelta(days=1),
            created_at=now - timedelta(days=30),
            updated_at=now - timedelta(days=1),
        )
        db.add(pilot1)
        db.flush()

        # Milestones
        m1 = PilotMilestone(
            id="pm-01-1",
            pilot_id=pilot1.id,
            name="Hardware Installation & Edge Flashing",
            description="Mount dashcam hardware and flash TensorRT model on 50 municipal vehicles.",
            planned_start=now - timedelta(days=30),
            planned_end=now - timedelta(days=15),
            status=MilestoneStatus.COMPLETED,
            completion_percentage=100.0,
            completed_at=now - timedelta(days=14),
        )
        m2 = PilotMilestone(
            id="pm-01-2",
            pilot_id=pilot1.id,
            name="Model Calibration & Edge-to-Cloud Pipeline",
            description="Calibrate CV model for local asphalt variations and configure real-time telemetry.",
            planned_start=now - timedelta(days=15),
            planned_end=now,
            status=MilestoneStatus.COMPLETED,
            completion_percentage=100.0,
            completed_at=now - timedelta(days=3),
        )
        m3 = PilotMilestone(
            id="pm-01-3",
            pilot_id=pilot1.id,
            name="Municipal GIS & PWD Dispatch System Integration",
            description="Integrate automated work-order generation with municipal PWD backend.",
            planned_start=now - timedelta(days=10),
            planned_end=now - timedelta(days=1),
            status=MilestoneStatus.COMPLETED,
            completion_percentage=100.0,
            completed_at=now - timedelta(days=1),
        )
        m4 = PilotMilestone(
            id="pm-01-4",
            pilot_id=pilot1.id,
            name="Citywide Field Trial & Accuracy Validation",
            description="Final audit of system performance across 500 km network.",
            planned_start=now - timedelta(days=5),
            planned_end=now + timedelta(days=30),
            status=MilestoneStatus.IN_PROGRESS,
            completion_percentage=60.0,
        )
        for m in [m1, m2, m3, m4]:
            if not db.query(PilotMilestone).filter(PilotMilestone.id == m.id).first():
                db.add(m)

        # KPIs
        k1 = PilotKPI(
            id="pkpi-01-1",
            pilot_id=pilot1.id,
            name="Detection Accuracy",
            description="Percentage of correctly identified road defects.",
            target_value=90.0,
            target_operator=TargetOperator.GREATER_EQUAL,
            unit="%",
            measurement_method="Weekly random sample audit by PWD engineering team.",
            frequency="Weekly",
            weight=0.3,
            status=KPIStatus.ACHIEVED,
            latest_actual_value=92.4,
            latest_measurement_date=now - timedelta(days=2),
            target_change_history=[],
        )
        k2 = PilotKPI(
            id="pkpi-01-2",
            pilot_id=pilot1.id,
            name="False Positive Rate",
            description="Percentage of false damage alerts.",
            target_value=5.0,
            target_operator=TargetOperator.LESS_EQUAL,
            unit="%",
            measurement_method="Manual validation of flag samples.",
            frequency="Weekly",
            weight=0.2,
            status=KPIStatus.ACHIEVED,
            latest_actual_value=4.1,
            latest_measurement_date=now - timedelta(days=2),
            target_change_history=[],
        )
        k3 = PilotKPI(
            id="pkpi-01-3",
            pilot_id=pilot1.id,
            name="Processing Latency",
            description="Time taken from edge capture to dashboard map update.",
            target_value=30.0,
            target_operator=TargetOperator.LESS_EQUAL,
            unit="seconds",
            measurement_method="Automated server timestamp delta.",
            frequency="Weekly",
            weight=0.2,
            status=KPIStatus.ACHIEVED,
            latest_actual_value=24.0,
            latest_measurement_date=now - timedelta(days=2),
            target_change_history=[],
        )
        k4 = PilotKPI(
            id="pkpi-01-4",
            pilot_id=pilot1.id,
            name="Coverage Network",
            description="Total kilometers of unique road scanned.",
            target_value=500.0,
            target_operator=TargetOperator.GREATER_EQUAL,
            unit="km",
            measurement_method="GIS vehicle track log deduplication.",
            frequency="Weekly",
            weight=0.3,
            status=KPIStatus.ACHIEVED,
            latest_actual_value=512.0,
            latest_measurement_date=now - timedelta(days=2),
            target_change_history=[],
        )
        for k in [k1, k2, k3, k4]:
            if not db.query(PilotKPI).filter(PilotKPI.id == k.id).first():
                db.add(k)
        db.flush()

        # Historical KPI Measurements (for Recharts trend lines)
        measurements_data = [
            # K1 Detection Accuracy
            (k1.id, now - timedelta(days=28), 82.0, "Initial baseline week 1"),
            (k1.id, now - timedelta(days=21), 86.5, "After optical calibration"),
            (k1.id, now - timedelta(days=14), 89.2, "Model re-weights applied"),
            (k1.id, now - timedelta(days=7), 91.5, "Exceeded target threshold"),
            (k1.id, now - timedelta(days=2), 92.4, "Current weekly audit score"),
            # K2 False Positive Rate
            (k2.id, now - timedelta(days=28), 8.5, "Baseline initial test"),
            (k2.id, now - timedelta(days=21), 6.2, "Shadow filter added"),
            (k2.id, now - timedelta(days=14), 4.8, "Achieved target"),
            (k2.id, now - timedelta(days=7), 4.3, "Continued improvement"),
            (k2.id, now - timedelta(days=2), 4.1, "Current score"),
            # K3 Latency
            (k3.id, now - timedelta(days=28), 45.0, "Unoptimized cloud post"),
            (k3.id, now - timedelta(days=21), 38.0, "Compressed payload"),
            (k3.id, now - timedelta(days=14), 28.0, "Met target"),
            (k3.id, now - timedelta(days=7), 25.0, "Fast API caching"),
            (k3.id, now - timedelta(days=2), 24.0, "Latest benchmark"),
            # K4 Coverage
            (k4.id, now - timedelta(days=28), 120.0, "Ward 4 initial fleet"),
            (k4.id, now - timedelta(days=21), 280.0, "Expanded to Ward 7"),
            (k4.id, now - timedelta(days=14), 410.0, "Additional vehicles onboarded"),
            (k4.id, now - timedelta(days=7), 465.0, "Approaching target"),
            (k4.id, now - timedelta(days=2), 512.0, "512 of 500 km scanned - Target Exceeded"),
        ]
        if db.query(KPIMeasurement).count() == 0:
            for k_id, date_val, val, notes in measurements_data:
                db.add(
                    KPIMeasurement(
                        pilot_kpi_id=k_id,
                        measurement_date=date_val,
                        actual_value=val,
                        notes=notes,
                        recorded_by_id="user-gov-01",
                        recorded_by_name="Rajesh Kumar",
                    )
                )

        # Risks
        if db.query(PilotRisk).count() == 0:
            r1 = PilotRisk(
                pilot_id=pilot1.id,
                title="Monsoon Lens Smudging",
                description="Heavy rain smudges optical camera lens, degrading image clarity.",
                category=RiskCategory.TECHNICAL,
                severity=RiskSeverity.MEDIUM,
                probability="Medium",
                mitigation="Applied hydrophobic nano-coating to lens covers and added automated blur filter.",
                owner_name="Priya Sharma",
                status=RiskStatus.OPEN,
            )
            db.add(r1)

        # Issues
        if db.query(PilotIssue).count() == 0:
            i1 = PilotIssue(
                pilot_id=pilot1.id,
                title="PWD Dispatch API Latency",
                description="Intermittent API response timeouts during peak morning dispatch hours.",
                severity=RiskSeverity.LOW,
                reported_date=now - timedelta(days=5),
                assigned_to_name="Rajesh Kumar",
                status=IssueStatus.IN_PROGRESS,
                resolution="Configured exponential backoff retry policy.",
            )
            db.add(i1)

        # Evidence
        if db.query(PilotEvidence).count() == 0:
            e1 = PilotEvidence(
                pilot_id=pilot1.id,
                file_name="RoadSense_Phase1_Calibration_Report.pdf",
                storage_key="pilots/pilot-road-01/calibration_report.pdf",
                file_type="application/pdf",
                file_size=1240000,
                description="Phase 1 optical calibration and vehicle mounting audit certificate.",
                uploaded_by_id="user-startup-01",
                uploaded_by_name="Priya Sharma",
                uploaded_at=now - timedelta(days=14),
            )
            db.add(e1)

    # ── Scenario 1 (SCALE Branch) — AquaSens Real-Time Water Quality IoT ───
    if not db.query(Pilot).filter(Pilot.id == "pilot-water-scale").first():
        # 1. Proposal for Water Quality Challenge
        prop_water = Proposal(
            id="prop-water-scale-01",
            challenge_id="ch-water-01",
            startup_id="st-03",
            title="AquaMetric Solar IoT Water Quality Telemetry Network",
            executive_summary="Continuous IoT multi-parameter telemetry with acoustic pipe leak detection across municipal distribution networks.",
            estimated_cost=4200000.0,
            implementation_duration_days=110,
            contact_name="AquaMetric Lead",
            contact_email="contact@aquametric.example.in",
            status=ProposalStatus.SHORTLISTED,
            shortlist_reason="Top telemetry sensor reliability (99.4% uptime) and proven municipal urban water deployment.",
            shortlisted_at=now - timedelta(days=60),
            shortlisted_by="user-gov-01",
            submitted_at=now - timedelta(days=65),
        )
        db.add(prop_water)
        db.flush()

        # 2. Pilot in SCALED status
        pilot_scale = Pilot(
            id="pilot-water-scale",
            proposal_id=prop_water.id,
            challenge_id="ch-water-01",
            startup_id="st-03",
            name="AquaMetric Real-Time Water Quality IoT Pilot",
            objective="Deploy and test 50 solar-powered water quality telemetry nodes across municipal distribution lines.",
            scope="50 sensor stations across 35 km water feeder network in Central District.",
            success_criteria="Sensor uptime >= 99%, alert delivery < 5 min, correlation with lab testing >= 95%.",
            government_owner_id="user-gov-01",
            government_team_notes="All 50 stations tested successfully with zero critical hardware failures during monsoon phase.",
            start_date=now - timedelta(days=60),
            end_date=now - timedelta(days=5),
            status=PilotStatus.SCALED,
            overall_progress_percentage=100.0,
            completed_at=now - timedelta(days=5),
            ready_for_assessment_at=now - timedelta(days=5),
        )
        db.add(pilot_scale)
        db.flush()

        # Milestones
        m_scale_1 = PilotMilestone(
            id="pm-water-1", pilot_id=pilot_scale.id,
            name="Sensor Fabrication & Station Deployment",
            description="50 solar IoT stations installed at municipal reservoirs and feeder pipes.",
            planned_start=now - timedelta(days=60), planned_end=now - timedelta(days=40),
            status=MilestoneStatus.COMPLETED, completion_percentage=100.0, completed_at=now - timedelta(days=41),
        )
        m_scale_2 = PilotMilestone(
            id="pm-water-2", pilot_id=pilot_scale.id,
            name="Cloud Telemetry & SCADA Protocol Integration",
            description="Secure telemetry data streams to state municipal water dashboard.",
            planned_start=now - timedelta(days=40), planned_end=now - timedelta(days=20),
            status=MilestoneStatus.COMPLETED, completion_percentage=100.0, completed_at=now - timedelta(days=21),
        )
        m_scale_3 = PilotMilestone(
            id="pm-water-3", pilot_id=pilot_scale.id,
            name="Contaminant Spike Simulation & Field Accuracy Audit",
            description="Blind lab water sampling comparison and automated breach alert tests.",
            planned_start=now - timedelta(days=20), planned_end=now - timedelta(days=5),
            status=MilestoneStatus.COMPLETED, completion_percentage=100.0, completed_at=now - timedelta(days=5),
        )
        db.add_all([m_scale_1, m_scale_2, m_scale_3])

        # KPIs
        k_w1 = PilotKPI(
            id="pkpi-w-1", pilot_id=pilot_scale.id, name="Sensor Telemetry Uptime",
            description="Continuous data transmission without packet drops",
            target_value=99.0, target_operator=TargetOperator.GREATER_EQUAL, unit="%",
            measurement_method="Server ping log audit", frequency="Daily", weight=0.35,
            status=KPIStatus.ACHIEVED, latest_actual_value=99.4, latest_measurement_date=now - timedelta(days=6),
            target_change_history=[],
        )
        k_w2 = PilotKPI(
            id="pkpi-w-2", pilot_id=pilot_scale.id, name="Contaminant Alert Latency",
            description="Time from threshold breach detection to SMS/API notification",
            target_value=5.0, target_operator=TargetOperator.LESS_EQUAL, unit="minutes",
            measurement_method="Automated trigger telemetry audit", frequency="Weekly", weight=0.35,
            status=KPIStatus.ACHIEVED, latest_actual_value=3.8, latest_measurement_date=now - timedelta(days=6),
            target_change_history=[],
        )
        k_w3 = PilotKPI(
            id="pkpi-w-3", pilot_id=pilot_scale.id, name="Lab Correlation Accuracy",
            description="Correlation of automated pH/turbidity with accredited lab chemical tests",
            target_value=95.0, target_operator=TargetOperator.GREATER_EQUAL, unit="%",
            measurement_method="Independent third-party laboratory sample verification", frequency="Bi-Weekly", weight=0.3,
            status=KPIStatus.ACHIEVED, latest_actual_value=96.2, latest_measurement_date=now - timedelta(days=6),
            target_change_history=[],
        )
        db.add_all([k_w1, k_w2, k_w3])

        # Procurement Decision (SCALE)
        dec_scale = ProcurementDecision(
            id="dec-water-scale-01",
            pilot_id=pilot_scale.id,
            challenge_id="ch-water-01",
            startup_id="st-03",
            decision=DecisionType.SCALE,
            ai_recommendation=DecisionType.SCALE,
            ai_score=95.2,
            ai_confidence=94.0,
            justification="Exceptional telemetry performance across all 50 testing stations. All KPIs achieved or exceeded. Recommended for state-wide public procurement scale-up.",
            decided_by="user-gov-01",
            decided_at=now - timedelta(days=4),
            assessment_snapshot={
                "overall_score": 95.2,
                "recommendation": "SCALE",
                "confidence": 94.0,
                "kpi_performance": 98.5,
                "milestone_performance": 100.0,
                "risk_level": "LOW",
                "strengths": ["All 3 KPIs achieved", "100% milestone completion", "High lab correlation (96.2%)"],
                "concerns": [],
            },
        )
        db.add(dec_scale)
        db.flush()

        # Procurement Scale-Up Record
        scale_up = ProcurementScaleUp(
            id="scale-water-01",
            pilot_id=pilot_scale.id,
            decision_id=dec_scale.id,
            challenge_id="ch-water-01",
            startup_id="st-03",
            department_id="dept-mohua",
            solution_name="AquaMetric Real-Time Water Quality IoT Monitoring Network",
            pilot_outcome_summary="Pilot successfully validated with 95.2/100 score. 99.4% sensor uptime and 3.8 min alert response.",
            approved_kpis=[
                {"name": "Sensor Telemetry Uptime", "target": ">= 99.0 %", "achieved": "99.4 %", "status": "ACHIEVED", "weight": 0.35},
                {"name": "Contaminant Alert Latency", "target": "<= 5.0 minutes", "achieved": "3.8 minutes", "status": "ACHIEVED", "weight": 0.35},
                {"name": "Lab Correlation Accuracy", "target": ">= 95.0 %", "achieved": "96.2 %", "status": "ACHIEVED", "weight": 0.3},
            ],
            proposed_scale_scope="Department-wide deployment across 2,500 municipal water distribution feeder lines covering 12 urban districts.",
            status=ScaleUpStatus.READY_FOR_PROCUREMENT,
            budget_allocation=18500000.0,
            target_completion_date=now + timedelta(days=180),
            procurement_notes="GeM Category onboarding initiated under Rule 149 of GFR 2017 for verified innovative startup solutions.",
        )
        db.add(scale_up)

        # Audit Events
        db.add_all([
            AuditEvent(
                action=AuditAction.PILOT_CREATED, entity_type="pilot", entity_id=pilot_scale.id,
                actor_id="user-gov-01", actor_name="Rajesh Kumar", actor_role="GOVERNMENT_OFFICER",
                summary="Created Pilot project 'AquaMetric Real-Time Water Quality IoT Pilot'.", timestamp=now - timedelta(days=60),
            ),
            AuditEvent(
                action=AuditAction.PILOT_COMPLETED, entity_type="pilot", entity_id=pilot_scale.id,
                actor_id="user-gov-01", actor_name="Rajesh Kumar", actor_role="GOVERNMENT_OFFICER",
                summary="Pilot marked COMPLETED with 100% milestone progress.", timestamp=now - timedelta(days=5),
            ),
            AuditEvent(
                action=AuditAction.DECISION_CREATED, entity_type="decision", entity_id=dec_scale.id,
                actor_id="user-gov-01", actor_name="Rajesh Kumar", actor_role="GOVERNMENT_OFFICER",
                summary="Government Officer approved SCALE decision. Solution transitioned to Public Procurement.",
                timestamp=now - timedelta(days=4),
            ),
            AuditEvent(
                action=AuditAction.SCALE_UP_CREATED, entity_type="scale_up", entity_id=scale_up.id,
                actor_id="user-gov-01", actor_name="Rajesh Kumar", actor_role="GOVERNMENT_OFFICER",
                summary="Scale-up procurement workflow record initiated for AquaMetric.", timestamp=now - timedelta(days=4),
            ),
        ])

    # ── Scenario 2 (EXTEND Branch) — CivicPulse Healthcare OPD Queue AI ────
    if not db.query(Pilot).filter(Pilot.id == "pilot-health-extend").first():
        prop_health = Proposal(
            id="prop-health-extend-01",
            challenge_id="ch-health-01",
            startup_id="st-06",
            title="CivicPulse Multilingual OPD Patient Triage & Dynamic Queue AI",
            executive_summary="AI queue prediction and patient flow management in district civil hospitals.",
            estimated_cost=2800000.0,
            implementation_duration_days=90,
            contact_name="CivicPulse Healthcare Lead",
            contact_email="contact@civicpulse.example.in",
            status=ProposalStatus.SHORTLISTED,
            shortlist_reason="Promising multi-lingual Indic triage engine and proven high-volume helpline deployment.",
            shortlisted_at=now - timedelta(days=45),
            shortlisted_by="user-gov-01",
            submitted_at=now - timedelta(days=50),
        )
        db.add(prop_health)
        db.flush()

        pilot_extend = Pilot(
            id="pilot-health-extend",
            proposal_id=prop_health.id,
            challenge_id="ch-health-01",
            startup_id="st-06",
            name="District Hospital Automated OPD Queue Management Pilot",
            objective="Test dynamic OPD queue scheduling and reduce patient waiting times at District Civil Hospital.",
            scope="General Medicine, Orthopedics, and Pediatrics OPD wings serving ~1,200 daily patients.",
            success_criteria="Average wait time reduction >= 30%, doctor utilization rate >= 85%.",
            government_owner_id="user-gov-01",
            government_team_notes="Initial 45-day trial reduced wait times significantly in General Medicine, but doctor shift integration requires extended validation across specialty wings.",
            start_date=now - timedelta(days=45),
            end_date=now + timedelta(days=45),
            status=PilotStatus.EXTENDED,
            overall_progress_percentage=75.0,
        )
        db.add(pilot_extend)
        db.flush()

        # KPIs
        k_h1 = PilotKPI(
            id="pkpi-h-1", pilot_id=pilot_extend.id, name="Average Wait Time Reduction",
            description="Reduction in average patient wait time from token issuance to doctor consultation",
            target_value=30.0, target_operator=TargetOperator.GREATER_EQUAL, unit="%",
            measurement_method="Hospital token system automated time delta log", frequency="Weekly", weight=0.5,
            status=KPIStatus.ACHIEVED, latest_actual_value=33.5, latest_measurement_date=now - timedelta(days=3),
            target_change_history=[],
        )
        k_h2 = PilotKPI(
            id="pkpi-h-2", pilot_id=pilot_extend.id, name="Doctor OPD Utilization Rate",
            description="Optimal doctor consultation hours scheduled vs idle transition time",
            target_value=85.0, target_operator=TargetOperator.GREATER_EQUAL, unit="%",
            measurement_method="HMIS system doctor login & consultation log audit", frequency="Weekly", weight=0.5,
            status=KPIStatus.BELOW_TARGET, latest_actual_value=78.0, latest_measurement_date=now - timedelta(days=3),
            target_change_history=[],
        )
        db.add_all([k_h1, k_h2])

        # Procurement Decision (EXTEND)
        dec_extend = ProcurementDecision(
            id="dec-health-extend-01",
            pilot_id=pilot_extend.id,
            challenge_id="ch-health-01",
            startup_id="st-06",
            decision=DecisionType.EXTEND,
            ai_recommendation=DecisionType.EXTEND,
            ai_score=78.5,
            ai_confidence=88.0,
            justification="Solution achieves 33.5% wait time reduction but doctor utilization (78%) requires 45 additional days to calibrate specialty department rosters.",
            extension_duration=45,
            extension_reason="Extend pilot duration by 45 days to complete OPD doctor scheduling integration across additional 3 department wings.",
            decided_by="user-gov-01",
            decided_at=now - timedelta(days=2),
            assessment_snapshot={
                "overall_score": 78.5,
                "recommendation": "EXTEND",
                "confidence": 88.0,
                "kpi_performance": 78.0,
                "milestone_performance": 75.0,
                "risk_level": "MEDIUM",
                "strengths": ["Patient wait time reduced by 33.5%", "Positive patient feedback"],
                "concerns": ["Doctor utilization currently below 85% benchmark"],
            },
        )
        db.add(dec_extend)
        db.flush()

        db.add(
            AuditEvent(
                action=AuditAction.PILOT_EXTENDED, entity_type="pilot", entity_id=pilot_extend.id,
                actor_id="user-gov-01", actor_name="Rajesh Kumar", actor_role="GOVERNMENT_OFFICER",
                summary="Pilot extended by 45 days for additional doctor roster calibration.",
                timestamp=now - timedelta(days=2),
                details={"extension_duration": 45, "decision_id": dec_extend.id},
            )
        )

    # ── Scenario 3 (REJECT Branch) — Drone LiDAR Cadastral Survey ──────────
    if not db.query(Pilot).filter(Pilot.id == "pilot-land-reject").first():
        prop_land = Proposal(
            id="prop-land-reject-01",
            challenge_id="ch-road-01",
            startup_id="st-05",
            title="InfraSight Aerial Drone Photogrammetry Pavement Profiler",
            executive_summary="High-altitude drone survey for automated road crack depth analysis.",
            estimated_cost=3600000.0,
            implementation_duration_days=60,
            contact_name="InfraSight Lead",
            contact_email="contact@infrasight.example.in",
            status=ProposalStatus.SHORTLISTED,
            shortlist_reason="Selected for exploratory trial on drone aerial photogrammetry feasibility.",
            shortlisted_at=now - timedelta(days=40),
            shortlisted_by="user-gov-01",
            submitted_at=now - timedelta(days=45),
        )
        db.add(prop_land)
        db.flush()

        pilot_reject = Pilot(
            id="pilot-land-reject",
            proposal_id=prop_land.id,
            challenge_id="ch-road-01",
            startup_id="st-05",
            name="Aerial Drone High-Altitude Road Damage Profiling Pilot",
            objective="Evaluate whether high-altitude drone photogrammetry can replace vehicle-mounted road cameras.",
            scope="Trial across 80 km rural and urban highway sectors.",
            success_criteria="Micro-crack depth measurement accuracy >= 90%, all-weather flight reliability.",
            government_owner_id="user-gov-01",
            government_team_notes="High wind and roadside tree canopy obstructed aerial camera resolution, failing accuracy threshold.",
            start_date=now - timedelta(days=40),
            end_date=now - timedelta(days=10),
            status=PilotStatus.CLOSED,
            overall_progress_percentage=40.0,
            completed_at=now - timedelta(days=10),
        )
        db.add(pilot_reject)
        db.flush()

        k_r1 = PilotKPI(
            id="pkpi-r-1", pilot_id=pilot_reject.id, name="Micro-Crack Depth Accuracy",
            description="Accuracy of depth measurement from aerial imagery compared with ground calipers",
            target_value=90.0, target_operator=TargetOperator.GREATER_EQUAL, unit="%",
            measurement_method="Ground truth physical caliper comparison", frequency="Weekly", weight=0.6,
            status=KPIStatus.BELOW_TARGET, latest_actual_value=51.2, latest_measurement_date=now - timedelta(days=12),
            target_change_history=[],
        )
        db.add(k_r1)

        # Procurement Decision (REJECT)
        dec_reject = ProcurementDecision(
            id="dec-land-reject-01",
            pilot_id=pilot_reject.id,
            challenge_id="ch-road-01",
            startup_id="st-05",
            decision=DecisionType.REJECT,
            ai_recommendation=DecisionType.REJECT,
            ai_score=52.0,
            ai_confidence=91.0,
            rejection_reason="Aerial photogrammetry depth accuracy (51.2%) failed to achieve the statutory 90% accuracy threshold under tree canopy and variable weather conditions.",
            justification="The technology is not viable as an operational replacement for ground survey vehicles in public procurement.",
            decided_by="user-gov-01",
            decided_at=now - timedelta(days=8),
            assessment_snapshot={
                "overall_score": 52.0,
                "recommendation": "REJECT",
                "confidence": 91.0,
                "kpi_performance": 51.2,
                "milestone_performance": 40.0,
                "risk_level": "CRITICAL",
                "strengths": ["Rapid area coverage"],
                "concerns": ["Unacceptable error margin in crack depth detection", "Weather and canopy vulnerability"],
            },
        )
        db.add(dec_reject)
        db.flush()

        db.add(
            AuditEvent(
                action=AuditAction.PILOT_CLOSED, entity_type="pilot", entity_id=pilot_reject.id,
                actor_id="user-gov-01", actor_name="Rajesh Kumar", actor_role="GOVERNMENT_OFFICER",
                summary="Pilot closed following REJECT procurement decision.",
                timestamp=now - timedelta(days=8),
                details={"rejection_reason": dec_reject.rejection_reason},
            )
        )

    # ── Seed Default System Settings ──────────────────────────────────────────
    if db.query(SystemSetting).count() == 0:
        settings_to_seed = [
            SystemSetting(
                id="set-matching-weights",
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
                description="Relative weights used by the multi-criteria startup ranking engine.",
            ),
            SystemSetting(
                id="set-eligibility-criteria",
                key="eligibility.criteria",
                value={
                    "dpiit_required": True,
                    "max_age_years": 10,
                    "max_turnover_cr": 100,
                    "min_incorporation_status": "ACTIVE",
                },
                value_type=SettingValueType.JSON.value,
                category=SettingCategory.ELIGIBILITY.value,
                label="Statutory Startup Eligibility Criteria",
                description="Government rules governing startup eligibility under DPIIT gazette guidelines.",
            ),
            SystemSetting(
                id="set-pilot-defaults",
                key="pilot.defaults",
                value={
                    "default_duration_days": 90,
                    "min_kpis_required": 2,
                    "max_budget_lakhs": 25,
                    "allow_auto_assessment": True,
                },
                value_type=SettingValueType.JSON.value,
                category=SettingCategory.PILOT.value,
                label="Pilot Project Operational Defaults",
                description="Default duration, budget thresholds, and telemetry requirements for startup pilots.",
            ),
            SystemSetting(
                id="set-general-platform",
                key="general.platform_name",
                value="AI-Powered Government Innovation Procurement Platform",
                value_type=SettingValueType.STRING.value,
                category=SettingCategory.GENERAL.value,
                label="Platform Official Title",
                description="Branding and portal header title across all government notices.",
            ),
        ]
        for s in settings_to_seed:
            db.add(s)
        db.flush()

    # ── Seed Demo Innovation Memories ─────────────────────────────────────────
    if db.query(InnovationMemory).count() == 0:
        memories_to_seed = [
            InnovationMemory(
                id="mem-road-scale-01",
                source_type=MemorySourceType.PILOT.value,
                source_id="pilot-road-01",
                title="Autonomous Pothole Detection and Road Quality Telemetry Pilot",
                summary="AI computer vision deployed on municipal inspection vehicles achieved 94.2% defect detection accuracy and reduced road maintenance identification cycle by 62%. Recommended and approved for full department-wide procurement scale-up.",
                domain="Smart Infrastructure & Transportation",
                technology="Computer Vision, Edge AI, IoT Telemetry",
                challenge_area="Automated Road Asset Management",
                outcome=MemoryOutcome.SCALE.value,
                key_metrics={
                    "defect_accuracy": "94.2%",
                    "cycle_reduction": "62%",
                    "latency": "220ms",
                    "pilot_duration": "90 days",
                },
                lessons_learned=[
                    "Edge compute inference on municipal vehicles eliminates cellular bandwidth dependency in poor connectivity sectors.",
                    "Nighttime road scanning requires dedicated infrared illumination rigs to maintain defect classification accuracy.",
                    "Integration with existing GIS municipal work-order databases was critical for rapid maintenance crew dispatch.",
                ],
                success_factors=[
                    "High operational accuracy meeting the statutory 85% requirement.",
                    "Sub-second alert turnaround to central dashboard.",
                    "Strong startup engineering responsiveness during field trials.",
                ],
                failure_factors=[],
                recommendations=[
                    "Scale to all zonal divisions with standardized vibration-damped vehicle mounting brackets.",
                    "Establish automated daily model calibration checkpoints against high-contrast test strips.",
                ],
                startup_id="st-01",
                startup_name="NeuralRoad Technologies Pvt Ltd",
                challenge_id="ch-road-01",
                pilot_id="pilot-road-01",
                decision_id="dec-road-scale-01",
                created_by="user-gov-01",
            ),
            InnovationMemory(
                id="mem-border-extend-01",
                source_type=MemorySourceType.PILOT.value,
                source_id="pilot-border-01",
                title="Foliage-Penetrating Multi-Sensor Border Surveillance Pilot",
                summary="Thermal and seismic fusion system demonstrated 91% detection in clear conditions, but dense monsoon foliage induced a 14% false-alarm rate. Granted a 60-day operational extension to optimize false-alarm suppression filters under active rainfall.",
                domain="Defence & Border Security",
                technology="Sensor Fusion, Seismic Sensing, Thermal Imaging",
                challenge_area="Tactical Perimeter Monitoring",
                outcome=MemoryOutcome.EXTEND.value,
                key_metrics={
                    "detection_rate": "91.0%",
                    "false_alarm_rate": "14.2%",
                    "battery_endurance": "48 hours",
                },
                lessons_learned=[
                    "Seismic sensor sensitivity thresholds must dynamically adapt to seasonal rainfall ground saturation levels.",
                    "Heavy animal crossings require micro-Doppler radar feature extraction to differentiate human strides from quadrupeds.",
                ],
                success_factors=[
                    "Zero failure in communication uplink over tactical encrypted radio.",
                    "Ruggedized enclosure withstood continuous extreme weather immersion.",
                ],
                failure_factors=[
                    "False alarm rate exceeded statutory 5% ceiling during heavy rain squalls.",
                ],
                recommendations=[
                    "Deploy adaptive Doppler acoustic validation layer during the 60-day extension.",
                    "Evaluate edge retraining using local monsoon audio signatures before final scale-up review.",
                ],
                startup_id="st-04",
                startup_name="Kavach Sensor Systems Pvt Ltd",
                challenge_id="ch-border-01",
                pilot_id="pilot-border-01",
                decision_id="dec-border-ext-01",
                created_by="user-gov-01",
            ),
            InnovationMemory(
                id="mem-land-reject-01",
                source_type=MemorySourceType.PILOT.value,
                source_id="pilot-reject-01",
                title="Aerial Drone Photogrammetry for Sub-Surface Pothole Depth Estimation",
                summary="High-altitude aerial photogrammetry achieved rapid survey coverage but delivered only 51.2% depth measurement accuracy against ground caliper benchmarks. Rejected for public procurement as unviable for structural road certification.",
                domain="Smart Infrastructure & Transportation",
                technology="Drone Photogrammetry, LiDAR, Computer Vision",
                challenge_area="Automated Road Asset Management",
                outcome=MemoryOutcome.REJECT.value,
                key_metrics={
                    "depth_accuracy": "51.2%",
                    "coverage_rate": "120 km/day",
                    "error_margin": "±38mm",
                },
                lessons_learned=[
                    "Aerial photogrammetry at operational altitudes (>30m) cannot reliably resolve millimeter-scale pavement micro-fissure depth.",
                    "Tree canopies and overhead power lines obstruct visual lines of sight along 35% of urban arterial routes.",
                ],
                success_factors=[
                    "Rapid area visual coverage.",
                ],
                failure_factors=[
                    "Depth resolution error margin unacceptable for safety-critical asphalt resurfacing decisions.",
                    "Extreme susceptibility to lighting angles and shadows.",
                ],
                recommendations=[
                    "Future road quality challenges should mandate ground-level or mobile vehicular LiDAR rather than high-altitude aerial drones.",
                ],
                startup_id="st-05",
                startup_name="AeroSurvey Analytics Pvt Ltd",
                challenge_id="ch-road-01",
                pilot_id="pilot-reject-01",
                decision_id="dec-land-reject-01",
                created_by="user-gov-01",
            ),
        ]
        for m in memories_to_seed:
            db.add(m)
        db.flush()

    db.commit()
    logger.info(
        "Seeded %d departments, %d demo users, %d demo challenges, %d synthetic startups, proposals, and full SCALE/EXTEND/REJECT pilot scenarios.",
        len(DEMO_DEPARTMENTS),
        len(DEMO_USERS),
        4,
        len(DEMO_STARTUPS),
    )

