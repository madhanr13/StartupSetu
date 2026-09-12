"""
Audit Service — Append-only audit trail for governance & compliance tracking.

Provides:
- log_event() — creates immutable audit records from backend services
- Paginated, filterable queries for the audit log API
- No update/delete methods — audit records are immutable
"""

import math
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.audit import AuditAction, AuditEvent
from app.models.user import User


class AuditService:
    """Append-only audit event service."""

    @staticmethod
    def log_event(
        db: Session,
        action: AuditAction,
        entity_type: str,
        entity_id: str,
        summary: str,
        actor: Optional[User] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditEvent:
        """Create and persist an immutable audit event record."""
        event = AuditEvent(
            action=action.value if hasattr(action, "value") else str(action),
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor.id if actor else None,
            actor_name=actor.name if hasattr(actor, "name") else getattr(actor, "full_name", "System") if actor else "System",
            actor_role=actor.role.value if actor else "SYSTEM",
            summary=summary,
            details=details or {},
            ip_address=ip_address,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def get_entity_history(db: Session, entity_type: str, entity_id: str) -> List[AuditEvent]:
        """Retrieve audit history for a specific entity ordered by timestamp."""
        return (
            db.query(AuditEvent)
            .filter(AuditEvent.entity_type == entity_type, AuditEvent.entity_id == entity_id)
            .order_by(AuditEvent.timestamp.asc())
            .all()
        )

    @staticmethod
    def get_log_by_id(db: Session, log_id: str) -> Optional[AuditEvent]:
        """Retrieve a single audit event by ID."""
        return db.query(AuditEvent).filter(AuditEvent.id == log_id).first()

    @staticmethod
    def get_paginated_logs(
        db: Session,
        page: int = 1,
        page_size: int = 25,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        actor_id: Optional[str] = None,
        actor_role: Optional[str] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Query audit events with pagination and optional filters.
        Returns dict with items, total, page, page_size, total_pages.
        """
        query = db.query(AuditEvent)

        # Apply filters
        filters = []
        if date_from:
            filters.append(AuditEvent.timestamp >= date_from)
        if date_to:
            filters.append(AuditEvent.timestamp <= date_to)
        if actor_id:
            filters.append(AuditEvent.actor_id == actor_id)
        if actor_role:
            filters.append(AuditEvent.actor_role == actor_role)
        if action:
            filters.append(AuditEvent.action == action)
        if entity_type:
            filters.append(AuditEvent.entity_type == entity_type)
        if search:
            search_filter = f"%{search}%"
            filters.append(
                AuditEvent.summary.ilike(search_filter)
                | AuditEvent.actor_name.ilike(search_filter)
            )

        if filters:
            query = query.filter(and_(*filters))

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))

        items = (
            query.order_by(AuditEvent.timestamp.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    def get_distinct_actions(db: Session) -> List[str]:
        """Return distinct action values for filter dropdowns."""
        rows = db.query(AuditEvent.action).distinct().all()
        return sorted([r[0] for r in rows])

    @staticmethod
    def get_distinct_entity_types(db: Session) -> List[str]:
        """Return distinct entity_type values for filter dropdowns."""
        rows = db.query(AuditEvent.entity_type).distinct().all()
        return sorted([r[0] for r in rows])
