"""
Simulation Service — In-Memory What-If Decision Sandbox.

Reuses the existing StartupMatcher and DeterministicPilotAssessor to calculate
simulated outcomes without modifying official records in the database.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ai.pilot_assessor import DeterministicPilotAssessor
from app.ai.startup_matcher import StartupMatcher
from app.models.audit import AuditAction
from app.models.challenge import Challenge
from app.models.pilot import Pilot
from app.models.simulation import ScenarioType, SimulationScenario
from app.models.startup import Startup
from app.models.user import User
from app.schemas.simulation import (
    MatchingSimulationRequest,
    MatchingSimulationResponse,
    PilotSimulationRequest,
    PilotSimulationResponse,
    ScenarioCreateRequest,
    StartupRankComparison,
)
from app.services.audit_service import AuditService
from app.services.settings_service import settings_service

logger = logging.getLogger(__name__)

# Dimension label lookup for human-readable explanations
DIMENSION_LABELS: Dict[str, str] = {
    "technology_fit": "Technical Capability & Tech Stack",
    "domain_fit": "Domain & Problem Relevance",
    "relevant_projects": "Prior Proven Project Track Record",
    "team_capability": "Team Capability & Depth",
    "deployment_experience": "Field Deployment Readiness",
    "scalability": "System Scalability",
    "security_readiness": "Security & Compliance Readiness",
    "budget_compatibility": "Commercial & Budget Alignment",
}


class SimulationService:
    """Core business logic for What-If procurement simulations."""

    def __init__(self) -> None:
        self.matcher = StartupMatcher()
        self.pilot_assessor = DeterministicPilotAssessor()

    def run_matching_simulation(
        self, db: Session, request: MatchingSimulationRequest
    ) -> MatchingSimulationResponse:
        """
        Simulate startup matching rankings with temporary weight parameters.
        Does NOT alter database records, system settings, or challenge data.
        """
        challenge = db.query(Challenge).filter(Challenge.id == request.challenge_id).first()
        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Challenge with ID '{request.challenge_id}' not found.",
            )

        startups = db.query(Startup).all()
        if not startups:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No registered active startups found to run matching simulation.",
            )

        # Baseline weights from active system settings
        baseline_weights = settings_service.get_matching_weights(db)

        # Simulated weights normalized to sum ~1.0
        raw_sim_weights = request.weights
        total_sim_weight = sum(raw_sim_weights.values())
        if total_sim_weight <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sum of simulation weights must be greater than zero.",
            )

        # Normalize simulated weights
        simulated_weights = {
            k: round(v / total_sim_weight, 4) for k, v in raw_sim_weights.items()
        }

        # 1. Run baseline ranking using actual system matcher
        baseline_recommendations = self.matcher.rank_startups_for_challenge(
            challenge=challenge,
            startups=startups,
            custom_weights=baseline_weights,
        )
        baseline_map = {rec.startup.id: rec for rec in baseline_recommendations}

        # 2. Run simulated ranking using identical matching algorithm with custom weights
        simulated_recommendations = self.matcher.rank_startups_for_challenge(
            challenge=challenge,
            startups=startups,
            custom_weights=simulated_weights,
        )

        # 3. Build comparative rankings
        comparisons: List[StartupRankComparison] = []
        for sim_rec in simulated_recommendations:
            s_id = sim_rec.startup.id
            base_rec = baseline_map.get(s_id)
            if not base_rec:
                continue

            base_rank = base_rec.rank
            sim_rank = sim_rec.rank
            rank_change = base_rank - sim_rank  # Positive = moved up, Negative = moved down
            score_diff = round(sim_rec.match_score - base_rec.match_score, 1)

            # Determine factor impact for this specific startup
            base_breakdown = (
                base_rec.match_breakdown.model_dump()
                if hasattr(base_rec.match_breakdown, "model_dump")
                else dict(base_rec.match_breakdown)
            )
            sim_breakdown = (
                sim_rec.match_breakdown.model_dump()
                if hasattr(sim_rec.match_breakdown, "model_dump")
                else dict(sim_rec.match_breakdown)
            )

            movement_reason = self._explain_single_startup_movement(
                base_breakdown=base_breakdown,
                base_weights=baseline_weights,
                sim_weights=simulated_weights,
                rank_change=rank_change,
                score_diff=score_diff,
                startup_name=sim_rec.startup.company_name,
            )

            comparisons.append(
                StartupRankComparison(
                    startup_id=s_id,
                    startup_name=sim_rec.startup.company_name,
                    dpiit_number=getattr(sim_rec.startup, "dpiit_number", None),
                    baseline_rank=base_rank,
                    simulated_rank=sim_rank,
                    rank_change=rank_change,
                    baseline_score=round(base_rec.match_score, 1),
                    simulated_score=round(sim_rec.match_score, 1),
                    score_diff=score_diff,
                    baseline_breakdown=base_breakdown,
                    simulated_breakdown=sim_breakdown,
                    movement_reason=movement_reason,
                )
            )

        # Identify top promoted and top demoted
        top_promoted = max(
            (c for c in comparisons if c.rank_change > 0),
            key=lambda c: c.rank_change,
            default=None,
        )
        top_demoted = min(
            (c for c in comparisons if c.rank_change < 0),
            key=lambda c: c.rank_change,
            default=None,
        )

        # Overall deterministic explanation
        explanation, summary_insights = self._generate_matching_overall_explanation(
            comparisons=comparisons,
            base_weights=baseline_weights,
            sim_weights=simulated_weights,
            top_promoted=top_promoted,
            top_demoted=top_demoted,
        )

        return MatchingSimulationResponse(
            challenge_id=challenge.id,
            challenge_title=challenge.title,
            baseline_weights=baseline_weights,
            simulated_weights=simulated_weights,
            rankings=comparisons,
            top_promoted=top_promoted,
            top_demoted=top_demoted,
            summary_insights=summary_insights,
            explanation=explanation,
        )

    def run_pilot_simulation(
        self, db: Session, request: PilotSimulationRequest
    ) -> PilotSimulationResponse:
        """
        Simulate pilot procurement outcome under alternative decision thresholds.
        Reuses telemetry metrics from DeterministicPilotAssessor without mutating the pilot.
        """
        pilot = db.query(Pilot).filter(Pilot.id == request.pilot_id).first()
        if not pilot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pilot with ID '{request.pilot_id}' not found.",
            )

        # Run real deterministic assessment on actual database telemetry
        base_assessment = self.pilot_assessor.assess_pilot(pilot)

        baseline_thresholds = {
            "min_overall_score": 75.0,
            "min_kpi_score": 70.0,
            "max_acceptable_risk": "MEDIUM",
            "require_zero_critical_risks": True,
            "require_zero_blocked_milestones": True,
        }

        # Simulated thresholds with defaults
        sim_thresholds = {
            "min_overall_score": float(request.thresholds.get("min_overall_score", 75.0)),
            "min_kpi_score": float(request.thresholds.get("min_kpi_score", 70.0)),
            "max_acceptable_risk": str(request.thresholds.get("max_acceptable_risk", "MEDIUM")).upper(),
            "require_zero_critical_risks": bool(request.thresholds.get("require_zero_critical_risks", True)),
            "require_zero_blocked_milestones": bool(request.thresholds.get("require_zero_blocked_milestones", True)),
        }

        kpis = pilot.kpis or []
        milestones = pilot.milestones or []
        risks = pilot.risks or []
        issues = pilot.issues or []

        kpi_perf = base_assessment["kpi_performance"]
        overall_score = base_assessment["overall_score"]
        risk_level = base_assessment["risk_level"]
        milestone_perf = base_assessment["milestone_performance"]

        open_critical_risks = [
            r for r in risks if getattr(r, "status", None) == "OPEN" and getattr(r, "severity", None) == "CRITICAL"
        ]
        blocked_milestones = [
            m for m in milestones if getattr(m, "status", None) == "BLOCKED"
        ]

        # Calculate simulated outcome based on simulated thresholds
        risk_order = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
        current_risk_val = risk_order.get(risk_level, 2)
        max_allowed_risk_val = risk_order.get(sim_thresholds["max_acceptable_risk"], 2)

        scale_criteria_met = (
            overall_score >= sim_thresholds["min_overall_score"]
            and kpi_perf >= sim_thresholds["min_kpi_score"]
            and current_risk_val <= max_allowed_risk_val
            and (not sim_thresholds["require_zero_critical_risks"] or len(open_critical_risks) == 0)
            and (not sim_thresholds["require_zero_blocked_milestones"] or len(blocked_milestones) == 0)
        )

        detailed_reasons: List[str] = []
        if scale_criteria_met:
            simulated_outcome = "SCALE"
            detailed_reasons.append(
                f"Overall score ({overall_score}) meets or exceeds simulated threshold of {sim_thresholds['min_overall_score']}."
            )
            detailed_reasons.append(
                f"KPI performance ({kpi_perf}%) satisfies the simulated minimum target of {sim_thresholds['min_kpi_score']}%."
            )
            detailed_reasons.append(
                f"Assessed risk level ({risk_level}) is within the simulated acceptable ceiling of {sim_thresholds['max_acceptable_risk']}."
            )
        elif overall_score >= 45.0 or kpi_perf >= 40.0:
            simulated_outcome = "EXTEND"
            if overall_score < sim_thresholds["min_overall_score"]:
                detailed_reasons.append(
                    f"Overall score ({overall_score}) fell short of the simulated scale threshold ({sim_thresholds['min_overall_score']})."
                )
            if kpi_perf < sim_thresholds["min_kpi_score"]:
                detailed_reasons.append(
                    f"KPI performance ({kpi_perf}%) did not meet the simulated threshold ({sim_thresholds['min_kpi_score']}%)."
                )
            if current_risk_val > max_allowed_risk_val:
                detailed_reasons.append(
                    f"Operational risk level ({risk_level}) exceeds the simulated limit ({sim_thresholds['max_acceptable_risk']})."
                )
            if sim_thresholds["require_zero_critical_risks"] and len(open_critical_risks) > 0:
                detailed_reasons.append(
                    f"{len(open_critical_risks)} open critical risk(s) prevent scaling under the strict risk criteria."
                )
            if sim_thresholds["require_zero_blocked_milestones"] and len(blocked_milestones) > 0:
                detailed_reasons.append(
                    f"{len(blocked_milestones)} blocked milestone(s) require operational extension to resolve."
                )
        else:
            simulated_outcome = "REJECT"
            detailed_reasons.append(
                f"Performance metrics (Score: {overall_score}, KPI: {kpi_perf}%) failed both scale and extension viability thresholds."
            )

        baseline_outcome = base_assessment["recommendation"]
        outcome_changed = baseline_outcome != simulated_outcome

        # Explanation summary
        if outcome_changed:
            explanation = (
                f"Under the simulated assumptions, the recommended pilot procurement decision shifted from "
                f"'{baseline_outcome}' to '{simulated_outcome}'. "
                f"{detailed_reasons[0]}"
            )
        else:
            explanation = (
                f"The recommended decision remains '{baseline_outcome}' under the simulated parameters. "
                f"The pilot's telemetry satisfies the tested scenario constraints."
            )

        pilot_title = getattr(pilot, "title", None) or getattr(pilot, "name", "Pilot")
        startup_obj = getattr(pilot, "startup", None)
        startup_name = (
            getattr(startup_obj, "company_name", None)
            or getattr(startup_obj, "name", "Unknown Startup")
        ) if startup_obj else "Unknown Startup"

        return PilotSimulationResponse(
            pilot_id=pilot.id,
            pilot_title=pilot_title,
            startup_name=startup_name,
            baseline_thresholds=baseline_thresholds,
            simulated_thresholds=sim_thresholds,
            baseline_outcome=baseline_outcome,
            simulated_outcome=simulated_outcome,
            outcome_changed=outcome_changed,
            metrics={
                "overall_score": overall_score,
                "kpi_performance": kpi_perf,
                "milestone_performance": milestone_perf,
                "risk_level": risk_level,
                "open_critical_risks": len(open_critical_risks),
                "blocked_milestones": len(blocked_milestones),
                "total_kpis": len(kpis),
                "total_milestones": len(milestones),
            },
            explanation=explanation,
            detailed_reasons=detailed_reasons,
        )

    # ── Scenario Persistence ───────────────────────────────────────────────────

    def save_scenario(
        self, db: Session, payload: ScenarioCreateRequest, actor: User
    ) -> SimulationScenario:
        """Persist a simulated what-if scenario and record an audit log."""
        scenario = SimulationScenario(
            title=payload.title,
            description=payload.description,
            scenario_type=payload.scenario_type.upper(),
            target_id=payload.target_id,
            target_title=payload.target_title,
            input_parameters=payload.input_parameters,
            baseline_parameters=payload.baseline_parameters,
            results_summary=payload.results_summary,
            explanation=payload.explanation,
            created_by_id=actor.id,
            created_by_name=getattr(actor, "name", None) or getattr(actor, "email", "User"),
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)

        # Audit logging for scenario creation
        AuditService.log_event(
            db=db,
            action=AuditAction.SIMULATION_SCENARIO_SAVED,
            entity_type="SimulationScenario",
            entity_id=scenario.id,
            summary=f"Saved what-if simulation scenario: '{scenario.title}'",
            actor=actor,
            details={
                "title": scenario.title,
                "scenario_type": scenario.scenario_type,
                "target_id": scenario.target_id,
            },
        )
        return scenario

    def list_scenarios(
        self, db: Session, scenario_type: Optional[str] = None
    ) -> List[SimulationScenario]:
        """List all saved simulation scenarios ordered by most recent."""
        query = db.query(SimulationScenario)
        if scenario_type:
            query = query.filter(SimulationScenario.scenario_type == scenario_type.upper())
        return query.order_by(SimulationScenario.created_at.desc()).all()

    def get_scenario(self, db: Session, scenario_id: str) -> SimulationScenario:
        """Retrieve a saved scenario by ID."""
        scenario = db.query(SimulationScenario).filter(SimulationScenario.id == scenario_id).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario '{scenario_id}' not found.",
            )
        return scenario

    def delete_scenario(self, db: Session, scenario_id: str, actor: User) -> None:
        """Delete a saved scenario."""
        scenario = self.get_scenario(db, scenario_id)
        db.delete(scenario)
        db.commit()

        AuditService.log_event(
            db=db,
            action=AuditAction.SIMULATION_SCENARIO_DELETED,
            entity_type="SimulationScenario",
            entity_id=scenario_id,
            summary=f"Deleted what-if simulation scenario: '{scenario.title}'",
            actor=actor,
            details={"title": scenario.title, "scenario_type": scenario.scenario_type},
        )

    # ── Explanation Helpers ────────────────────────────────────────────────────

    def _explain_single_startup_movement(
        self,
        base_breakdown: Dict[str, Any],
        base_weights: Dict[str, float],
        sim_weights: Dict[str, float],
        rank_change: int,
        score_diff: float,
        startup_name: str,
    ) -> str:
        """Generate a deterministic explanation for an individual startup's score/rank delta."""
        if rank_change == 0 and abs(score_diff) < 0.2:
            return f"{startup_name}'s ranking remained unchanged (#) under this scenario."

        # Find dimension that had the biggest positive or negative contribution
        deltas: List[tuple[str, float, float]] = []
        for dim, sim_w in sim_weights.items():
            base_w = base_weights.get(dim, 0.0)
            dim_score = float(base_breakdown.get(dim, 75.0))
            # Contribution difference = (sim_w - base_w) * dim_score
            contrib_diff = (sim_w - base_w) * dim_score
            deltas.append((dim, contrib_diff, dim_score))

        deltas.sort(key=lambda x: x[1], reverse=True)
        top_positive_dim, top_pos_contrib, top_pos_val = deltas[0]
        top_negative_dim, top_neg_contrib, top_neg_val = deltas[-1]

        pos_label = DIMENSION_LABELS.get(top_positive_dim, top_positive_dim)
        neg_label = DIMENSION_LABELS.get(top_negative_dim, top_negative_dim)

        if rank_change > 0:
            return (
                f"Moved up {rank_change} spot(s) (+{score_diff} pts) primarily driven by increased weight "
                f"on {pos_label}, where {startup_name} has a strong capability score of {top_pos_val:.0f}/100."
            )
        elif rank_change < 0:
            return (
                f"Moved down {abs(rank_change)} spot(s) ({score_diff} pts) because reduced weight was placed on "
                f"{neg_label} where the startup previously derived higher relative advantage."
            )
        else:
            direction = "increased" if score_diff > 0 else "decreased"
            return f"Rank remained steady while score {direction} by {abs(score_diff)} pts."

    def _generate_matching_overall_explanation(
        self,
        comparisons: List[StartupRankComparison],
        base_weights: Dict[str, float],
        sim_weights: Dict[str, float],
        top_promoted: Optional[StartupRankComparison],
        top_demoted: Optional[StartupRankComparison],
    ) -> tuple[str, List[str]]:
        """Synthesize a comprehensive deterministic summary of matching scenario changes."""
        insights: List[str] = []

        # 1. Identify biggest weight adjustments
        weight_shifts = [
            (dim, round((sim_weights.get(dim, 0.0) - base_weights.get(dim, 0.0)) * 100, 1))
            for dim in sim_weights
        ]
        weight_shifts.sort(key=lambda x: abs(x[1]), reverse=True)
        biggest_increases = [w for w in weight_shifts if w[1] > 0][:2]
        biggest_decreases = [w for w in weight_shifts if w[1] < 0][:2]

        for dim, change in biggest_increases:
            label = DIMENSION_LABELS.get(dim, dim)
            insights.append(f"{label} weight increased by +{change}% (from {base_weights.get(dim, 0)*100:.0f}% to {sim_weights.get(dim, 0)*100:.0f}%).")

        for dim, change in biggest_decreases:
            label = DIMENSION_LABELS.get(dim, dim)
            insights.append(f"{label} weight decreased by {change}% (from {base_weights.get(dim, 0)*100:.0f}% to {sim_weights.get(dim, 0)*100:.0f}%).")

        # 2. Rank changes summary
        rank_changes_count = sum(1 for c in comparisons if c.rank_change != 0)
        if rank_changes_count == 0:
            insights.append("No startups changed their ordinal ranking positions despite score adjustments.")
            explanation = (
                "The tested weight configuration modified individual match scores, but the relative hierarchy "
                "of candidates remained stable with zero position flips across the top ranked startups."
            )
        else:
            insights.append(f"{rank_changes_count} startup(s) shifted ranking positions in this scenario.")
            explanation_parts = []
            if top_promoted:
                explanation_parts.append(
                    f"{top_promoted.startup_name} saw the largest advancement, climbing from #{top_promoted.baseline_rank} to #{top_promoted.simulated_rank} (+{top_promoted.rank_change} ranks, {top_promoted.score_diff:+} score)."
                )
            if top_demoted:
                explanation_parts.append(
                    f"{top_demoted.startup_name} dropped from #{top_demoted.baseline_rank} to #{top_demoted.simulated_rank} ({top_demoted.rank_change} ranks)."
                )
            explanation = " ".join(explanation_parts)

        return explanation, insights


simulation_service = SimulationService()
