"""
Proposal Domain Models — Proposal Submission, Document, AI Analysis, and Human Evaluation.
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


class ProposalStatus(str, enum.Enum):
    """Lifecycle statuses for a proposal submission."""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    AI_ANALYSIS_READY = "AI_ANALYSIS_READY"
    EVALUATION_IN_PROGRESS = "EVALUATION_IN_PROGRESS"
    EVALUATED = "EVALUATED"
    SHORTLISTED = "SHORTLISTED"
    NOT_SHORTLISTED = "NOT_SHORTLISTED"


class AnalysisStatus(str, enum.Enum):
    """Statuses for AI document analysis processing."""
    NOT_ANALYZED = "NOT_ANALYZED"
    ANALYZING = "ANALYZING"
    ANALYSIS_READY = "ANALYSIS_READY"
    ANALYSIS_FAILED = "ANALYSIS_FAILED"


class EvaluationStatus(str, enum.Enum):
    """Statuses for human evaluator reviews."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Proposal(Base):
    """Proposal submission by a startup for a specific challenge."""

    __tablename__ = "proposals"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    startup_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    executive_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    estimated_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    implementation_duration_days: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    
    # Primary Contact
    contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    status: Mapped[ProposalStatus] = mapped_column(
        Enum(ProposalStatus, name="proposal_status", create_constraint=True),
        nullable=False,
        default=ProposalStatus.DRAFT,
        index=True,
    )

    # Assigned Evaluators IDs (stored as JSON list)
    assigned_evaluator_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)

    # Shortlisting Decision
    shortlist_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shortlisted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    shortlisted_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Timestamps
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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
    challenge = relationship("Challenge", lazy="joined")
    startup = relationship("Startup", lazy="joined")
    document = relationship(
        "ProposalDocument",
        back_populates="proposal",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )
    analysis = relationship(
        "ProposalAnalysis",
        back_populates="proposal",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )
    evaluations = relationship(
        "ProposalEvaluation",
        back_populates="proposal",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Proposal {self.id[:8]} '{self.title}' ({self.status.value})>"


class ProposalDocument(Base):
    """Metadata for uploaded confidential proposal PDF documents."""

    __tablename__ = "proposal_documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, default="application/pdf")
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship
    proposal = relationship("Proposal", back_populates="document")

    def __repr__(self) -> str:
        return f"<ProposalDocument {self.file_name} ({self.file_size} bytes)>"


class ProposalAnalysis(Base):
    """AI-extracted structured proposal intelligence."""

    __tablename__ = "proposal_analyses"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    
    analysis_status: Mapped[AnalysisStatus] = mapped_column(
        Enum(AnalysisStatus, name="analysis_status", create_constraint=True),
        nullable=False,
        default=AnalysisStatus.NOT_ANALYZED,
    )

    # Structured Extracted Fields
    solution_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    technologies: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    architecture_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    implementation_plan: Mapped[str] = mapped_column(Text, nullable=False, default="")
    timeline_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    budget_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    team_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    previous_deployments: Mapped[str] = mapped_column(Text, nullable=False, default="")
    infrastructure_requirements: Mapped[str] = mapped_column(Text, nullable=False, default="")
    security_measures: Mapped[str] = mapped_column(Text, nullable=False, default="")
    data_requirements: Mapped[str] = mapped_column(Text, nullable=False, default="")
    scalability_assessment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    risks: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    expected_outcomes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    key_assumptions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    
    # Source Citations / Traceability
    source_traceability: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    analyzed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship
    proposal = relationship("Proposal", back_populates="analysis")

    def __repr__(self) -> str:
        return f"<ProposalAnalysis {self.proposal_id[:8]} status={self.analysis_status.value}>"


class ProposalEvaluation(Base):
    """Human evaluator scoring assessment for a proposal."""

    __tablename__ = "proposal_evaluations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    proposal_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False
    )
    evaluator_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    evaluator_name: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[EvaluationStatus] = mapped_column(
        Enum(EvaluationStatus, name="evaluation_status", create_constraint=True),
        nullable=False,
        default=EvaluationStatus.PENDING,
    )

    # List of scored criteria: [{criterion_id, criterion_name, score, max_score, weight, weighted_score, comment}]
    criterion_scores: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    total_weighted_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    general_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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
    proposal = relationship("Proposal", back_populates="evaluations")
    evaluator = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<ProposalEvaluation evaluator={self.evaluator_id[:8]} score={self.total_weighted_score}>"
