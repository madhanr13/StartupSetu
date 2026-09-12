"""
Pilot Management Router — Endpoints for Pilot projects, Milestones, KPIs, Measurements, Risks, Issues, Evidence, and Audit Trail.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pilot import PilotStatus
from app.models.user import User, UserRole
from app.schemas.pilot import (
    BulkKPIMeasurementsInput,
    KPIMeasurementCreate,
    KPIMeasurementResponse,
    PilotCreateInput,
    PilotEvidenceResponse,
    PilotIssueCreate,
    PilotIssueResponse,
    PilotIssueUpdate,
    PilotKPICreate,
    PilotKPIResponse,
    PilotKPIUpdateTarget,
    PilotMilestoneCreate,
    PilotMilestoneResponse,
    PilotMilestoneUpdate,
    PilotResponse,
    PilotRiskCreate,
    PilotRiskResponse,
    PilotRiskUpdate,
    PilotUpdateInput,
)
from app.services.audit_service import AuditService
from app.services.kpi_service import KPICalculationService
from app.services.pilot_service import PilotService

router = APIRouter(prefix="/pilots", tags=["Pilots"])


def enrich_pilot_response(pilot, db: Session) -> Dict[str, Any]:
    """Helper to attach calculated health summary and simple metadata to Pilot schema."""
    health = KPICalculationService.calculate_pilot_health(pilot)

    # Format response dictionary
    resp = {
        "id": pilot.id,
        "proposal_id": pilot.proposal_id,
        "challenge_id": pilot.challenge_id,
        "startup_id": pilot.startup_id,
        "name": pilot.name,
        "objective": pilot.objective,
        "scope": pilot.scope,
        "success_criteria": pilot.success_criteria,
        "government_owner_id": pilot.government_owner_id,
        "government_team_notes": pilot.government_team_notes,
        "startup_team_notes": pilot.startup_team_notes,
        "evaluator_notes": pilot.evaluator_notes,
        "data_access_notes": pilot.data_access_notes,
        "security_requirements": pilot.security_requirements,
        "ip_notes": pilot.ip_notes,
        "start_date": pilot.start_date,
        "end_date": pilot.end_date,
        "status": pilot.status,
        "overall_progress_percentage": pilot.overall_progress_percentage,
        "completed_at": pilot.completed_at,
        "ready_for_assessment_at": pilot.ready_for_assessment_at,
        "created_at": pilot.created_at,
        "updated_at": pilot.updated_at,
        "health": health,
        "milestones": pilot.milestones or [],
        "kpis": pilot.kpis or [],
        "risks": pilot.risks or [],
        "issues": pilot.issues or [],
        "evidence_files": pilot.evidence_files or [],
    }

    if pilot.challenge:
        resp["challenge"] = {
            "id": pilot.challenge.id,
            "title": pilot.challenge.title,
            "department_id": pilot.challenge.department_id,
            "department_name": pilot.challenge.department.name if pilot.challenge.department else None,
        }

    if pilot.startup:
        resp["startup"] = {
            "id": pilot.startup.id,
            "company_name": pilot.startup.company_name,
            "dpiit_number": pilot.startup.dpiit_number,
            "contact_email": pilot.startup.contact_email,
        }

    if pilot.government_owner:
        resp["government_owner"] = {
            "id": pilot.government_owner.id,
            "name": pilot.government_owner.name,
            "email": pilot.government_owner.email,
        }

    return resp


@router.post("", response_model=PilotResponse, status_code=status.HTTP_201_CREATED)
def create_pilot(
    input_data: PilotCreateInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new Pilot project from a shortlisted proposal."""
    if current_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officers or Admins can initiate pilot projects",
        )
    pilot = PilotService.create_pilot_from_proposal(db, input_data, current_user)
    return enrich_pilot_response(pilot, db)


@router.get("", response_model=List[PilotResponse])
def list_pilots(
    status_filter: Optional[PilotStatus] = None,
    search: Optional[str] = None,
    challenge_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pilot projects accessible to current user."""
    pilots = PilotService.list_pilots(
        db=db,
        user=current_user,
        status_filter=status_filter,
        search_query=search,
        challenge_id=challenge_id,
    )
    return [enrich_pilot_response(p, db) for p in pilots]


@router.get("/{pilot_id}", response_model=PilotResponse)
def get_pilot(
    pilot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pilot detail by ID with full health summary and child entities."""
    pilot = PilotService.get_pilot_by_id(db, pilot_id)

    # Ownership check: STARTUP users can only view their own pilots
    if current_user.role == UserRole.STARTUP:
        from app.models.startup import Startup
        startup = db.query(Startup).filter(Startup.user_id == current_user.id).first()
        if not startup or startup.id != pilot.startup_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access another organization's pilot project.",
            )

    return enrich_pilot_response(pilot, db)


@router.patch("/{pilot_id}", response_model=PilotResponse)
def update_pilot(
    pilot_id: str,
    input_data: PilotUpdateInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update pilot project details or operational status."""
    pilot = PilotService.get_pilot_by_id(db, pilot_id)

    # RBAC check
    if current_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
        if current_user.role == UserRole.STARTUP:
            from app.models.startup import Startup
            startup = db.query(Startup).filter(Startup.user_id == current_user.id).first()
            if not startup or startup.id != pilot.startup_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this pilot.")
            if input_data.status:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Startups cannot modify pilot status directly.")
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify pilot projects.")

    updated_pilot = PilotService.update_pilot(db, pilot_id, input_data, current_user)
    return enrich_pilot_response(updated_pilot, db)


# ---------------------------------------------------------
# MILESTONES
# ---------------------------------------------------------
@router.post("/{pilot_id}/milestones", response_model=PilotMilestoneResponse)
def add_milestone(
    pilot_id: str,
    input_data: PilotMilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new milestone to pilot."""
    return PilotService.add_milestone(db, pilot_id, input_data, current_user)


@router.patch("/{pilot_id}/milestones/{milestone_id}", response_model=PilotMilestoneResponse)
def update_milestone(
    pilot_id: str,
    milestone_id: str,
    input_data: PilotMilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update milestone progress, status, or blocked reason."""
    return PilotService.update_milestone(db, pilot_id, milestone_id, input_data, current_user)


# ---------------------------------------------------------
# KPIS & MEASUREMENTS
# ---------------------------------------------------------
@router.post("/{pilot_id}/kpis", response_model=PilotKPIResponse)
def add_kpi(
    pilot_id: str,
    input_data: PilotKPICreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new performance KPI to pilot."""
    kpi = PilotService.add_kpi(db, pilot_id, input_data, current_user)
    return kpi


@router.patch("/{pilot_id}/kpis/{kpi_id}/target", response_model=PilotKPIResponse)
def update_kpi_target(
    pilot_id: str,
    kpi_id: str,
    input_data: PilotKPIUpdateTarget,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Modify target value of a KPI.
    DEMANDS a written justification reason (minimum 10 chars).
    Logs to audit history.
    """
    if current_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officers or Admins can modify KPI targets",
        )
    return PilotService.update_kpi_target(db, pilot_id, kpi_id, input_data, current_user)


@router.post("/{pilot_id}/kpis/{kpi_id}/measurements", response_model=KPIMeasurementResponse)
def record_kpi_measurement(
    pilot_id: str,
    kpi_id: str,
    input_data: KPIMeasurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a single numerical KPI measurement."""
    return PilotService.record_kpi_measurement(db, pilot_id, kpi_id, input_data, current_user)


@router.post("/{pilot_id}/kpis/bulk-measurements", response_model=List[KPIMeasurementResponse])
def record_bulk_kpi_measurements(
    pilot_id: str,
    input_data: BulkKPIMeasurementsInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record multiple KPI measurements at once (e.g. weekly reporting)."""
    return PilotService.record_bulk_kpi_measurements(db, pilot_id, input_data, current_user)


# ---------------------------------------------------------
# RISKS & ISSUES
# ---------------------------------------------------------
@router.post("/{pilot_id}/risks", response_model=PilotRiskResponse)
def add_risk(
    pilot_id: str,
    input_data: PilotRiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Identify and register a pilot risk."""
    return PilotService.add_risk(db, pilot_id, input_data, current_user)


@router.patch("/{pilot_id}/risks/{risk_id}", response_model=PilotRiskResponse)
def update_risk(
    pilot_id: str,
    risk_id: str,
    input_data: PilotRiskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update risk status, mitigation, or severity."""
    return PilotService.update_risk(db, pilot_id, risk_id, input_data, current_user)


@router.post("/{pilot_id}/issues", response_model=PilotIssueResponse)
def add_issue(
    pilot_id: str,
    input_data: PilotIssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Report an operational issue."""
    return PilotService.add_issue(db, pilot_id, input_data, current_user)


@router.patch("/{pilot_id}/issues/{issue_id}", response_model=PilotIssueResponse)
def update_issue(
    pilot_id: str,
    issue_id: str,
    input_data: PilotIssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update issue status or resolution."""
    return PilotService.update_issue(db, pilot_id, issue_id, input_data, current_user)


# ---------------------------------------------------------
# EVIDENCE UPLOAD
# ---------------------------------------------------------
@router.post("/{pilot_id}/evidence", response_model=PilotEvidenceResponse)
async def upload_evidence(
    pilot_id: str,
    file: UploadFile = File(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload pilot evidence document or test artifact."""
    return await PilotService.upload_evidence(db, pilot_id, file, description, current_user)


# ---------------------------------------------------------
# COMPLETION & READY FOR ASSESSMENT TRANSITION
# ---------------------------------------------------------
@router.post("/{pilot_id}/complete", response_model=PilotResponse)
def complete_pilot(
    pilot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validate completion criteria and transition pilot status to `READY_FOR_ASSESSMENT`.
    Ensures all milestones completed and KPIs measured.
    """
    if current_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officers or Admins can mark a pilot complete",
        )
    pilot = PilotService.complete_pilot(db, pilot_id, current_user)
    return enrich_pilot_response(pilot, db)


# ---------------------------------------------------------
# AUDIT TRAIL
# ---------------------------------------------------------
@router.get("/{pilot_id}/audit-trail")
def get_pilot_audit_trail(
    pilot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve complete audit history for this pilot entity."""
    events = AuditService.get_entity_history(db, "PILOT", pilot_id)
    # Also fetch milestone, KPI, evidence events related
    return events
