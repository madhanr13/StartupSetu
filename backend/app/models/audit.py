"""
Audit Domain Model — Human-readable workflow audit events log.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditAction(str, enum.Enum):
    """Types of system audit actions."""
    USER_LOGIN = "USER_LOGIN"
    CHALLENGE_CREATED = "CHALLENGE_CREATED"
    CHALLENGE_UPDATED = "CHALLENGE_UPDATED"
    CHALLENGE_PUBLISHED = "CHALLENGE_PUBLISHED"
    STARTUP_MATCHED = "STARTUP_MATCHED"
    PROPOSAL_SUBMITTED = "PROPOSAL_SUBMITTED"
    PROPOSAL_UPDATED = "PROPOSAL_UPDATED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    AI_ANALYSIS_STARTED = "AI_ANALYSIS_STARTED"
    AI_ANALYSIS_COMPLETED = "AI_ANALYSIS_COMPLETED"
    EVALUATOR_ASSIGNED = "EVALUATOR_ASSIGNED"
    EVALUATION_SUBMITTED = "EVALUATION_SUBMITTED"
    PROPOSAL_SHORTLISTED = "PROPOSAL_SHORTLISTED"
    PROPOSAL_REJECTED = "PROPOSAL_REJECTED"
    PILOT_CREATED = "PILOT_CREATED"
    PILOT_UPDATED = "PILOT_UPDATED"
    MILESTONE_UPDATED = "MILESTONE_UPDATED"
    KPI_ADDED = "KPI_ADDED"
    KPI_TARGET_CHANGED = "KPI_TARGET_CHANGED"
    KPI_MEASUREMENT_RECORDED = "KPI_MEASUREMENT_RECORDED"
    RISK_ADDED = "RISK_ADDED"
    ISSUE_ADDED = "ISSUE_ADDED"
    EVIDENCE_UPLOADED = "EVIDENCE_UPLOADED"
    PILOT_STATUS_CHANGED = "PILOT_STATUS_CHANGED"
    PILOT_COMPLETED = "PILOT_COMPLETED"
    PILOT_READY_FOR_ASSESSMENT = "PILOT_READY_FOR_ASSESSMENT"
    ASSESSMENT_GENERATED = "ASSESSMENT_GENERATED"
    DECISION_CREATED = "DECISION_CREATED"
    PILOT_EXTENDED = "PILOT_EXTENDED"
    SCALE_UP_CREATED = "SCALE_UP_CREATED"
    SCALE_UP_STATUS_CHANGED = "SCALE_UP_STATUS_CHANGED"
    PILOT_CLOSED = "PILOT_CLOSED"
    CHALLENGE_CLOSED = "CHALLENGE_CLOSED"
    STARTUP_PROFILE_UPDATED = "STARTUP_PROFILE_UPDATED"
    SETTING_CHANGED = "SETTING_CHANGED"
    ELIGIBILITY_CHANGED = "ELIGIBILITY_CHANGED"
    SCORING_CONFIG_CHANGED = "SCORING_CONFIG_CHANGED"
    MEMORY_CREATED = "MEMORY_CREATED"
    MEMORY_UPDATED = "MEMORY_UPDATED"


class AuditEvent(Base):
    """Audit record capturing key business lifecycle events with actor and payload."""

    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # e.g. "proposal", "challenge"
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(255), nullable=False, default="System")
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False, default="SYSTEM")
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        action_val = getattr(self.action, "value", str(self.action))
        return f"<AuditEvent {action_val} by {self.actor_name} on {self.entity_type}:{self.entity_id[:8]}>"
