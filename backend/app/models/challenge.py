"""
Challenge domain models.

A Challenge represents a government procurement need that startups can
respond to with proposals.  Each challenge can have structured requirements,
KPI definitions, and evaluation criteria.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChallengeStatus(str, enum.Enum):
    """Lifecycle statuses for a procurement challenge."""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ACCEPTING_PROPOSALS = "ACCEPTING_PROPOSALS"
    UNDER_EVALUATION = "UNDER_EVALUATION"
    PILOT_PHASE = "PILOT_PHASE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Challenge(Base):
    """Government procurement challenge."""

    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False, default="")
    domain: Mapped[str] = mapped_column(String(255), nullable=False, default="", index=True)
    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(ChallengeStatus, name="challenge_status", create_constraint=True),
        nullable=False,
        default=ChallengeStatus.DRAFT,
        index=True,
    )

    # Budget range
    budget_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_max: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Pilot configuration
    pilot_duration_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Ownership
    department_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("departments.id"), nullable=True, index=True
    )
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    # Timestamps
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
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
    department = relationship("Department", lazy="joined")
    creator = relationship("User", lazy="joined")
    requirements = relationship(
        "ChallengeRequirement",
        back_populates="challenge",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ChallengeRequirement.order",
    )
    kpis = relationship(
        "ChallengeKPI",
        back_populates="challenge",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    evaluation_criteria = relationship(
        "ChallengeEvaluationCriterion",
        back_populates="challenge",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Challenge {self.id[:8]}… '{self.title}' ({self.status.value})>"


class ChallengeRequirement(Base):
    """A single requirement within a challenge."""

    __tablename__ = "challenge_requirements"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    challenge = relationship("Challenge", back_populates="requirements")

    def __repr__(self) -> str:
        return f"<ChallengeRequirement {self.id[:8]}… order={self.order}>"


class ChallengeKPI(Base):
    """A KPI definition attached to a challenge."""

    __tablename__ = "challenge_kpis"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target_value: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)

    # Relationship
    challenge = relationship("Challenge", back_populates="kpis")

    def __repr__(self) -> str:
        return f"<ChallengeKPI {self.name} target={self.target_value}{self.unit}>"


class ChallengeEvaluationCriterion(Base):
    """An evaluation criterion used to score proposals for a challenge."""

    __tablename__ = "challenge_evaluation_criteria"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    challenge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    max_score: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    # Relationship
    challenge = relationship("Challenge", back_populates="evaluation_criteria")

    def __repr__(self) -> str:
        return f"<ChallengeEvaluationCriterion {self.name} weight={self.weight}>"
