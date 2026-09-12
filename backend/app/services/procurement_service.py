"""
Procurement Service — Business logic for Pilot Assessments, Final Procurement Decisions (SCALE/EXTEND/REJECT),
Decision History, and Public Procurement Scale-Up Transitions.
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.ai.pilot_assessor import PilotAssessmentFactory
from app.models.audit import AuditAction
from app.models.challenge import Challenge
from app.models.pilot import Pilot, PilotStatus
from app.models.procurement import (
    DecisionType,
    ProcurementDecision,
    ProcurementScaleUp,
    ScaleUpStatus,
)
from app.models.startup import Startup
from app.models.user import User, UserRole
from app.schemas.procurement import ProcurementDecisionCreate, ProcurementScaleUpUpdate
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class ProcurementService:
    """Service handling pilot assessment, human officer decisions, and scale-up transitions."""

    @staticmethod
    def get_pilot_for_assessment(db: Session, pilot_id: str) -> Pilot:
        """Fetch pilot with all telemetry needed for comprehensive assessment."""
        pilot = (
            db.query(Pilot)
            .options(
                joinedload(Pilot.kpis),
                joinedload(Pilot.milestones),
                joinedload(Pilot.risks),
                joinedload(Pilot.issues),
                joinedload(Pilot.evidence_files),
                joinedload(Pilot.challenge),
                joinedload(Pilot.startup),
                joinedload(Pilot.government_owner),
                joinedload(Pilot.decisions),
                joinedload(Pilot.scale_up),
            )
            .filter(Pilot.id == pilot_id)
            .first()
        )
        if not pilot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pilot project not found")
        return pilot

    @classmethod
    def generate_pilot_assessment(
        cls, db: Session, pilot_id: str, current_user: User
    ) -> Dict[str, Any]:
        """
        Generate or re-generate an AI-assisted pilot assessment based on actual telemetry.
        """
        pilot = cls.get_pilot_for_assessment(db, pilot_id)

        # Allow assessment on active, completed, or ready pilots
        assessor = PilotAssessmentFactory.get_assessor()
        assessment = assessor.assess_pilot(pilot)

        # Log audit event
        AuditService.log_event(
            db=db,
            action=AuditAction.ASSESSMENT_GENERATED,
            entity_type="pilot",
            entity_id=pilot.id,
            actor=current_user,
            summary=f"AI Pilot Assessment generated: {assessment['recommendation']} (Score: {assessment['overall_score']}/100, Confidence: {assessment['confidence']}%)",
            details={
                "overall_score": assessment["overall_score"],
                "kpi_performance": assessment["kpi_performance"],
                "milestone_performance": assessment["milestone_performance"],
                "risk_level": assessment["risk_level"],
                "confidence": assessment["confidence"],
                "recommendation": assessment["recommendation"],
            },
        )

        return assessment

    @classmethod
    def create_procurement_decision(
        cls, db: Session, pilot_id: str, input_data: ProcurementDecisionCreate, current_user: User
    ) -> ProcurementDecision:
        """
        Human officer submits binding final decision (SCALE, EXTEND, or REJECT).
        Enforces validation, updates state machine, creates ScaleUp if SCALE, and logs audit events.
        """
        # RBAC Check
        if current_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only authorized Government Officers or Administrators can make final procurement decisions.",
            )

        pilot = cls.get_pilot_for_assessment(db, pilot_id)

        # Validate pilot status is eligible
        ineligible_statuses = [PilotStatus.DRAFT, PilotStatus.SCHEDULED]
        if pilot.status in ineligible_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot assess pilot in '{pilot.status.value}' state. Pilot must have commenced or completed execution.",
            )

        # Specific decision input validations
        if input_data.decision == DecisionType.EXTEND:
            if not input_data.extension_duration or input_data.extension_duration <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Extension duration in days (> 0) is mandatory when extending a pilot.",
                )
        elif input_data.decision == DecisionType.REJECT:
            if not input_data.rejection_reason or len(input_data.rejection_reason.strip()) < 5:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="A clear rejection reason is mandatory when rejecting a pilot solution.",
                )

        # Generate fresh official assessment snapshot for immutable record keeping
        assessor = PilotAssessmentFactory.get_assessor()
        assessment = assessor.assess_pilot(pilot)

        now = datetime.now(timezone.utc)

        # Create ProcurementDecision record
        decision = ProcurementDecision(
            pilot_id=pilot.id,
            challenge_id=pilot.challenge_id,
            startup_id=pilot.startup_id,
            decision=input_data.decision,
            ai_recommendation=DecisionType(assessment["recommendation"]),
            ai_score=assessment["overall_score"],
            ai_confidence=assessment["confidence"],
            justification=input_data.justification,
            decided_by=current_user.id,
            decided_at=now,
            extension_duration=input_data.extension_duration,
            extension_reason=input_data.extension_reason,
            rejection_reason=input_data.rejection_reason,
            assessment_snapshot=assessment,
        )
        db.add(decision)
        db.flush()

        # State Transitions & Artifact Creation
        if input_data.decision == DecisionType.SCALE:
            pilot.status = PilotStatus.SCALED
            if not pilot.completed_at:
                pilot.completed_at = now

            # Snapshot approved KPIs
            approved_kpis = []
            for k in (pilot.kpis or []):
                op = k.target_operator.value if hasattr(k.target_operator, "value") else str(k.target_operator)
                approved_kpis.append({
                    "name": k.name,
                    "target": f"{op} {k.target_value} {k.unit}",
                    "achieved": f"{k.latest_actual_value} {k.unit}" if k.latest_actual_value is not None else "Unmeasured",
                    "status": k.status.value if hasattr(k.status, "value") else str(k.status),
                    "weight": k.weight,
                })

            # Check if scale-up record already exists (e.g. re-decision)
            existing_scale_up = db.query(ProcurementScaleUp).filter(ProcurementScaleUp.pilot_id == pilot.id).first()
            if not existing_scale_up:
                dept_id = pilot.challenge.department_id if pilot.challenge else None
                scale_up = ProcurementScaleUp(
                    pilot_id=pilot.id,
                    decision_id=decision.id,
                    challenge_id=pilot.challenge_id,
                    startup_id=pilot.startup_id,
                    department_id=dept_id,
                    solution_name=pilot.name,
                    pilot_outcome_summary=f"Pilot validated with score {assessment['overall_score']}/100. KPI performance: {assessment['kpi_performance']}%.",
                    approved_kpis=approved_kpis,
                    proposed_scale_scope=pilot.scope or "Department-wide jurisdiction deployment.",
                    status=ScaleUpStatus.READY_FOR_PROCUREMENT,
                    target_completion_date=now + timedelta(days=180),
                )
                db.add(scale_up)
            else:
                existing_scale_up.decision_id = decision.id
                existing_scale_up.status = ScaleUpStatus.READY_FOR_PROCUREMENT

            AuditService.log_event(
                db=db,
                action=AuditAction.SCALE_UP_CREATED,
                entity_type="scale_up",
                entity_id=pilot.id,
                actor=current_user,
                summary=f"Pilot approved for SCALE by {current_user.name}. Transitioned to Public Procurement stage.",
                details={"decision_id": decision.id, "pilot_id": pilot.id},
            )

        elif input_data.decision == DecisionType.EXTEND:
            pilot.status = PilotStatus.EXTENDED
            # Extend planned end date
            duration_days = input_data.extension_duration or 30
            pilot.end_date = pilot.end_date + timedelta(days=duration_days)
            note = f"\n[EXTENDED on {now.strftime('%Y-%m-%d')} for {duration_days} days by {current_user.name}]: {input_data.extension_reason or input_data.justification}"
            pilot.government_team_notes = (pilot.government_team_notes or "") + note

            AuditService.log_event(
                db=db,
                action=AuditAction.PILOT_EXTENDED,
                entity_type="pilot",
                entity_id=pilot.id,
                actor=current_user,
                summary=f"Pilot extended by {input_data.extension_duration} days by {current_user.name}. New end date: {pilot.end_date.strftime('%Y-%m-%d')}.",
                details={"extension_days": input_data.extension_duration, "reason": input_data.extension_reason},
            )

        elif input_data.decision == DecisionType.REJECT:
            pilot.status = PilotStatus.CLOSED
            note = f"\n[CLOSED/REJECTED on {now.strftime('%Y-%m-%d')} by {current_user.name}]: {input_data.rejection_reason or input_data.justification}"
            pilot.government_team_notes = (pilot.government_team_notes or "") + note

            AuditService.log_event(
                db=db,
                action=AuditAction.PILOT_CLOSED,
                entity_type="pilot",
                entity_id=pilot.id,
                actor=current_user,
                summary=f"Pilot solution rejected and closed by {current_user.name}. Reason: {input_data.rejection_reason}.",
                details={"rejection_reason": input_data.rejection_reason},
            )

        AuditService.log_event(
            db=db,
            action=AuditAction.DECISION_CREATED,
            entity_type="pilot",
            entity_id=pilot.id,
            actor=current_user,
            summary=f"Official Procurement Decision '{input_data.decision.value}' recorded by {current_user.name}.",
            details={
                "decision": input_data.decision.value,
                "ai_recommendation": assessment["recommendation"],
                "justification": input_data.justification,
            },
        )

        db.commit()
        db.refresh(decision)

        # Auto-create InnovationMemory from completed pilot + decision
        try:
            from app.services.innovation_memory_service import InnovationMemoryService
            InnovationMemoryService.create_memory_from_decision(
                db=db, pilot=pilot, decision=decision, actor=current_user
            )
        except Exception as e:
            logger.warning(f"Failed to auto-create InnovationMemory: {e}")

        return decision

    @classmethod
    def get_decision_history(cls, db: Session, pilot_id: str, current_user: User) -> List[ProcurementDecision]:
        """Retrieve chronological decision history for a pilot project."""
        decisions = (
            db.query(ProcurementDecision)
            .options(
                joinedload(ProcurementDecision.decided_by_user),
                joinedload(ProcurementDecision.scale_up_record),
            )
            .filter(ProcurementDecision.pilot_id == pilot_id)
            .order_by(ProcurementDecision.decided_at.desc())
            .all()
        )
        return decisions

    @classmethod
    def list_scale_up_projects(
        cls,
        db: Session,
        current_user: User,
        status_filter: Optional[ScaleUpStatus] = None,
        department_id: Optional[str] = None,
    ) -> List[ProcurementScaleUp]:
        """List all solutions that transitioned to the scale-up / procurement stage."""
        query = (
            db.query(ProcurementScaleUp)
            .options(
                joinedload(ProcurementScaleUp.startup),
                joinedload(ProcurementScaleUp.challenge),
                joinedload(ProcurementScaleUp.department),
                joinedload(ProcurementScaleUp.decision),
                joinedload(ProcurementScaleUp.pilot),
            )
        )

        if current_user.role == UserRole.STARTUP:
            startup = db.query(Startup).filter(Startup.user_id == current_user.id).first()
            if startup:
                query = query.filter(ProcurementScaleUp.startup_id == startup.id)
            else:
                return []
        elif current_user.role == UserRole.GOVERNMENT_OFFICER:
            if department_id:
                query = query.filter(ProcurementScaleUp.department_id == department_id)
            elif current_user.department_id:
                query = query.filter(ProcurementScaleUp.department_id == current_user.department_id)

        if status_filter:
            query = query.filter(ProcurementScaleUp.status == status_filter)

        return query.order_by(ProcurementScaleUp.created_at.desc()).all()

    @classmethod
    def get_scale_up_by_id(cls, db: Session, scale_up_id: str) -> ProcurementScaleUp:
        """Fetch a specific scale-up project by ID."""
        project = (
            db.query(ProcurementScaleUp)
            .options(
                joinedload(ProcurementScaleUp.startup),
                joinedload(ProcurementScaleUp.challenge),
                joinedload(ProcurementScaleUp.department),
                joinedload(ProcurementScaleUp.decision),
                joinedload(ProcurementScaleUp.pilot),
            )
            .filter(ProcurementScaleUp.id == scale_up_id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scale-up procurement project not found")
        return project

    @classmethod
    def update_scale_up_project(
        cls, db: Session, scale_up_id: str, update_data: ProcurementScaleUpUpdate, current_user: User
    ) -> ProcurementScaleUp:
        """Government officer updates scale-up status, budget, target dates, or procurement notes."""
        if current_user.role not in [UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Government Officers or Admins can update procurement scale-up status.",
            )

        project = cls.get_scale_up_by_id(db, scale_up_id)

        old_status = project.status
        if update_data.status is not None:
            project.status = update_data.status

        if update_data.budget_allocation is not None:
            project.budget_allocation = update_data.budget_allocation

        if update_data.target_completion_date is not None:
            project.target_completion_date = update_data.target_completion_date

        if update_data.procurement_notes is not None:
            project.procurement_notes = update_data.procurement_notes

        AuditService.log_event(
            db=db,
            action=AuditAction.SCALE_UP_STATUS_CHANGED,
            entity_type="scale_up",
            entity_id=project.id,
            actor=current_user,
            summary=f"Procurement Scale-Up project status updated from {old_status.value} to {project.status.value} by {current_user.name}.",
            details={"old_status": old_status.value, "new_status": project.status.value},
        )

        db.commit()
        db.refresh(project)
        return project
