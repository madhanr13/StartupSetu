"""
Procurement Decision & Scale-Up Domain Models — Final Decisions, AI Assessment Snapshots, and Scale-Up Projects.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import (
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


class DecisionType(str, enum.Enum):
    """Final human officer procurement decision outcome."""
    SCALE = "SCALE"
    EXTEND = "EXTEND"
    REJECT = "REJECT"


class ScaleUpStatus(str, enum.Enum):
    """Lifecycle statuses for a scaled solution proceeding to public procurement."""
    READY_FOR_PROCUREMENT = "READY_FOR_PROCUREMENT"
    PROCUREMENT_IN_PROGRESS = "PROCUREMENT_IN_PROGRESS"
    SCALED = "SCALED"


class ProcurementDecision(Base):
    """
    Formal procurement decision record for a completed or assessed pilot.
    Preserves complete decision history, AI recommendations, and officer justifications.
    """

    __tablename__ = "procurement_decisions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    startup_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False, index=True
    )

    decision: Mapped[DecisionType] = mapped_column(
        Enum(DecisionType, name="decision_type", create_constraint=False),
        nullable=False,
    )
    ai_recommendation: Mapped[DecisionType] = mapped_column(
        Enum(DecisionType, name="ai_decision_type", create_constraint=False),
        nullable=False,
    )
    ai_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ai_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    justification: Mapped[str] = mapped_column(Text, nullable=False)
    decided_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Extension specific fields
    extension_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Duration in days
    extension_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Rejection specific fields
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Full assessment snapshot captured at decision time
    assessment_snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

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
    pilot: Mapped["Pilot"] = relationship("Pilot", back_populates="decisions")
    challenge: Mapped["Challenge"] = relationship("Challenge")
    startup: Mapped["Startup"] = relationship("Startup")
    decided_by_user: Mapped["User"] = relationship("User")
    scale_up_record: Mapped[Optional["ProcurementScaleUp"]] = relationship(
        "ProcurementScaleUp", back_populates="decision", uselist=False
    )


class ProcurementScaleUp(Base):
    """
    Scale-up and public procurement transition entity.
    Created when a pilot is approved for SCALE by the government officer.
    """

    __tablename__ = "procurement_scale_up"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    pilot_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    decision_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("procurement_decisions.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False
    )
    startup_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    solution_name: Mapped[str] = mapped_column(String(500), nullable=False)
    pilot_outcome_summary: Mapped[str] = mapped_column(Text, nullable=False)
    approved_kpis: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    proposed_scale_scope: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[ScaleUpStatus] = mapped_column(
        Enum(ScaleUpStatus, name="scale_up_status", create_constraint=False),
        nullable=False,
        default=ScaleUpStatus.READY_FOR_PROCUREMENT,
    )

    budget_allocation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_completion_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    procurement_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    pilot: Mapped["Pilot"] = relationship("Pilot", back_populates="scale_up")
    decision: Mapped["ProcurementDecision"] = relationship("ProcurementDecision", back_populates="scale_up_record")
    challenge: Mapped["Challenge"] = relationship("Challenge")
    startup: Mapped["Startup"] = relationship("Startup")
    department: Mapped[Optional["Department"]] = relationship("Department")
