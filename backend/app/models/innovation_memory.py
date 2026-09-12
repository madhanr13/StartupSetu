"""
Innovation Memory Domain Model — Institutional knowledge from completed procurement workflows.

Stores structured lessons learned, success/failure factors, and recommendations
derived from actual challenge, pilot, and procurement decision data.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MemorySourceType(str, enum.Enum):
    """Type of source that generated the innovation memory entry."""
    CHALLENGE = "CHALLENGE"
    PILOT = "PILOT"
    DECISION = "DECISION"


class MemoryOutcome(str, enum.Enum):
    """Outcome classification for the innovation memory."""
    SCALE = "SCALE"
    EXTEND = "EXTEND"
    REJECT = "REJECT"
    IN_PROGRESS = "IN_PROGRESS"


class InnovationMemory(Base):
    """
    Institutional knowledge entry derived from completed government innovation procurement activities.
    Links back to source entities (challenge, pilot, decision) without duplicating their data.
    """

    __tablename__ = "innovation_memories"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Source linkage
    source_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(String(36), nullable=False)

    # Core metadata
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    technology: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    challenge_area: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, index=True)

    # Structured insights (JSON)
    key_metrics: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    lessons_learned: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    success_factors: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    failure_factors: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    recommendations: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    # Entity references (nullable — memory can reference subsets)
    startup_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    startup_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    challenge_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    pilot_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    decision_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Authorship
    created_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<InnovationMemory '{self.title[:40]}' outcome={self.outcome}>"
