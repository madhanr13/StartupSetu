"""
Audit Logs API — Query interface for governance and compliance tracking.

Provides paginated, filtered access to system audit events.
Endpoints are read-only to preserve the append-only guarantee.
Restricted to GOVERNMENT_OFFICER, ADMIN, and AUDITOR roles.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    date_from: Optional[datetime] = Query(None, description="Filter events on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter events on or before this timestamp"),
    actor_id: Optional[str] = Query(None, description="Filter by actor user ID"),
    actor_role: Optional[str] = Query(None, description="Filter by actor role"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g. challenge, pilot)"),
    search: Optional[str] = Query(None, description="Text search in summary and actor name"),
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieve paginated audit log events with optional filters."""
    result = AuditService.get_paginated_logs(
        db=db,
        page=page,
        page_size=page_size,
        date_from=date_from,
        date_to=date_to,
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        search=search,
    )
    return result


@router.get("/actions", response_model=List[str])
def get_distinct_actions(
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Return list of distinct action values present in the audit log for UI filters."""
    return AuditService.get_distinct_actions(db)


@router.get("/entity-types", response_model=List[str])
def get_distinct_entity_types(
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Return list of distinct entity types present in the audit log for UI filters."""
    return AuditService.get_distinct_entity_types(db)


@router.get("/{id}", response_model=AuditLogResponse)
def get_audit_log(
    id: str,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieve a single audit log event by ID."""
    event = AuditService.get_log_by_id(db, id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit event with ID '{id}' not found",
        )
    return event
