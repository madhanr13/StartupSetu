"""
Pilot Domain Models — Pilot Execution, Milestones, KPIs, Measurements, Risks, Issues, and Evidence.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PilotStatus(str, enum.Enum):
    """Lifecycle statuses for a Pilot deployment."""
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    READY_FOR_ASSESSMENT = "READY_FOR_ASSESSMENT"
    CANCELLED = "CANCELLED"
    EXTENDED = "EXTENDED"
    SCALED = "SCALED"
    CLOSED = "CLOSED"


class MilestoneStatus(str, enum.Enum):
    """Execution status for a pilot milestone."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"


class TargetOperator(str, enum.Enum):
    """Mathematical operator for numerical KPI comparison."""
    GREATER_EQUAL = ">="
    LESS_EQUAL = "<="
    EQUAL = "="
    GREATER = ">"
    LESS = "<"


class KPIStatus(str, enum.Enum):
    """Evaluated status for a pilot KPI."""
    ACHIEVED = "ACHIEVED"
    BELOW_TARGET = "BELOW_TARGET"
    PENDING_MEASUREMENT = "PENDING_MEASUREMENT"


class RiskCategory(str, enum.Enum):
    """Categories of pilot operational risks."""
    TECHNICAL = "TECHNICAL"
    SECURITY = "SECURITY"
    DATA = "DATA"
    FINANCIAL = "FINANCIAL"
    OPERATIONAL = "OPERATIONAL"
    SCALABILITY = "SCALABILITY"


class RiskSeverity(str, enum.Enum):
    """Severity levels for risks and issues."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskStatus(str, enum.Enum):
    """Risk tracking lifecycle status."""
    OPEN = "OPEN"
    MITIGATED = "MITIGATED"
    ACCEPTED = "ACCEPTED"
    CLOSED = "CLOSED"


class IssueStatus(str, enum.Enum):
    """Occurred issue lifecycle status."""
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Pilot(Base):
    """Pilot program execution container."""

    __tablename__ = "pilots"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    startup_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    success_criteria: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Responsibilities
    government_owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    government_team_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    startup_team_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Governance & Environment Notes
    data_access_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    security_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Schedule & Status
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[PilotStatus] = mapped_column(
        Enum(PilotStatus, name="pilot_status", create_constraint=False),
        nullable=False,
        default=PilotStatus.DRAFT,
        index=True,
    )
    
    # Progress Completion (0-100%)
    overall_progress_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Completion Timestamps
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ready_for_assessment_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    proposal = relationship("Proposal", lazy="joined")
    challenge = relationship("Challenge", lazy="joined")
    startup = relationship("Startup", lazy="joined")
    government_owner = relationship("User", lazy="joined")

    milestones = relationship(
        "PilotMilestone",
        back_populates="pilot",
        cascade="all, delete-orphan",
        order_by="PilotMilestone.planned_start.asc()",
        lazy="selectin",
    )
    kpis = relationship(
        "PilotKPI",
        back_populates="pilot",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    risks = relationship(
        "PilotRisk",
        back_populates="pilot",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    issues = relationship(
        "PilotIssue",
        back_populates="pilot",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    evidence_files = relationship(
        "PilotEvidence",
        back_populates="pilot",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    decisions = relationship(
        "ProcurementDecision",
        back_populates="pilot",
        cascade="all, delete-orphan",
        order_by="ProcurementDecision.created_at.desc()",
        lazy="selectin",
    )
    scale_up = relationship(
        "ProcurementScaleUp",
        back_populates="pilot",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Pilot {self.id[:8]} '{self.name}' status={self.status.value}>"


class PilotMilestone(Base):
    """Milestone progress checkpoint for a pilot."""

    __tablename__ = "pilot_milestones"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    planned_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    planned_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[MilestoneStatus] = mapped_column(
        Enum(MilestoneStatus, name="milestone_status", create_constraint=True),
        nullable=False,
        default=MilestoneStatus.NOT_STARTED,
    )
    completion_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    blocked_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    pilot = relationship("Pilot", back_populates="milestones")


class PilotKPI(Base):
    """KPI definition attached to a pilot."""

    __tablename__ = "pilot_kpis"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    target_operator: Mapped[TargetOperator] = mapped_column(
        Enum(TargetOperator, name="target_operator", create_constraint=True),
        nullable=False,
        default=TargetOperator.GREATER_EQUAL,
    )
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    measurement_method: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    frequency: Mapped[str] = mapped_column(String(50), nullable=False, default="Weekly")
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    
    status: Mapped[KPIStatus] = mapped_column(
        Enum(KPIStatus, name="kpi_status", create_constraint=True),
        nullable=False,
        default=KPIStatus.PENDING_MEASUREMENT,
        index=True,
    )

    # Change History Log for Target Modifications: [{old_target, new_target, reason, changed_by, timestamp}]
    target_change_history: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    latest_actual_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latest_measurement_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    pilot = relationship("Pilot", back_populates="kpis")
    measurements = relationship(
        "KPIMeasurement",
        back_populates="kpi",
        cascade="all, delete-orphan",
        order_by="KPIMeasurement.measurement_date.asc()",
        lazy="selectin",
    )


class KPIMeasurement(Base):
    """Immutable historical measurement entry for a Pilot KPI."""

    __tablename__ = "kpi_measurements"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_kpi_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilot_kpis.id", ondelete="CASCADE"), nullable=False, index=True
    )
    measurement_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_value: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by_id: Mapped[str] = mapped_column(String(36), nullable=False)
    recorded_by_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Evaluator")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    kpi = relationship("PilotKPI", back_populates="measurements")


class PilotRisk(Base):
    """Operational risk item tracked for a pilot."""

    __tablename__ = "pilot_risks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[RiskCategory] = mapped_column(
        Enum(RiskCategory, name="risk_category", create_constraint=True),
        nullable=False,
        default=RiskCategory.TECHNICAL,
    )
    severity: Mapped[RiskSeverity] = mapped_column(
        Enum(RiskSeverity, name="risk_severity", create_constraint=True),
        nullable=False,
        default=RiskSeverity.MEDIUM,
    )
    probability: Mapped[str] = mapped_column(String(50), nullable=False, default="Medium")
    mitigation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    owner_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Government Owner")
    status: Mapped[RiskStatus] = mapped_column(
        Enum(RiskStatus, name="risk_status", create_constraint=True),
        nullable=False,
        default=RiskStatus.OPEN,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    pilot = relationship("Pilot", back_populates="risks")


class PilotIssue(Base):
    """Occurred issue item for a pilot."""

    __tablename__ = "pilot_issues"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    severity: Mapped[RiskSeverity] = mapped_column(
        Enum(RiskSeverity, name="issue_severity", create_constraint=True),
        nullable=False,
        default=RiskSeverity.MEDIUM,
    )
    reported_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    assigned_to_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Unassigned")
    status: Mapped[IssueStatus] = mapped_column(
        Enum(IssueStatus, name="issue_status", create_constraint=True),
        nullable=False,
        default=IssueStatus.OPEN,
    )
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    pilot = relationship("Pilot", back_populates="issues")


class PilotEvidence(Base):
    """Evidence file attachment for pilot validation."""

    __tablename__ = "pilot_evidence"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    uploaded_by_id: Mapped[str] = mapped_column(String(36), nullable=False)
    uploaded_by_name: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    pilot = relationship("Pilot", back_populates="evidence_files")
