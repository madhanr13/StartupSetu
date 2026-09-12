"""
Procurement API Router — Endpoints for Pilot AI Assessments, Officer Decisions, Decision History,
and Public Procurement Scale-Up Stage Management.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.procurement import ScaleUpStatus
from app.models.user import User, UserRole
from app.schemas.procurement import (
    PilotAssessmentResponse,
    ProcurementDecisionCreate,
    ProcurementDecisionResponse,
    ProcurementScaleUpResponse,
    ProcurementScaleUpUpdate,
)
from app.services.procurement_service import ProcurementService

router = APIRouter(tags=["Procurement Decision & Scale-Up"])


# ── Pilot Assessment Endpoints ──────────────────────────────────────────────

@router.get("/pilots/{pilot_id}/assessment", response_model=PilotAssessmentResponse)
def get_pilot_assessment(
    pilot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve or compute an AI-assisted pilot assessment based on actual telemetry.
    Analyzes KPI fulfillment, milestone progress, risks, issues, and evidence.
    """
    assessment = ProcurementService.generate_pilot_assessment(db, pilot_id, current_user)
    return assessment


@router.post("/pilots/{pilot_id}/assessment", response_model=PilotAssessmentResponse)
def recompute_pilot_assessment(
    pilot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Force re-evaluation of pilot telemetry to refresh AI recommendation and metrics.
    """
    assessment = ProcurementService.generate_pilot_assessment(db, pilot_id, current_user)
    return assessment


# ── Final Procurement Decision Endpoints ────────────────────────────────────

@router.post(
    "/pilots/{pilot_id}/decision",
    response_model=ProcurementDecisionResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_procurement_decision(
    pilot_id: str,
    decision_data: ProcurementDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Government Officer submits binding final procurement decision:
    - SCALE: Approves solution, marks pilot successful, transitions to Procurement Scale-Up stage.
    - EXTEND: Grants extended monitoring duration with mandatory reason.
    - REJECT: Declines solution with mandatory written justification and closes pilot.
    """
    decision = ProcurementService.create_procurement_decision(db, pilot_id, decision_data, current_user)
    return decision


@router.get("/pilots/{pilot_id}/decision-history", response_model=List[ProcurementDecisionResponse])
def get_pilot_decision_history(
    pilot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full audit and versioned decision history for a pilot project.
    """
    history = ProcurementService.get_decision_history(db, pilot_id, current_user)
    return history


# ── Public Procurement Scale-Up Stage Endpoints ─────────────────────────────

@router.get("/procurement/scale-up", response_model=List[ProcurementScaleUpResponse])
def list_scale_up_projects(
    status_filter: Optional[ScaleUpStatus] = Query(None, description="Filter by procurement status"),
    department_id: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all solutions that completed pilot execution and transitioned to the Scale-Up & Procurement board.
    """
    projects = ProcurementService.list_scale_up_projects(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        department_id=department_id,
    )
    return projects


@router.get("/procurement/scale-up/{scale_up_id}", response_model=ProcurementScaleUpResponse)
def get_scale_up_project(
    scale_up_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed profile of a scaled solution including approved KPIs and procurement progress.
    """
    project = ProcurementService.get_scale_up_by_id(db, scale_up_id)
    return project


@router.patch("/procurement/scale-up/{scale_up_id}", response_model=ProcurementScaleUpResponse)
def update_scale_up_project(
    scale_up_id: str,
    update_data: ProcurementScaleUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update procurement/scale-up lifecycle status, allocated budget, or procurement notes.
    """
    project = ProcurementService.update_scale_up_project(db, scale_up_id, update_data, current_user)
    return project
