"""
Proposal Service — Business logic for Proposal Creation, Document Processing, AI Analysis Triggering, Human Evaluation, and Shortlisting.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.ai.proposal_analyzer import ProposalAnalyzer
from app.core.storage_service import StorageService
from app.models.audit import AuditAction
from app.models.challenge import Challenge, ChallengeEvaluationCriterion, ChallengeStatus
from app.models.proposal import (
    AnalysisStatus,
    EvaluationStatus,
    Proposal,
    ProposalAnalysis,
    ProposalDocument,
    ProposalEvaluation,
    ProposalStatus,
)
from app.models.startup import Startup
from app.models.user import User, UserRole
from app.schemas.proposal import CriterionScoreInput, EvaluationCreate, ProposalCreate, ProposalUpdate
from app.services.audit_service import AuditService


class ProposalService:

    @staticmethod
    def create_proposal(
        db: Session, challenge_id: str, startup_id: str, data: ProposalCreate, user: User
    ) -> Proposal:
        """Draft a proposal submission for a published challenge."""
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found.")

        if challenge.status != ChallengeStatus.PUBLISHED:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot submit proposal. Challenge is in '{challenge.status.value}' state.",
            )

        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            raise HTTPException(status_code=404, detail="Startup profile not found.")

        # Check for existing proposal by this startup for this challenge
        existing = (
            db.query(Proposal)
            .filter(Proposal.challenge_id == challenge_id, Proposal.startup_id == startup_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Your startup has already created a proposal for this challenge.",
            )

        proposal = Proposal(
            challenge_id=challenge_id,
            startup_id=startup_id,
            title=data.title,
            executive_summary=data.executive_summary,
            estimated_cost=data.estimated_cost,
            implementation_duration_days=data.implementation_duration_days,
            contact_name=data.contact_name or getattr(user, "name", getattr(user, "full_name", "User")),
            contact_email=data.contact_email or user.email,
            contact_phone=data.contact_phone,
            status=ProposalStatus.DRAFT,
        )

        db.add(proposal)
        db.commit()
        db.refresh(proposal)

        u_name = getattr(user, "name", getattr(user, "full_name", "User"))

        # Audit Event
        AuditService.log_event(
            db=db,
            action=AuditAction.PROPOSAL_SUBMITTED,
            entity_type="proposal",
            entity_id=proposal.id,
            summary=f"Draft proposal created by {u_name} ({startup.company_name}) for '{challenge.title}'",
            actor=user,
            details={"title": proposal.title, "cost": proposal.estimated_cost},
        )

        return proposal

    @staticmethod
    async def upload_document_and_analyze(
        db: Session, proposal_id: str, file: UploadFile, user: User
    ) -> Proposal:
        """Upload proposal PDF, store metadata, and trigger AI fact extraction."""
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        if user.role == UserRole.STARTUP:
            user_startup = db.query(Startup).filter(Startup.user_id == user.id).first()
            if not user_startup or user_startup.id != proposal.startup_id:
                raise HTTPException(status_code=403, detail="Not authorized to edit this proposal.")

        # 1. Save file to secure storage
        file_name, storage_key, file_size, checksum = await StorageService.save_proposal_document(
            file, proposal_id
        )

        # 2. Save or update ProposalDocument record
        doc = db.query(ProposalDocument).filter(ProposalDocument.proposal_id == proposal_id).first()
        if not doc:
            doc = ProposalDocument(
                proposal_id=proposal_id,
                file_name=file_name,
                storage_key=storage_key,
                file_size=file_size,
                checksum=checksum,
            )
            db.add(doc)
        else:
            doc.file_name = file_name
            doc.storage_key = storage_key
            doc.file_size = file_size
            doc.checksum = checksum
            doc.uploaded_at = datetime.now(timezone.utc)

        # Audit File Upload
        AuditService.log_event(
            db=db,
            action=AuditAction.DOCUMENT_UPLOADED,
            entity_type="proposal",
            entity_id=proposal_id,
            summary=f"Document '{file_name}' ({file_size} bytes, SHA256: {checksum[:8]}...) uploaded.",
            actor=user,
        )

        # 3. Trigger AI Analysis
        analysis = db.query(ProposalAnalysis).filter(ProposalAnalysis.proposal_id == proposal_id).first()
        if not analysis:
            analysis = ProposalAnalysis(
                proposal_id=proposal_id,
                analysis_status=AnalysisStatus.ANALYZING,
            )
            db.add(analysis)
        else:
            analysis.analysis_status = AnalysisStatus.ANALYZING

        db.commit()

        # Run AI Fact Extraction
        try:
            extracted_facts = ProposalAnalyzer.analyze_proposal(
                pdf_path=storage_key,
                proposal_title=proposal.title,
                executive_summary=proposal.executive_summary,
                estimated_cost=proposal.estimated_cost,
                implementation_duration_days=proposal.implementation_duration_days,
                challenge_title=proposal.challenge.title if proposal.challenge else "Government Challenge",
            )

            for key, val in extracted_facts.items():
                if hasattr(analysis, key):
                    setattr(analysis, key, val)

            analysis.analysis_status = AnalysisStatus.ANALYSIS_READY
            analysis.analyzed_at = datetime.now(timezone.utc)

            # Update proposal status if submitted
            if proposal.status == ProposalStatus.SUBMITTED:
                proposal.status = ProposalStatus.AI_ANALYSIS_READY

            db.commit()

            AuditService.log_event(
                db=db,
                action=AuditAction.AI_ANALYSIS_COMPLETED,
                entity_type="proposal",
                entity_id=proposal_id,
                summary="AI proposal document fact extraction & source traceability completed.",
                actor=None,
            )

        except Exception as e:
            analysis.analysis_status = AnalysisStatus.ANALYSIS_FAILED
            db.commit()
            raise HTTPException(status_code=500, detail=f"AI proposal document analysis failed: {str(e)}")

        db.refresh(proposal)
        return proposal

    @staticmethod
    def submit_proposal(db: Session, proposal_id: str, user: User) -> Proposal:
        """Finalize proposal submission."""
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        if user.role == UserRole.STARTUP:
            user_startup = db.query(Startup).filter(Startup.user_id == user.id).first()
            if not user_startup or user_startup.id != proposal.startup_id:
                raise HTTPException(status_code=403, detail="Not authorized to submit this proposal.")

        if not proposal.document:
            raise HTTPException(
                status_code=400,
                detail="A proposal PDF document must be uploaded prior to final submission.",
            )

        proposal.submitted_at = datetime.now(timezone.utc)
        proposal.status = (
            ProposalStatus.AI_ANALYSIS_READY
            if proposal.analysis and proposal.analysis.analysis_status == AnalysisStatus.ANALYSIS_READY
            else ProposalStatus.SUBMITTED
        )

        db.commit()
        db.refresh(proposal)

        AuditService.log_event(
            db=db,
            action=AuditAction.PROPOSAL_SUBMITTED,
            entity_type="proposal",
            entity_id=proposal.id,
            summary=f"Proposal '{proposal.title}' formally submitted by startup.",
            actor=user,
        )

        return proposal

    @staticmethod
    def assign_evaluators(
        db: Session, proposal_id: str, evaluator_ids: List[str], officer_user: User
    ) -> Proposal:
        """Assign human evaluators to evaluate the proposal."""
        if officer_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Only Government Officers can assign evaluators.")

        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        # Verify evaluator users exist
        evaluators = db.query(User).filter(User.id.in_(evaluator_ids)).all()
        if len(evaluators) != len(evaluator_ids):
            raise HTTPException(status_code=400, detail="One or more specified evaluator IDs are invalid.")

        proposal.assigned_evaluator_ids = evaluator_ids
        if proposal.status in [ProposalStatus.SUBMITTED, ProposalStatus.AI_ANALYSIS_READY]:
            proposal.status = ProposalStatus.UNDER_REVIEW

        # Ensure pending evaluation objects exist for assigned evaluators
        for ev in evaluators:
            existing_ev = (
                db.query(ProposalEvaluation)
                .filter(ProposalEvaluation.proposal_id == proposal_id, ProposalEvaluation.evaluator_id == ev.id)
                .first()
            )
            if not existing_ev:
                ev_name = getattr(ev, "name", getattr(ev, "full_name", "Evaluator"))
                new_eval = ProposalEvaluation(
                    proposal_id=proposal_id,
                    evaluator_id=ev.id,
                    evaluator_name=ev_name,
                    status=EvaluationStatus.PENDING,
                )
                db.add(new_eval)

        db.commit()
        db.refresh(proposal)

        names_str = ", ".join(getattr(e, "name", getattr(e, "full_name", "Evaluator")) for e in evaluators)

        AuditService.log_event(
            db=db,
            action=AuditAction.EVALUATOR_ASSIGNED,
            entity_type="proposal",
            entity_id=proposal_id,
            summary=f"Assigned {len(evaluators)} evaluator(s) ({names_str}) to proposal.",
            actor=officer_user,
        )

        return proposal

    @staticmethod
    def submit_evaluation(
        db: Session, proposal_id: str, evaluator_user: User, data: EvaluationCreate
    ) -> ProposalEvaluation:
        """Evaluator scores the proposal against challenge criteria."""
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        if (
            proposal.assigned_evaluator_ids
            and evaluator_user.id not in proposal.assigned_evaluator_ids
            and evaluator_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]
        ):
            raise HTTPException(status_code=403, detail="You are not an assigned evaluator for this proposal.")

        # Fetch challenge criteria
        challenge = db.query(Challenge).filter(Challenge.id == proposal.challenge_id).first()
        criteria_map = {c.id: c for c in challenge.evaluation_criteria} if challenge else {}

        scored_list = []
        total_weighted = 0.0

        for input_score in data.criterion_scores:
            crit = criteria_map.get(input_score.criterion_id)
            crit_name = crit.name if hasattr(crit, "name") else getattr(crit, "criterion_name", f"Criterion #{input_score.criterion_id[:6]}")
            crit_weight = float(crit.weight) if hasattr(crit, "weight") else float(getattr(crit, "weight_percentage", 1.0))

            # Deterministic weighted score calculation: (score / 10) * weight
            weighted_val = (input_score.score / 10.0) * crit_weight
            total_weighted += weighted_val

            scored_list.append({
                "criterion_id": input_score.criterion_id,
                "criterion_name": crit_name,
                "score": input_score.score,
                "max_score": 10.0,
                "weight": crit_weight,
                "weighted_score": round(weighted_val, 2),
                "comment": input_score.comment or "",
            })

        # Save evaluation record
        evaluation = (
            db.query(ProposalEvaluation)
            .filter(ProposalEvaluation.proposal_id == proposal_id, ProposalEvaluation.evaluator_id == evaluator_user.id)
            .first()
        )

        eval_user_name = getattr(evaluator_user, "name", getattr(evaluator_user, "full_name", "Evaluator"))
        if not evaluation:
            evaluation = ProposalEvaluation(
                proposal_id=proposal_id,
                evaluator_id=evaluator_user.id,
                evaluator_name=eval_user_name,
            )
            db.add(evaluation)

        evaluation.criterion_scores = scored_list
        evaluation.total_weighted_score = round(total_weighted, 2)
        evaluation.general_comments = data.general_comments
        evaluation.status = EvaluationStatus.COMPLETED
        evaluation.submitted_at = datetime.now(timezone.utc)

        # Update proposal status
        proposal.status = ProposalStatus.EVALUATION_IN_PROGRESS
        db.commit()

        # Check if all assigned evaluations are completed
        all_evals = (
            db.query(ProposalEvaluation)
            .filter(ProposalEvaluation.proposal_id == proposal_id)
            .all()
        )
        if all_evals and all(e.status == EvaluationStatus.COMPLETED for e in all_evals):
            proposal.status = ProposalStatus.EVALUATED
            db.commit()

        db.refresh(evaluation)

        AuditService.log_event(
            db=db,
            action=AuditAction.EVALUATION_SUBMITTED,
            entity_type="proposal",
            entity_id=proposal_id,
            summary=f"Evaluation submitted by {eval_user_name}. Score: {evaluation.total_weighted_score:.2f}%",
            actor=evaluator_user,
            details={"weighted_score": evaluation.total_weighted_score},
        )

        return evaluation

    @staticmethod
    def shortlist_proposal(
        db: Session, proposal_id: str, decision: ProposalStatus, reason: str, officer_user: User
    ) -> Proposal:
        """Officer shortlists or rejects proposal with mandatory reasoning."""
        if officer_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Only Government Officers can shortlist proposals.")

        if decision not in [ProposalStatus.SHORTLISTED, ProposalStatus.NOT_SHORTLISTED]:
            raise HTTPException(
                status_code=400,
                detail="Decision status must be SHORTLISTED or NOT_SHORTLISTED.",
            )

        if not reason or len(reason.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="A detailed officer justification (minimum 10 characters) is required for shortlisting actions.",
            )

        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        proposal.status = decision
        proposal.shortlist_reason = reason.strip()
        proposal.shortlisted_at = datetime.now(timezone.utc)
        proposal.shortlisted_by = officer_user.id

        db.commit()
        db.refresh(proposal)

        action_type = (
            AuditAction.PROPOSAL_SHORTLISTED
            if decision == ProposalStatus.SHORTLISTED
            else AuditAction.PROPOSAL_REJECTED
        )

        off_name = getattr(officer_user, "name", getattr(officer_user, "full_name", "Officer"))
        AuditService.log_event(
            db=db,
            action=action_type,
            entity_type="proposal",
            entity_id=proposal_id,
            summary=f"Proposal {decision.value} by {off_name}. Reason: '{reason}'",
            actor=officer_user,
            details={"reason": reason, "decision": decision.value},
        )

        return proposal

    @staticmethod
    def get_proposal(db: Session, proposal_id: str, user: User) -> Proposal:
        """Retrieve proposal by ID with access control."""
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found.")

        if user.role == UserRole.STARTUP:
            startup = db.query(Startup).filter(Startup.user_id == user.id).first()
            if not startup or startup.id != proposal.startup_id:
                raise HTTPException(status_code=403, detail="Not authorized to view this proposal.")

        elif user.role == UserRole.EVALUATOR:
            assigned = proposal.assigned_evaluator_ids or []
            if user.id not in assigned:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to view this proposal. You are not an assigned evaluator.",
                )

        return proposal

    @staticmethod
    def list_proposals(
        db: Session, user: User, challenge_id: Optional[str] = None, status: Optional[str] = None
    ) -> List[Proposal]:
        """List proposals filtered by user role and query filters."""
        query = db.query(Proposal)

        if user.role == UserRole.STARTUP:
            startup = db.query(Startup).filter(Startup.user_id == user.id).first()
            if not startup:
                return []
            query = query.filter(Proposal.startup_id == startup.id)
        elif user.role == UserRole.EVALUATOR:
            query = query.filter(Proposal.assigned_evaluator_ids.contains(user.id))

        if challenge_id:
            query = query.filter(Proposal.challenge_id == challenge_id)
        if status:
            query = query.filter(Proposal.status == status)

        return query.order_by(Proposal.created_at.desc()).all()
