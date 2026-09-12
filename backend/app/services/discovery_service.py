"""
Discovery Service — Coordinates AI Startup Discovery for challenges & startup comparison.
"""

from typing import Any, List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.challenge import Challenge
from app.models.startup import Startup
from app.ai.startup_matcher import startup_matcher
from app.schemas.startup import (
    StartupMatchRecommendation,
    StartupComparisonResponse,
)


class DiscoveryService:

    def discover_startups_for_challenge(
        self, db: Session, challenge_id: str, user: Optional[Any] = None
    ) -> List[StartupMatchRecommendation]:
        """
        Retrieves all registered startups and ranks them by suitability for the given challenge.
        """
        challenge = (
            db.query(Challenge)
            .options(
                joinedload(Challenge.requirements),
                joinedload(Challenge.kpis),
                joinedload(Challenge.evaluation_criteria),
            )
            .filter(Challenge.id == challenge_id)
            .first()
        )

        if not challenge:
            raise ValueError(f"Challenge with ID {challenge_id} not found")

        startups = (
            db.query(Startup)
            .options(
                joinedload(Startup.technologies),
                joinedload(Startup.domains),
                joinedload(Startup.projects),
                joinedload(Startup.certifications),
                joinedload(Startup.team_capabilities),
                joinedload(Startup.deployments),
                joinedload(Startup.readiness_score),
            )
            .all()
        )

        if not startups:
            return []

        from app.services.settings_service import settings_service
        custom_weights = settings_service.get_matching_weights(db)
        ranked = startup_matcher.rank_startups_for_challenge(
            challenge, startups, custom_weights=custom_weights
        )
        if user:
            try:
                from app.services.audit_service import AuditService
                from app.models.audit import AuditAction
                top_name = ranked[0].startup.company_name if ranked else "None"
                top_score = ranked[0].match_score if ranked else 0.0
                AuditService.log_event(
                    db=db,
                    action=AuditAction.STARTUP_MATCHED,
                    entity_type="challenge",
                    entity_id=challenge.id,
                    actor=user,
                    summary=f"Matched {len(ranked)} startups for '{challenge.title}' (Top: {top_name} - {top_score}%).",
                    details={"startups_evaluated": len(startups), "top_startup": top_name, "top_score": top_score},
                )
            except Exception:
                pass

        return ranked

    def compare_startups_for_challenge(
        self, db: Session, challenge_id: str, startup_ids: List[str]
    ) -> StartupComparisonResponse:
        """
        Generates side-by-side comparison for selected startup IDs on a challenge.
        """
        all_recs = self.discover_startups_for_challenge(db, challenge_id)

        challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
        title = challenge.title if challenge else "Procurement Challenge"

        selected_recs = [r for r in all_recs if r.startup.id in startup_ids]

        return StartupComparisonResponse(
            challenge_id=challenge_id,
            challenge_title=title,
            recommendations=selected_recs,
        )


discovery_service = DiscoveryService()
