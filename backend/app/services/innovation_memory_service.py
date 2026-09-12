"""
Innovation Memory Service — Creates, queries, and manages institutional knowledge entries.

Auto-generates memory entries from completed procurement decisions.
Finds related historical innovations for new challenges.
"""

import math
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.ai.memory_summarizer import MemorySummarizerFactory
from app.models.challenge import Challenge
from app.models.innovation_memory import InnovationMemory, MemoryOutcome, MemorySourceType
from app.models.pilot import (
    MilestoneStatus, Pilot, PilotKPI, PilotMilestone, PilotRisk,
    RiskSeverity, RiskStatus, TargetOperator,
)
from app.models.procurement import DecisionType, ProcurementDecision
from app.models.startup import Startup
from app.models.user import User
from app.schemas.innovation_memory import InnovationMemoryCreate, InnovationMemoryUpdate

logger = logging.getLogger(__name__)


class InnovationMemoryService:
    """Service for institutional innovation memory."""

    @staticmethod
    def create_memory_from_decision(
        db: Session, pilot: Pilot, decision: ProcurementDecision, actor: Optional[User] = None
    ) -> InnovationMemory:
        """
        Auto-generate an innovation memory entry from a completed procurement decision.
        Extracts actual KPI data, milestones, and risks — does NOT fabricate information.
        """
        challenge = db.query(Challenge).filter(Challenge.id == pilot.challenge_id).first()
        startup = db.query(Startup).filter(Startup.id == pilot.startup_id).first()

        challenge_title = challenge.title if challenge else "Unknown Challenge"
        challenge_domain = challenge.domain if challenge else "Unknown"
        startup_name = startup.company_name if startup else "Unknown Startup"

        # Extract KPI data from actual measurements
        kpi_data = []
        for kpi in (pilot.kpis or []):
            op = kpi.target_operator.value if isinstance(kpi.target_operator, TargetOperator) else str(kpi.target_operator)
            actual = kpi.latest_actual_value
            target = kpi.target_value
            met = False
            if actual is not None and target is not None:
                if op in [">=", ">"]:
                    met = actual >= target
                elif op in ["<=", "<"]:
                    met = actual <= target
                elif op == "=":
                    met = abs(actual - target) < 1e-6
            kpi_data.append({
                "name": kpi.name,
                "target": target,
                "actual": actual,
                "unit": kpi.unit,
                "operator": op,
                "met": met,
            })

        milestone_data = [
            {"name": m.name, "status": m.status.value if hasattr(m.status, "value") else str(m.status)}
            for m in (pilot.milestones or [])
        ]

        risk_data = [
            {
                "title": r.title,
                "severity": r.severity.value if hasattr(r.severity, "value") else str(r.severity),
                "status": r.status.value if hasattr(r.status, "value") else str(r.status),
            }
            for r in (pilot.risks or [])
        ]

        # Generate AI-assisted or rule-based summary
        summarizer = MemorySummarizerFactory.get_summarizer()
        insights = summarizer.summarize_pilot_outcome(
            challenge_title=challenge_title,
            challenge_domain=challenge_domain,
            startup_name=startup_name,
            pilot_kpis=kpi_data,
            pilot_milestones=milestone_data,
            pilot_risks=risk_data,
            decision_type=decision.decision.value if hasattr(decision.decision, "value") else str(decision.decision),
            decision_justification=decision.justification or "",
            decision_score=decision.ai_score or 0.0,
        )

        # Map decision type to outcome
        dec_val = decision.decision.value if hasattr(decision.decision, "value") else str(decision.decision)
        outcome_map = {"SCALE": "SCALE", "EXTEND": "EXTEND", "REJECT": "REJECT"}
        outcome = outcome_map.get(dec_val, dec_val)

        # Build technology string from challenge
        technology = ""
        if challenge and hasattr(challenge, "requirements"):
            tech_terms = [r.description for r in (challenge.requirements or []) if r.description]
            technology = "; ".join(tech_terms[:5])

        memory = InnovationMemory(
            source_type=MemorySourceType.DECISION.value,
            source_id=decision.id,
            title=f"{challenge_title} — {startup_name} ({dec_val})",
            summary=insights["summary"],
            domain=challenge_domain,
            technology=technology[:500] if technology else None,
            challenge_area=challenge.problem_statement[:200] if challenge and challenge.problem_statement else None,
            outcome=outcome,
            key_metrics=insights["key_metrics"],
            lessons_learned=insights["lessons_learned"],
            success_factors=insights["success_factors"],
            failure_factors=insights["failure_factors"],
            recommendations=insights["recommendations"],
            startup_id=pilot.startup_id,
            startup_name=startup_name,
            challenge_id=pilot.challenge_id,
            pilot_id=pilot.id,
            decision_id=decision.id,
            created_by=actor.id if actor else None,
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)
        return memory

    @staticmethod
    def create_memory_manual(
        db: Session, data: InnovationMemoryCreate, actor: User
    ) -> InnovationMemory:
        """Create a manual memory entry."""
        memory = InnovationMemory(
            source_type=MemorySourceType.CHALLENGE.value,
            source_id=data.challenge_id or data.pilot_id or "manual",
            title=data.title,
            summary=data.summary,
            domain=data.domain,
            technology=data.technology,
            challenge_area=data.challenge_area,
            outcome=data.outcome,
            key_metrics=data.key_metrics,
            lessons_learned=data.lessons_learned,
            success_factors=data.success_factors,
            failure_factors=data.failure_factors,
            recommendations=data.recommendations,
            challenge_id=data.challenge_id,
            pilot_id=data.pilot_id,
            startup_id=data.startup_id,
            created_by=actor.id,
        )
        db.add(memory)
        db.commit()
        db.refresh(memory)
        return memory

    @staticmethod
    def update_memory(
        db: Session, memory_id: str, data: InnovationMemoryUpdate
    ) -> Optional[InnovationMemory]:
        """Update mutable fields of a memory entry."""
        memory = db.query(InnovationMemory).filter(InnovationMemory.id == memory_id).first()
        if not memory:
            return None
        for field in ["title", "summary", "lessons_learned", "success_factors", "failure_factors", "recommendations"]:
            val = getattr(data, field, None)
            if val is not None:
                setattr(memory, field, val)
        db.commit()
        db.refresh(memory)
        return memory

    @staticmethod
    def get_memory(db: Session, memory_id: str) -> Optional[InnovationMemory]:
        return db.query(InnovationMemory).filter(InnovationMemory.id == memory_id).first()

    @staticmethod
    def list_memories(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        domain: Optional[str] = None,
        outcome: Optional[str] = None,
        technology: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Paginated, filterable memory list."""
        query = db.query(InnovationMemory)
        filters = []
        if domain:
            filters.append(InnovationMemory.domain.ilike(f"%{domain}%"))
        if outcome:
            filters.append(InnovationMemory.outcome == outcome)
        if technology:
            filters.append(InnovationMemory.technology.ilike(f"%{technology}%"))
        if search:
            s = f"%{search}%"
            filters.append(
                InnovationMemory.title.ilike(s)
                | InnovationMemory.summary.ilike(s)
                | InnovationMemory.domain.ilike(s)
                | InnovationMemory.startup_name.ilike(s)
            )
        if filters:
            query = query.filter(and_(*filters))

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))
        items = (
            query.order_by(InnovationMemory.created_at.desc())
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
    def find_related_memories(
        db: Session, challenge_id: str, limit: int = 5
    ) -> List[InnovationMemory]:
        """
        Find innovation memories related to a challenge by domain and technology overlap.
        Uses actual database matching — does NOT fabricate relevance.
        """
        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        if not challenge:
            return []

        query = db.query(InnovationMemory).filter(
            InnovationMemory.challenge_id != challenge_id  # Exclude self
        )

        # Build domain + technology match conditions
        conditions = []
        if challenge.domain:
            conditions.append(InnovationMemory.domain.ilike(f"%{challenge.domain}%"))
        if challenge.problem_statement:
            # Extract key terms
            words = [w for w in challenge.problem_statement.split() if len(w) > 4][:5]
            for word in words:
                conditions.append(
                    InnovationMemory.title.ilike(f"%{word}%")
                    | InnovationMemory.challenge_area.ilike(f"%{word}%")
                )

        if conditions:
            query = query.filter(or_(*conditions))

        return query.order_by(InnovationMemory.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_startup_platform_history(
        db: Session, startup_id: str
    ) -> List[InnovationMemory]:
        """Retrieve all memory entries for a specific startup."""
        return (
            db.query(InnovationMemory)
            .filter(InnovationMemory.startup_id == startup_id)
            .order_by(InnovationMemory.created_at.desc())
            .all()
        )
