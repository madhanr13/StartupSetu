"""
Pydantic schemas for the What-If Procurement Simulator.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ── Matching Simulation Schemas ───────────────────────────────────────────────

class MatchingSimulationRequest(BaseModel):
    """Payload to simulate startup rankings under modified weighting assumptions."""
    challenge_id: str
    weights: Dict[str, float] = Field(
        ...,
        description="Dictionary of dimension weights (e.g., technology_fit, domain_fit, etc.)"
    )


class StartupRankComparison(BaseModel):
    """Side-by-side comparison of a startup's rank and score between scenarios."""
    startup_id: str
    startup_name: str
    dpiit_number: Optional[str] = None
    baseline_rank: int
    simulated_rank: int
    rank_change: int  # e.g., +1 means moved up from #2 to #1, -1 means moved down
    baseline_score: float
    simulated_score: float
    score_diff: float
    baseline_breakdown: Dict[str, Any]
    simulated_breakdown: Dict[str, Any]
    movement_reason: Optional[str] = None


class MatchingSimulationResponse(BaseModel):
    """Complete results of a startup matching what-if simulation."""
    challenge_id: str
    challenge_title: str
    baseline_weights: Dict[str, float]
    simulated_weights: Dict[str, float]
    rankings: List[StartupRankComparison]
    top_promoted: Optional[StartupRankComparison] = None
    top_demoted: Optional[StartupRankComparison] = None
    summary_insights: List[str] = []
    explanation: str


# ── Pilot Decision Simulation Schemas ─────────────────────────────────────────

class PilotSimulationRequest(BaseModel):
    """Payload to simulate pilot procurement outcomes under modified threshold criteria."""
    pilot_id: str
    thresholds: Dict[str, Any] = Field(
        ...,
        description="Simulated thresholds (min_kpi_score, min_overall_score, max_acceptable_risk, etc.)"
    )


class PilotSimulationResponse(BaseModel):
    """Complete results of a pilot decision what-if simulation."""
    pilot_id: str
    pilot_title: str
    startup_name: str
    baseline_thresholds: Dict[str, Any]
    simulated_thresholds: Dict[str, Any]
    baseline_outcome: str  # SCALE | EXTEND | REJECT
    simulated_outcome: str  # SCALE | EXTEND | REJECT
    outcome_changed: bool
    metrics: Dict[str, Any]
    explanation: str
    detailed_reasons: List[str] = []


# ── Saved Scenario Schemas ───────────────────────────────────────────────────

class ScenarioCreateRequest(BaseModel):
    """Payload to save a what-if simulation scenario."""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    scenario_type: str = Field(..., description="MATCHING or PILOT_DECISION")
    target_id: str
    target_title: str
    input_parameters: Dict[str, Any]
    baseline_parameters: Dict[str, Any]
    results_summary: Dict[str, Any]
    explanation: Optional[str] = None


class ScenarioResponse(BaseModel):
    """Saved simulation scenario representation."""
    id: str
    title: str
    description: Optional[str] = None
    scenario_type: str
    target_id: str
    target_title: str
    input_parameters: Dict[str, Any]
    baseline_parameters: Dict[str, Any]
    results_summary: Dict[str, Any]
    explanation: Optional[str] = None
    created_by_id: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
