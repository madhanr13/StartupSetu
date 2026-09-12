"""
Settings API — System configuration and parameter management.

Exposes endpoints to view and modify platform settings, including
matching weights, eligibility parameters, and workflow thresholds.
Mutations are restricted to ADMIN and generate immutable audit logs.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.settings import (
    MatchingWeightsResponse,
    MatchingWeightsUpdate,
    SystemSettingResponse,
    SystemSettingUpdate,
)
from app.services.settings_service import settings_service

router = APIRouter(prefix="/settings", tags=["System Settings"])


@router.get("", response_model=List[SystemSettingResponse])
def get_all_settings(
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieve all configurable platform settings."""
    return settings_service.get_all_settings(db)


@router.get("/category/{category}", response_model=List[SystemSettingResponse])
def get_settings_by_category(
    category: str,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieve settings belonging to a specific category."""
    return settings_service.get_settings_by_category(db, category)


@router.get("/matching-weights", response_model=MatchingWeightsResponse)
def get_matching_weights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the active multi-criteria startup matching weights."""
    weights = settings_service.get_matching_weights(db)
    setting = settings_service.get_setting(db, "matching.weights")
    return MatchingWeightsResponse(
        weights=weights,
        updated_at=setting.updated_at if setting else None,
        updated_by=setting.updated_by if setting else None,
    )


@router.patch("/matching-weights", response_model=MatchingWeightsResponse)
def update_matching_weights(
    payload: MatchingWeightsUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Update matching weights for AI startup discovery.
    Restricted to platform Administrators. Creates an audit event.
    """
    try:
        updated = settings_service.update_matching_weights(
            db=db, weights=payload.weights, actor=current_user
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    setting = settings_service.get_setting(db, "matching.weights")
    return MatchingWeightsResponse(
        weights=updated,
        updated_at=setting.updated_at if setting else None,
        updated_by=setting.updated_by if setting else None,
    )


@router.get("/{key:path}", response_model=SystemSettingResponse)
def get_setting(
    key: str,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieve a single system setting by key."""
    setting = settings_service.get_setting(db, key)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with key '{key}' not found",
        )
    return setting


@router.patch("/{key:path}", response_model=SystemSettingResponse)
def update_setting(
    key: str,
    payload: SystemSettingUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Update a setting value.
    Restricted to platform Administrators. Creates an audit log entry.
    """
    try:
        updated = settings_service.update_setting(
            db=db, key=key, value=payload.value, actor=current_user
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    return updated
