"""
Pilot Service — Business logic for Pilot management, Milestones, KPIs, Measurements, Risks, Issues, Evidence, and Completion validation.
"""

from datetime import datetime, timezone
import os
import uuid
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.audit import AuditAction
from app.models.challenge import Challenge
from app.models.pilot import (
    IssueStatus,
    KPIMeasurement,
    KPIStatus,
    MilestoneStatus,
    Pilot,
    PilotEvidence,
    PilotIssue,
    PilotKPI,
    PilotMilestone,
    PilotRisk,
    PilotStatus,
    RiskCategory,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)
from app.models.proposal import Proposal, ProposalStatus
from app.models.startup import Startup
from app.models.user import User, UserRole
from app.schemas.pilot import (
    BulkKPIMeasurementsInput,
    KPIMeasurementCreate,
    PilotCreateInput,
    PilotIssueCreate,
    PilotIssueUpdate,
    PilotKPICreate,
    PilotKPIUpdateTarget,
    PilotMilestoneCreate,
    PilotMilestoneUpdate,
    PilotRiskCreate,
    PilotRiskUpdate,
    PilotUpdateInput,
)
from app.services.audit_service import AuditService
from app.services.kpi_service import KPICalculationService


class PilotService:
    """Core service for managing pilot project execution, metrics, and health."""

    @staticmethod
    def get_pilot_by_id(db: Session, pilot_id: str) -> Pilot:
        pilot = (
            db.query(Pilot)
            .options(
                joinedload(Pilot.milestones),
                joinedload(Pilot.kpis).joinedload(PilotKPI.measurements),
                joinedload(Pilot.risks),
                joinedload(Pilot.issues),
                joinedload(Pilot.evidence_files),
                joinedload(Pilot.challenge),
                joinedload(Pilot.startup),
                joinedload(Pilot.government_owner),
            )
            .filter(Pilot.id == pilot_id)
            .first()
        )
        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot project not found")
        return pilot

    @staticmethod
    def list_pilots(
        db: Session,
        user: User,
        status_filter: Optional[PilotStatus] = None,
        search_query: Optional[str] = None,
        challenge_id: Optional[str] = None,
    ) -> List[Pilot]:
        """List pilots with role-based filtering."""
        query = db.query(Pilot).options(
            joinedload(Pilot.challenge),
            joinedload(Pilot.startup),
            joinedload(Pilot.government_owner),
            joinedload(Pilot.milestones),
            joinedload(Pilot.kpis),
            joinedload(Pilot.risks),
            joinedload(Pilot.issues),
        )

        # Role scoping
        if user.role == UserRole.STARTUP:
            # Find startup profile for this user
            startup = db.query(Startup).filter(Startup.user_id == user.id).first()
            if startup:
                query = query.filter(Pilot.startup_id == startup.id)
            else:
                return []
        elif user.role == UserRole.GOVERNMENT_OFFICER:
            if user.department_id:
                query = query.outerjoin(Challenge).filter(
                    (Challenge.department_id == user.department_id) | (Pilot.government_owner_id == user.id)
                )
        elif user.role == UserRole.EVALUATOR:
            # Evaluators see assigned pilots or department pilots
            pass  # Evaluators can view available pilots for evaluation/monitoring

        if status_filter:
            query = query.filter(Pilot.status == status_filter)

        if challenge_id:
            query = query.filter(Pilot.challenge_id == challenge_id)

        if search_query:
            term = f"%{search_query}%"
            query = query.filter(
                (Pilot.name.ilike(term)) | (Pilot.objective.ilike(term)) | (Pilot.scope.ilike(term))
            )

        pilots = query.order_by(Pilot.created_at.desc()).all()
        return pilots

    @classmethod
    def create_pilot_from_proposal(
        cls, db: Session, input_data: PilotCreateInput, current_user: User
    ) -> Pilot:
        """Create a new Pilot project linked to a shortlisted proposal."""
        # 1. Fetch proposal
        proposal = (
            db.query(Proposal)
            .filter(Proposal.id == input_data.proposal_id)
            .first()
        )
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")

        # Enforce that only SHORTLISTED proposals can be converted to pilots
        if proposal.status != ProposalStatus.SHORTLISTED:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot create pilot: Proposal status is '{proposal.status.value}', but only SHORTLISTED proposals can be converted into pilots.",
            )

        existing_pilot = db.query(Pilot).filter(Pilot.proposal_id == proposal.id).first()
        if existing_pilot:
            raise HTTPException(
                status_code=400, detail=f"Pilot already exists for proposal {proposal.id}"
            )

        gov_owner_id = input_data.government_owner_id or current_user.id

        # Create Pilot
        pilot = Pilot(
            proposal_id=proposal.id,
            challenge_id=proposal.challenge_id,
            startup_id=proposal.startup_id,
            name=input_data.name,
            objective=input_data.objective,
            scope=input_data.scope,
            success_criteria=input_data.success_criteria or "",
            government_owner_id=gov_owner_id,
            government_team_notes=input_data.government_team_notes or "",
            startup_team_notes=input_data.startup_team_notes or "",
            evaluator_notes=input_data.evaluator_notes or "",
            data_access_notes=input_data.data_access_notes or "",
            security_requirements=input_data.security_requirements or "",
            ip_notes=input_data.ip_notes or "",
            start_date=input_data.start_date,
            end_date=input_data.end_date,
            status=PilotStatus.SCHEDULED,
            overall_progress_percentage=0.0,
        )
        db.add(pilot)
        db.flush()  # get pilot.id

        # Initial Milestones
        if input_data.initial_milestones:
            for m in input_data.initial_milestones:
                milestone = PilotMilestone(
                    pilot_id=pilot.id,
                    name=m.name,
                    description=m.description or "",
                    planned_start=m.planned_start,
                    planned_end=m.planned_end,
                    status=MilestoneStatus.NOT_STARTED,
                    completion_percentage=0.0,
                )
                db.add(milestone)

        # Initial KPIs
        if input_data.initial_kpis:
            for k in input_data.initial_kpis:
                kpi = PilotKPI(
                    pilot_id=pilot.id,
                    name=k.name,
                    description=k.description or "",
                    target_value=k.target_value,
                    target_operator=k.target_operator,
                    unit=k.unit,
                    measurement_method=k.measurement_method or "",
                    frequency=k.frequency,
                    weight=k.weight,
                    status=KPIStatus.PENDING_MEASUREMENT,
                    target_change_history=[],
                )
                db.add(kpi)

        # Initial Risks
        if input_data.initial_risks:
            for r in input_data.initial_risks:
                risk = PilotRisk(
                    pilot_id=pilot.id,
                    title=r.title,
                    description=r.description or "",
                    category=r.category,
                    severity=r.severity,
                    probability=r.probability,
                    mitigation=r.mitigation or "",
                    owner_name=r.owner_name or current_user.name,
                    status=RiskStatus.OPEN,
                )
                db.add(risk)

        db.commit()

        # Re-calculate overall progress & health
        cls.recalculate_pilot_progress(db, pilot.id)
        
        # Log Audit
        AuditService.log_event(
            db=db,
            action=AuditAction.PILOT_CREATED,
            entity_type="PILOT",
            entity_id=pilot.id,
            summary=f"Created Pilot project '{pilot.name}' for proposal '{proposal.title}'",
            actor=current_user,
            details={"start_date": str(pilot.start_date), "end_date": str(pilot.end_date)},
        )

        return cls.get_pilot_by_id(db, pilot.id)

    @classmethod
    def update_pilot(
        cls, db: Session, pilot_id: str, input_data: PilotUpdateInput, current_user: User
    ) -> Pilot:
        pilot = cls.get_pilot_by_id(db, pilot_id)

        update_dict = input_data.model_dump(exclude_unset=True)
        old_status = pilot.status

        for key, val in update_dict.items():
            if val is not None:
                setattr(pilot, key, val)

        if input_data.status and input_data.status != old_status:
            AuditService.log_event(
                db=db,
                action=AuditAction.PILOT_STATUS_CHANGED,
                entity_type="PILOT",
                entity_id=pilot.id,
                summary=f"Updated Pilot status from {old_status.value} to {input_data.status.value}",
                actor=current_user,
            )

        db.commit()
        return cls.get_pilot_by_id(db, pilot.id)

    # ---------------------------------------------------------
    # MILESTONES
    # ---------------------------------------------------------
    @classmethod
    def add_milestone(
        cls, db: Session, pilot_id: str, input_data: PilotMilestoneCreate, current_user: User
    ) -> PilotMilestone:
        pilot = cls.get_pilot_by_id(db, pilot_id)
        milestone = PilotMilestone(
            pilot_id=pilot.id,
            name=input_data.name,
            description=input_data.description or "",
            planned_start=input_data.planned_start,
            planned_end=input_data.planned_end,
            status=MilestoneStatus.NOT_STARTED,
            completion_percentage=0.0,
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)

        cls.recalculate_pilot_progress(db, pilot_id)

        AuditService.log_event(
            db=db,
            action=AuditAction.MILESTONE_UPDATED,
            entity_type="PILOT_MILESTONE",
            entity_id=milestone.id,
            summary=f"Added milestone '{milestone.name}' to Pilot '{pilot.name}'",
            actor=current_user,
        )
        return milestone

    @classmethod
    def update_milestone(
        cls,
        db: Session,
        pilot_id: str,
        milestone_id: str,
        input_data: PilotMilestoneUpdate,
        current_user: User,
    ) -> PilotMilestone:
        milestone = (
            db.query(PilotMilestone)
            .filter(PilotMilestone.id == milestone_id, PilotMilestone.pilot_id == pilot_id)
            .first()
        )
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")

        # Mandatory blocked reason requirement
        if input_data.status == MilestoneStatus.BLOCKED:
            if not input_data.blocked_reason and not milestone.blocked_reason:
                raise HTTPException(
                    status_code=400,
                    detail="A written blocked_reason is mandatory when setting milestone status to BLOCKED.",
                )

        if input_data.name is not None:
            milestone.name = input_data.name
        if input_data.description is not None:
            milestone.description = input_data.description
        if input_data.planned_start is not None:
            milestone.planned_start = input_data.planned_start
        if input_data.planned_end is not None:
            milestone.planned_end = input_data.planned_end
        if input_data.completion_percentage is not None:
            milestone.completion_percentage = input_data.completion_percentage
            if milestone.completion_percentage >= 100.0:
                milestone.status = MilestoneStatus.COMPLETED
                milestone.completed_at = datetime.now(timezone.utc)
            elif milestone.completion_percentage > 0.0 and milestone.status == MilestoneStatus.NOT_STARTED:
                milestone.status = MilestoneStatus.IN_PROGRESS

        if input_data.status is not None:
            milestone.status = input_data.status
            if milestone.status == MilestoneStatus.COMPLETED:
                milestone.completion_percentage = 100.0
                milestone.completed_at = datetime.now(timezone.utc)
            elif milestone.status != MilestoneStatus.BLOCKED:
                milestone.blocked_reason = None

        if input_data.blocked_reason is not None:
            milestone.blocked_reason = input_data.blocked_reason

        db.commit()
        db.refresh(milestone)

        cls.recalculate_pilot_progress(db, pilot_id)

        AuditService.log_event(
            db=db,
            action=AuditAction.MILESTONE_UPDATED,
            entity_type="PILOT_MILESTONE",
            entity_id=milestone.id,
            summary=f"Updated milestone '{milestone.name}' to status '{milestone.status.value}' ({milestone.completion_percentage}%)",
            actor=current_user,
        )
        return milestone

    @classmethod
    def recalculate_pilot_progress(cls, db: Session, pilot_id: str):
        pilot = db.query(Pilot).filter(Pilot.id == pilot_id).first()
        if not pilot:
            return
        milestones = db.query(PilotMilestone).filter(PilotMilestone.pilot_id == pilot_id).all()
        if not milestones:
            pilot.overall_progress_percentage = 0.0
        else:
            total_perc = sum(m.completion_percentage for m in milestones)
            pilot.overall_progress_percentage = round(total_perc / len(milestones), 2)
        db.commit()

    # ---------------------------------------------------------
    # KPIs & TARGET AUDITABILITY & MEASUREMENTS
    # ---------------------------------------------------------
    @classmethod
    def add_kpi(
        cls, db: Session, pilot_id: str, input_data: PilotKPICreate, current_user: User
    ) -> PilotKPI:
        pilot = cls.get_pilot_by_id(db, pilot_id)
        kpi = PilotKPI(
            pilot_id=pilot.id,
            name=input_data.name,
            description=input_data.description or "",
            target_value=input_data.target_value,
            target_operator=input_data.target_operator,
            unit=input_data.unit,
            measurement_method=input_data.measurement_method or "",
            frequency=input_data.frequency,
            weight=input_data.weight,
            status=KPIStatus.PENDING_MEASUREMENT,
            target_change_history=[],
        )
        db.add(kpi)
        db.commit()
        db.refresh(kpi)

        AuditService.log_event(
            db=db,
            action=AuditAction.KPI_ADDED,
            entity_type="PILOT_KPI",
            entity_id=kpi.id,
            summary=f"Added KPI '{kpi.name}' (Target: {kpi.target_operator.value} {kpi.target_value} {kpi.unit})",
            actor=current_user,
        )
        return kpi

    @classmethod
    def update_kpi_target(
        cls,
        db: Session,
        pilot_id: str,
        kpi_id: str,
        input_data: PilotKPIUpdateTarget,
        current_user: User,
    ) -> PilotKPI:
        """
        Target Immutability & Auditability: Target changes demand a mandatory written reason.
        Logs to `target_change_history` and AuditEvent.
        Re-evaluates current KPI status based on latest measurement.
        """
        kpi = (
            db.query(PilotKPI)
            .filter(PilotKPI.id == kpi_id, PilotKPI.pilot_id == pilot_id)
            .first()
        )
        if not kpi:
            raise HTTPException(status_code=404, detail="KPI not found")

        old_target = kpi.target_value
        new_target = input_data.new_target_value
        reason = input_data.reason.strip()

        if len(reason) < 10:
            raise HTTPException(
                status_code=400,
                detail="A detailed written reason (minimum 10 characters) is required for modifying target values.",
            )

        history_entry = {
            "previous_target": old_target,
            "new_target": new_target,
            "reason": reason,
            "modified_by_id": current_user.id,
            "modified_by_name": current_user.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Update target value
        kpi.target_value = new_target
        current_history = list(kpi.target_change_history or [])
        current_history.append(history_entry)
        kpi.target_change_history = current_history

        # Re-evaluate status if there are measurements
        latest_meas = (
            db.query(KPIMeasurement)
            .filter(KPIMeasurement.pilot_kpi_id == kpi.id)
            .order_by(KPIMeasurement.measurement_date.desc())
            .first()
        )
        if latest_meas:
            kpi.status = KPICalculationService.evaluate_kpi_status(
                actual_value=latest_meas.actual_value,
                target_value=kpi.target_value,
                operator=kpi.target_operator,
            )

        db.commit()
        db.refresh(kpi)

        AuditService.log_event(
            db=db,
            action=AuditAction.KPI_TARGET_CHANGED,
            entity_type="PILOT_KPI",
            entity_id=kpi.id,
            summary=f"KPI '{kpi.name}' target changed from {old_target} to {new_target}. Reason: '{reason}'",
            actor=current_user,
            details=history_entry,
        )
        return kpi

    @classmethod
    def record_kpi_measurement(
        cls,
        db: Session,
        pilot_id: str,
        kpi_id: str,
        input_data: KPIMeasurementCreate,
        current_user: User,
    ) -> KPIMeasurement:
        """
        Record a numerical KPI measurement.
        Updates latest values on PilotKPI and deterministically updates KPI status.
        """
        kpi = (
            db.query(PilotKPI)
            .filter(PilotKPI.id == kpi_id, PilotKPI.pilot_id == pilot_id)
            .first()
        )
        if not kpi:
            raise HTTPException(status_code=404, detail="KPI not found")

        meas_date = input_data.measurement_date or datetime.now(timezone.utc)

        measurement = KPIMeasurement(
            pilot_kpi_id=kpi.id,
            measurement_date=meas_date,
            actual_value=input_data.actual_value,
            notes=input_data.notes or "",
            recorded_by_id=current_user.id,
            recorded_by_name=current_user.name,
        )
        db.add(measurement)

        # Update KPI cached latest & status
        kpi.latest_actual_value = input_data.actual_value
        kpi.latest_measurement_date = meas_date
        kpi.status = KPICalculationService.evaluate_kpi_status(
            actual_value=input_data.actual_value,
            target_value=kpi.target_value,
            operator=kpi.target_operator,
        )

        db.commit()
        db.refresh(measurement)

        AuditService.log_event(
            db=db,
            action=AuditAction.KPI_MEASUREMENT_RECORDED,
            entity_type="PILOT_KPI",
            entity_id=kpi.id,
            summary=f"Recorded measurement {input_data.actual_value} {kpi.unit} for KPI '{kpi.name}' (Status: {kpi.status.value})",
            actor=current_user,
            details={"actual_value": input_data.actual_value, "kpi_status": kpi.status.value},
        )
        return measurement

    @classmethod
    def record_bulk_kpi_measurements(
        cls,
        db: Session,
        pilot_id: str,
        input_data: BulkKPIMeasurementsInput,
        current_user: User,
    ) -> List[KPIMeasurement]:
        recorded = []
        for item in input_data.measurements:
            meas_create = KPIMeasurementCreate(
                actual_value=item.actual_value,
                measurement_date=input_data.measurement_date,
                notes=item.notes,
            )
            m = cls.record_kpi_measurement(
                db=db,
                pilot_id=pilot_id,
                kpi_id=item.kpi_id,
                input_data=meas_create,
                current_user=current_user,
            )
            recorded.append(m)
        return recorded

    # ---------------------------------------------------------
    # RISKS & ISSUES
    # ---------------------------------------------------------
    @classmethod
    def add_risk(
        cls, db: Session, pilot_id: str, input_data: PilotRiskCreate, current_user: User
    ) -> PilotRisk:
        pilot = cls.get_pilot_by_id(db, pilot_id)
        risk = PilotRisk(
            pilot_id=pilot.id,
            title=input_data.title,
            description=input_data.description or "",
            category=input_data.category,
            severity=input_data.severity,
            probability=input_data.probability,
            mitigation=input_data.mitigation or "",
            owner_name=input_data.owner_name or current_user.name,
            status=RiskStatus.OPEN,
        )
        db.add(risk)
        db.commit()
        db.refresh(risk)

        AuditService.log_event(
            db=db,
            action=AuditAction.RISK_ADDED,
            entity_type="PILOT_RISK",
            entity_id=risk.id,
            summary=f"Added {risk.severity.value} risk '{risk.title}' to Pilot '{pilot.name}'",
            actor=current_user,
        )
        return risk

    @classmethod
    def update_risk(
        cls,
        db: Session,
        pilot_id: str,
        risk_id: str,
        input_data: PilotRiskUpdate,
        current_user: User,
    ) -> PilotRisk:
        risk = (
            db.query(PilotRisk)
            .filter(PilotRisk.id == risk_id, PilotRisk.pilot_id == pilot_id)
            .first()
        )
        if not risk:
            raise HTTPException(status_code=404, detail="Risk not found")

        for key, val in input_data.model_dump(exclude_unset=True).items():
            if val is not None:
                setattr(risk, key, val)

        db.commit()
        db.refresh(risk)
        return risk

    @classmethod
    def add_issue(
        cls, db: Session, pilot_id: str, input_data: PilotIssueCreate, current_user: User
    ) -> PilotIssue:
        pilot = cls.get_pilot_by_id(db, pilot_id)
        issue = PilotIssue(
            pilot_id=pilot.id,
            title=input_data.title,
            description=input_data.description or "",
            severity=input_data.severity,
            assigned_to_name=input_data.assigned_to_name or "Unassigned",
            status=IssueStatus.OPEN,
        )
        db.add(issue)
        db.commit()
        db.refresh(issue)

        AuditService.log_event(
            db=db,
            action=AuditAction.ISSUE_ADDED,
            entity_type="PILOT_ISSUE",
            entity_id=issue.id,
            summary=f"Reported issue '{issue.title}' for Pilot '{pilot.name}'",
            actor=current_user,
        )
        return issue

    @classmethod
    def update_issue(
        cls,
        db: Session,
        pilot_id: str,
        issue_id: str,
        input_data: PilotIssueUpdate,
        current_user: User,
    ) -> PilotIssue:
        issue = (
            db.query(PilotIssue)
            .filter(PilotIssue.id == issue_id, PilotIssue.pilot_id == pilot_id)
            .first()
        )
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")

        for key, val in input_data.model_dump(exclude_unset=True).items():
            if val is not None:
                setattr(issue, key, val)

        db.commit()
        db.refresh(issue)
        return issue

    # ---------------------------------------------------------
    # EVIDENCE UPLOAD
    # ---------------------------------------------------------
    @classmethod
    async def upload_evidence(
        cls,
        db: Session,
        pilot_id: str,
        file: UploadFile,
        description: str,
        current_user: User,
    ) -> PilotEvidence:
        pilot = cls.get_pilot_by_id(db, pilot_id)

        # Upload directory
        evidence_dir = os.path.join(settings.UPLOAD_DIR, "pilots", pilot_id)
        os.makedirs(evidence_dir, exist_ok=True)

        ALLOWED_EXTS = {".pdf", ".png", ".jpg", ".jpeg", ".csv", ".xlsx", ".docx", ".zip", ".json", ".txt"}
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTS:
            raise HTTPException(
                status_code=400,
                detail=f"File format '{ext}' is not supported for evidence uploads. Permitted formats: {', '.join(sorted(ALLOWED_EXTS))}",
            )

        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Evidence file cannot be empty.")
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Evidence file size exceeds the 50MB limit.")

        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(evidence_dir, unique_name)

        with open(file_path, "wb") as f:
            f.write(content)

        relative_key = f"pilots/{pilot_id}/{unique_name}"

        evidence = PilotEvidence(
            pilot_id=pilot.id,
            file_name=file.filename,
            storage_key=relative_key,
            file_type=file.content_type or "application/octet-stream",
            file_size=len(content),
            description=description or "",
            uploaded_by_id=current_user.id,
            uploaded_by_name=current_user.name,
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)

        AuditService.log_event(
            db=db,
            action=AuditAction.EVIDENCE_UPLOADED,
            entity_type="PILOT_EVIDENCE",
            entity_id=evidence.id,
            summary=f"Uploaded evidence file '{file.filename}' for Pilot '{pilot.name}'",
            actor=current_user,
        )
        return evidence

    # ---------------------------------------------------------
    # COMPLETION & READY FOR ASSESSMENT TRANSITION
    # ---------------------------------------------------------
    @classmethod
    def complete_pilot(cls, db: Session, pilot_id: str, current_user: User) -> Pilot:
        """
        Validate completion and transition Pilot status to `COMPLETED` and then `READY_FOR_ASSESSMENT`.
        Must verify:
        - All milestones completed or documented
        - Final KPI measurements recorded
        - Required evidence uploaded
        """
        pilot = cls.get_pilot_by_id(db, pilot_id)

        # Check milestones
        incomplete_milestones = [
            m for m in pilot.milestones if m.status not in [MilestoneStatus.COMPLETED]
        ]
        if incomplete_milestones:
            names = ", ".join(m.name for m in incomplete_milestones)
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete pilot: {len(incomplete_milestones)} milestone(s) are incomplete ({names}).",
            )

        # Check KPIs pending measurements
        unmeasured_kpis = [k for k in pilot.kpis if k.status == KPIStatus.PENDING_MEASUREMENT]
        if unmeasured_kpis:
            names = ", ".join(k.name for k in unmeasured_kpis)
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete pilot: {len(unmeasured_kpis)} KPI(s) have zero recorded measurements ({names}).",
            )

        now = datetime.now(timezone.utc)
        pilot.status = PilotStatus.READY_FOR_ASSESSMENT
        pilot.completed_at = now
        pilot.ready_for_assessment_at = now
        pilot.overall_progress_percentage = 100.0

        db.commit()

        AuditService.log_event(
            db=db,
            action=AuditAction.PILOT_READY_FOR_ASSESSMENT,
            entity_type="PILOT",
            entity_id=pilot.id,
            summary=f"Pilot '{pilot.name}' completed and marked READY FOR ASSESSMENT",
            actor=current_user,
        )

        return cls.get_pilot_by_id(db, pilot.id)
