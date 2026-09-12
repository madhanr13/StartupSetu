"""
API Routes for Proposal Management, PDF Upload, AI Analysis, Human Evaluation Workspace, and Shortlisting.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.core.storage_service import StorageService
from app.models.startup import Startup
from app.models.user import User, UserRole
from app.schemas.proposal import (
    AssignEvaluatorsRequest,
    EvaluationCreate,
    ProposalCreate,
    ProposalEvaluationResponse,
    ProposalResponse,
    ProposalShortlistRequest,
)
from app.services.audit_service import AuditService
from app.services.proposal_service import ProposalService

router = APIRouter(prefix="/proposals", tags=["Proposals"])


def _format_proposal_response(proposal, db: Session) -> ProposalResponse:
    """Helper to convert Proposal DB model into ProposalResponse with computed stats."""
    resp = ProposalResponse.model_validate(proposal)
    
    # Compute average evaluation score
    if proposal.evaluations:
        completed = [e for e in proposal.evaluations if e.total_weighted_score is not None and e.total_weighted_score > 0]
        if completed:
            resp.average_evaluation_score = round(
                sum(e.total_weighted_score for e in completed) / len(completed), 2
            )

    # Department name mapping on challenge
    if resp.challenge and proposal.challenge and proposal.challenge.department:
        resp.challenge.department_name = proposal.challenge.department.name

    return resp


@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(
    challenge_id: str = Query(...),
    data: ProposalCreate = ...,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a draft proposal for a challenge."""
    startup = db.query(Startup).filter(Startup.user_id == current_user.id).first()
    if not startup and current_user.role == UserRole.STARTUP:
        raise HTTPException(status_code=400, detail="User does not have an active Startup profile.")
    
    startup_id = startup.id if startup else current_user.id
    proposal = ProposalService.create_proposal(db, challenge_id, startup_id, data, current_user)
    return _format_proposal_response(proposal, db)


@router.post("/{proposal_id}/document", response_model=ProposalResponse)
async def upload_proposal_document(
    proposal_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload proposal PDF document and run AI fact extraction."""
    proposal = await ProposalService.upload_document_and_analyze(db, proposal_id, file, current_user)
    return _format_proposal_response(proposal, db)


@router.get("/{proposal_id}/document")
def download_proposal_document(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream PDF proposal document securely."""
    proposal = ProposalService.get_proposal(db, proposal_id, current_user)
    if not proposal.document:
        raise HTTPException(status_code=404, detail="No document associated with this proposal.")

    file_path = StorageService.get_document_path(proposal.document.storage_key)
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=proposal.document.file_name,
    )


@router.post("/{proposal_id}/submit", response_model=ProposalResponse)
def submit_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finalize and submit proposal."""
    proposal = ProposalService.submit_proposal(db, proposal_id, current_user)
    return _format_proposal_response(proposal, db)


@router.post("/{proposal_id}/assign-evaluators", response_model=ProposalResponse)
def assign_evaluators(
    proposal_id: str,
    data: AssignEvaluatorsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign human evaluators to evaluate the proposal."""
    proposal = ProposalService.assign_evaluators(db, proposal_id, data.evaluator_ids, current_user)
    return _format_proposal_response(proposal, db)


@router.post("/{proposal_id}/evaluate", response_model=ProposalEvaluationResponse)
def evaluate_proposal(
    proposal_id: str,
    data: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluator submits criteria scores and feedback for proposal."""
    evaluation = ProposalService.submit_evaluation(db, proposal_id, current_user, data)
    return ProposalEvaluationResponse.model_validate(evaluation)


@router.post("/{proposal_id}/shortlist", response_model=ProposalResponse)
def shortlist_proposal(
    proposal_id: str,
    data: ProposalShortlistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Officer decision: Shortlist or Reject proposal with mandatory note."""
    proposal = ProposalService.shortlist_proposal(db, proposal_id, data.decision, data.reason, current_user)
    return _format_proposal_response(proposal, db)


@router.get("", response_model=List[ProposalResponse])
def list_proposals(
    challenge_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List proposals scoped by role and optional filters."""
    proposals = ProposalService.list_proposals(db, current_user, challenge_id, status)
    return [_format_proposal_response(p, db) for p in proposals]


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal_detail(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed proposal view."""
    proposal = ProposalService.get_proposal(db, proposal_id, current_user)
    return _format_proposal_response(proposal, db)


@router.get("/{proposal_id}/audit-trail")
def get_proposal_audit_trail(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve human-readable workflow audit events log for a proposal."""
    # Ensure permission
    ProposalService.get_proposal(db, proposal_id, current_user)
    history = AuditService.get_entity_history(db, "proposal", proposal_id)
    return [
        {
            "id": h.id,
            "action": h.action.value if hasattr(h.action, "value") else str(h.action),
            "summary": h.summary,
            "actor_name": h.actor_name,
            "actor_role": h.actor_role,
            "timestamp": h.timestamp.isoformat(),
            "details": h.details,
        }
        for h in history
    ]
