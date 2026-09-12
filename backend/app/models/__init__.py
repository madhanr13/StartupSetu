"""
Models package — re-exports all SQLAlchemy models and the declarative Base.
"""

from app.core.database import Base
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
from app.models.audit import AuditAction, AuditEvent
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

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Department",
    "Challenge",
    "ChallengeRequirement",
    "ChallengeKPI",
    "ChallengeEvaluationCriterion",
    "ChallengeStatus",
    "Startup",
    "StartupTechnology",
    "StartupDomain",
    "StartupProject",
    "StartupCertification",
    "StartupTeamCapability",
    "StartupDeployment",
    "StartupReadinessScore",
    "Proposal",
    "ProposalDocument",
    "ProposalAnalysis",
    "ProposalEvaluation",
    "ProposalStatus",
    "AnalysisStatus",
    "EvaluationStatus",
    "AuditEvent",
    "AuditAction",
    "Pilot",
    "PilotMilestone",
    "PilotKPI",
    "KPIMeasurement",
    "PilotRisk",
    "PilotIssue",
    "PilotEvidence",
    "PilotStatus",
    "MilestoneStatus",
    "TargetOperator",
    "KPIStatus",
    "RiskCategory",
    "RiskSeverity",
    "RiskStatus",
    "IssueStatus",
    "DecisionType",
    "ScaleUpStatus",
    "ProcurementDecision",
    "ProcurementScaleUp",
    "InnovationMemory",
    "MemoryOutcome",
    "MemorySourceType",
    "SystemSetting",
    "SettingCategory",
    "SettingValueType",
]

