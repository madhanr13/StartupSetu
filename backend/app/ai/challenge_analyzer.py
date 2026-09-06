"""
AI Challenge Analyzer — structures unstructured problem descriptions
into a well-defined challenge format.

Ships with a MockChallengeAnalyzer for development.
A real LLM-backed implementation can be swapped in via config.
"""

import asyncio
import logging
from abc import ABC, abstractmethod

from app.core.config import settings
from app.schemas.challenge import (
    AIStructuredEvalCriterion,
    AIStructuredKPI,
    AIStructuredRequirement,
    AIStructureResponse,
)

logger = logging.getLogger(__name__)


class ChallengeAnalyzerInterface(ABC):
    """Abstract interface for AI challenge structuring."""

    @abstractmethod
    async def analyze(
        self, problem_statement: str, domain: str | None = None
    ) -> AIStructureResponse:
        """Analyze a problem statement and return structured challenge data."""
        ...


class MockChallengeAnalyzer(ChallengeAnalyzerInterface):
    """
    Mock analyzer that returns realistic structured data
    based on keyword matching. Simulates processing delay.
    """

    # Keyword → template mapping for domain detection
    _DOMAIN_TEMPLATES: dict[str, dict] = {
        "road": {
            "domain": "Infrastructure & Transport",
            "title": "AI-Based Road Infrastructure Monitoring & Maintenance Prioritization",
            "description": (
                "Deploy an intelligent system that uses computer vision and IoT sensors "
                "to detect road surface damage including potholes, cracks, and surface "
                "deterioration, then prioritize maintenance activities based on severity, "
                "traffic volume, and safety impact."
            ),
            "requirements": [
                AIStructuredRequirement(
                    description="Computer vision model capable of detecting road damage from vehicle-mounted camera imagery with ≥90% accuracy",
                    is_mandatory=True,
                ),
                AIStructuredRequirement(
                    description="Real-time geo-tagged damage reporting with GPS coordinates and severity classification",
                    is_mandatory=True,
                ),
                AIStructuredRequirement(
                    description="Integration with existing municipal GIS systems for overlay mapping",
                    is_mandatory=True,
                ),
                AIStructuredRequirement(
                    description="Mobile application for field inspection teams to verify and update damage reports",
                    is_mandatory=False,
                ),
                AIStructuredRequirement(
                    description="Dashboard for maintenance prioritization based on severity scoring algorithm",
                    is_mandatory=True,
                ),
            ],
            "kpis": [
                AIStructuredKPI(name="Detection Accuracy", description="Percentage of correctly identified road damage instances", target_value=90, unit="%", weight=0.3),
                AIStructuredKPI(name="False Positive Rate", description="Percentage of false damage detections", target_value=5, unit="%", weight=0.15),
                AIStructuredKPI(name="Processing Latency", description="Time from image capture to damage report generation", target_value=30, unit="seconds", weight=0.15),
                AIStructuredKPI(name="Coverage Area", description="Total road network coverage during pilot period", target_value=500, unit="km", weight=0.2),
                AIStructuredKPI(name="Maintenance Response Time", description="Reduction in average maintenance response time", target_value=40, unit="% reduction", weight=0.2),
            ],
            "evaluation_criteria": [
                AIStructuredEvalCriterion(name="Technical Approach", description="Quality and feasibility of the proposed technical architecture", weight=0.25, max_score=10),
                AIStructuredEvalCriterion(name="AI Model Performance", description="Demonstrated accuracy and robustness of detection models", weight=0.25, max_score=10),
                AIStructuredEvalCriterion(name="Scalability", description="Ability to scale across different road types and geographic regions", weight=0.15, max_score=10),
                AIStructuredEvalCriterion(name="Team Capability", description="Relevant experience and technical expertise of the team", weight=0.2, max_score=10),
                AIStructuredEvalCriterion(name="Cost Effectiveness", description="Value for money and operational cost projections", weight=0.15, max_score=10),
            ],
            "expected_outcomes": [
                "Automated detection of road surface damage with minimal manual inspection",
                "Prioritized maintenance scheduling based on data-driven severity assessment",
                "Reduced maintenance response time by at least 40%",
                "Comprehensive road condition database for infrastructure planning",
            ],
            "budget_min": 2500000,
            "budget_max": 5000000,
            "pilot_weeks": 12,
        },
        "water": {
            "domain": "Environmental Monitoring",
            "title": "Real-Time Water Quality Monitoring & Alert System",
            "description": (
                "Implement an IoT-based continuous water quality monitoring system that "
                "tracks key parameters across municipal water distribution networks and "
                "generates automated alerts when quality thresholds are breached."
            ),
            "requirements": [
                AIStructuredRequirement(description="IoT sensor network capable of monitoring pH, turbidity, dissolved oxygen, conductivity, and contaminant levels", is_mandatory=True),
                AIStructuredRequirement(description="Cloud-based data aggregation platform with real-time visualization dashboard", is_mandatory=True),
                AIStructuredRequirement(description="Automated alert system with SMS and email notifications for threshold breaches", is_mandatory=True),
                AIStructuredRequirement(description="Historical data analytics with trend prediction capabilities", is_mandatory=False),
                AIStructuredRequirement(description="API integration for feeding data into existing municipal water management systems", is_mandatory=True),
            ],
            "kpis": [
                AIStructuredKPI(name="Sensor Uptime", description="Percentage of time sensors are operational and transmitting data", target_value=99, unit="%", weight=0.25),
                AIStructuredKPI(name="Alert Latency", description="Time between quality breach and alert delivery", target_value=5, unit="minutes", weight=0.25),
                AIStructuredKPI(name="Measurement Accuracy", description="Correlation with laboratory reference measurements", target_value=95, unit="%", weight=0.25),
                AIStructuredKPI(name="Coverage Points", description="Number of monitoring stations deployed during pilot", target_value=50, unit="stations", weight=0.25),
            ],
            "evaluation_criteria": [
                AIStructuredEvalCriterion(name="Sensor Technology", description="Reliability and accuracy of IoT sensor hardware", weight=0.25, max_score=10),
                AIStructuredEvalCriterion(name="Platform Architecture", description="Scalability and reliability of the cloud platform", weight=0.2, max_score=10),
                AIStructuredEvalCriterion(name="Data Analytics", description="Quality of analytics, prediction, and visualization capabilities", weight=0.2, max_score=10),
                AIStructuredEvalCriterion(name="Deployment Feasibility", description="Ease of installation and maintenance in field conditions", weight=0.2, max_score=10),
                AIStructuredEvalCriterion(name="Cost Effectiveness", description="Total cost of ownership including hardware and operations", weight=0.15, max_score=10),
            ],
            "expected_outcomes": [
                "Continuous real-time monitoring of water quality across the distribution network",
                "Early detection of contamination events before reaching consumers",
                "Data-driven decision making for water treatment operations",
                "Compliance reporting automation for regulatory requirements",
            ],
            "budget_min": 3000000,
            "budget_max": 7000000,
            "pilot_weeks": 16,
        },
        "health": {
            "domain": "Healthcare & Public Health",
            "title": "AI-Powered Public Health Facility Queue & Resource Optimization",
            "description": (
                "Develop an intelligent queue management and resource allocation system "
                "for government hospitals and health centers that reduces patient wait "
                "times, optimizes doctor scheduling, and improves overall facility throughput."
            ),
            "requirements": [
                AIStructuredRequirement(description="Patient flow prediction model using historical visit patterns and seasonal trends", is_mandatory=True),
                AIStructuredRequirement(description="Dynamic queue management with estimated wait time display for patients", is_mandatory=True),
                AIStructuredRequirement(description="Doctor and resource scheduling optimization engine", is_mandatory=True),
                AIStructuredRequirement(description="Integration with existing Hospital Management Information Systems (HMIS)", is_mandatory=True),
                AIStructuredRequirement(description="Patient-facing mobile app or kiosk interface for check-in and status tracking", is_mandatory=False),
            ],
            "kpis": [
                AIStructuredKPI(name="Average Wait Time Reduction", description="Reduction in patient waiting time from registration to consultation", target_value=30, unit="% reduction", weight=0.3),
                AIStructuredKPI(name="Daily Throughput Increase", description="Increase in patients served per day", target_value=20, unit="% increase", weight=0.25),
                AIStructuredKPI(name="Schedule Optimization", description="Improvement in doctor utilization rate", target_value=85, unit="%", weight=0.2),
                AIStructuredKPI(name="Patient Satisfaction", description="Patient satisfaction score from post-visit surveys", target_value=4, unit="out of 5", weight=0.25),
            ],
            "evaluation_criteria": [
                AIStructuredEvalCriterion(name="Algorithm Quality", description="Effectiveness of prediction and optimization algorithms", weight=0.25, max_score=10),
                AIStructuredEvalCriterion(name="User Experience", description="Ease of use for both staff and patients", weight=0.2, max_score=10),
                AIStructuredEvalCriterion(name="Integration Capability", description="Ability to integrate with existing hospital systems", weight=0.2, max_score=10),
                AIStructuredEvalCriterion(name="Scalability", description="Ability to scale from single facility to district-wide deployment", weight=0.15, max_score=10),
                AIStructuredEvalCriterion(name="Team Experience", description="Track record in healthcare technology deployments", weight=0.2, max_score=10),
            ],
            "expected_outcomes": [
                "Significant reduction in OPD patient waiting times",
                "Optimized doctor and staff scheduling based on predicted demand",
                "Real-time facility occupancy and throughput visibility",
                "Improved patient satisfaction and reduced walk-away rates",
            ],
            "budget_min": 1500000,
            "budget_max": 4000000,
            "pilot_weeks": 10,
        },
    }

    # Default fallback template
    _DEFAULT_TEMPLATE: dict = {
        "domain": "Digital Governance",
        "title": "Digital Governance Solution",
        "description": (
            "Implement a technology-driven solution to improve efficiency, transparency, "
            "and citizen experience in government service delivery."
        ),
        "requirements": [
            AIStructuredRequirement(description="Secure, cloud-hosted platform meeting government IT security standards", is_mandatory=True),
            AIStructuredRequirement(description="Role-based access control with audit trail for all user actions", is_mandatory=True),
            AIStructuredRequirement(description="API-first architecture for integration with existing government systems", is_mandatory=True),
            AIStructuredRequirement(description="Mobile-responsive interface accessible on low-bandwidth connections", is_mandatory=False),
            AIStructuredRequirement(description="Comprehensive user training materials and administrator documentation", is_mandatory=False),
        ],
        "kpis": [
            AIStructuredKPI(name="Process Efficiency", description="Reduction in time to complete the target government process", target_value=50, unit="% reduction", weight=0.3),
            AIStructuredKPI(name="User Adoption", description="Percentage of target users actively using the system", target_value=80, unit="%", weight=0.25),
            AIStructuredKPI(name="System Availability", description="Platform uptime during operational hours", target_value=99.5, unit="%", weight=0.2),
            AIStructuredKPI(name="Citizen Satisfaction", description="End-user satisfaction rating", target_value=4, unit="out of 5", weight=0.25),
        ],
        "evaluation_criteria": [
            AIStructuredEvalCriterion(name="Technical Architecture", description="Quality and scalability of the proposed solution architecture", weight=0.25, max_score=10),
            AIStructuredEvalCriterion(name="Domain Expertise", description="Understanding of government processes and regulatory requirements", weight=0.2, max_score=10),
            AIStructuredEvalCriterion(name="Implementation Plan", description="Feasibility and clarity of the deployment roadmap", weight=0.2, max_score=10),
            AIStructuredEvalCriterion(name="Team Capability", description="Relevant experience and technical depth of the team", weight=0.2, max_score=10),
            AIStructuredEvalCriterion(name="Value for Money", description="Cost-effectiveness and ROI projections", weight=0.15, max_score=10),
        ],
        "expected_outcomes": [
            "Measurable improvement in government process efficiency",
            "Enhanced transparency and accountability through digital audit trails",
            "Improved citizen satisfaction with government services",
            "Scalable solution that can be replicated across departments",
        ],
        "budget_min": 2000000,
        "budget_max": 5000000,
        "pilot_weeks": 12,
    }

    def _detect_template(self, problem_statement: str) -> dict:
        """Select the best template based on keywords in the problem statement."""
        text = problem_statement.lower()
        for keyword, template in self._DOMAIN_TEMPLATES.items():
            if keyword in text:
                return template
        return self._DEFAULT_TEMPLATE

    async def analyze(
        self, problem_statement: str, domain: str | None = None
    ) -> AIStructureResponse:
        """Simulate AI analysis with a realistic delay."""
        logger.info("MockChallengeAnalyzer: analyzing problem statement (%d chars)", len(problem_statement))

        # Simulate processing time
        await asyncio.sleep(1.5)

        template = self._detect_template(problem_statement)

        # Use provided domain if given, else use template domain
        resolved_domain = domain if domain else template["domain"]

        return AIStructureResponse(
            title=template["title"],
            description=template["description"],
            domain=resolved_domain,
            requirements=template["requirements"],
            kpis=template["kpis"],
            evaluation_criteria=template["evaluation_criteria"],
            expected_outcomes=template["expected_outcomes"],
            suggested_budget_min=template["budget_min"],
            suggested_budget_max=template["budget_max"],
            suggested_pilot_duration_weeks=template["pilot_weeks"],
        )


# ── Factory ──────────────────────────────────────────────────────────────────


_analyzer_instance: ChallengeAnalyzerInterface | None = None


def get_challenge_analyzer() -> ChallengeAnalyzerInterface:
    """
    Return the configured challenge analyzer instance.
    In demo mode or when no LLM key is set, returns the mock analyzer.
    """
    global _analyzer_instance
    if _analyzer_instance is None:
        if settings.demo_mode or not settings.llm_api_key:
            logger.info("Using MockChallengeAnalyzer (demo mode)")
            _analyzer_instance = MockChallengeAnalyzer()
        else:
            # Future: instantiate real LLM-backed analyzer here
            logger.info("Using MockChallengeAnalyzer (no real analyzer configured)")
            _analyzer_instance = MockChallengeAnalyzer()
    return _analyzer_instance
