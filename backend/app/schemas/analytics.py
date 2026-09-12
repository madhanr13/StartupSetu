"""
Analytics Pydantic Schemas — Data contracts for Government Analytics & Decision Intelligence.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── Overview Metrics ────────────────────────────────────────────────────────

class OverviewMetricsResponse(BaseModel):
    total_challenges: int
    published_challenges: int
    active_pilots: int
    completed_pilots: int
    solutions_ready_for_procurement: int
    scaled_solutions: int
    extended_pilots: int
    rejected_solutions: int
    avg_evaluation_score: float = Field(..., description="Average proposal evaluation score (0-100)")
    avg_kpi_achievement: float = Field(..., description="Average KPI target achievement percentage")
    avg_time_to_decision_days: float = Field(..., description="Average days from challenge creation to final procurement decision")


# ── Challenge Analytics ─────────────────────────────────────────────────────

class ChallengeScoreBin(BaseModel):
    range_label: str
    count: int


class ChallengeAnalyticsItem(BaseModel):
    challenge_id: str
    challenge_title: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    status: str
    startups_discovered: int
    eligible_startups: int
    proposals_count: int
    avg_proposal_score: Optional[float] = None
    current_pilot_status: Optional[str] = None
    final_procurement_outcome: Optional[str] = None
    score_distribution: List[ChallengeScoreBin] = []
    conversion_rate_discovered_to_proposal: float = 0.0


class ChallengeAnalyticsResponse(BaseModel):
    total: int
    challenges: List[ChallengeAnalyticsItem]


# ── Startup Intelligence ────────────────────────────────────────────────────

class StartupPerformanceRadar(BaseModel):
    match_quality: float = Field(..., description="Calculated relevance/match score (0-100)")
    proposal_quality: float = Field(..., description="Calculated proposal evaluation score (0-100)")
    pilot_performance: float = Field(..., description="Milestone & execution progress (0-100)")
    kpi_achievement: float = Field(..., description="Average KPI fulfillment rate (0-100)")
    overall_readiness: float = Field(..., description="Weighted composite readiness index (0-100)")


class StartupIntelligenceItem(BaseModel):
    startup_id: str
    startup_name: str
    legal_name: str
    dpiit_recognized: bool
    readiness_stage: str
    performance_profile: StartupPerformanceRadar
    proposals_submitted: int
    evaluations_count: int
    pilots_count: int
    active_pilots: int
    completed_pilots: int
    final_procurement_outcomes: List[str] = []
    top_domains: List[str] = []
    top_technologies: List[str] = []


class StartupIntelligenceResponse(BaseModel):
    total: int
    startups: List[StartupIntelligenceItem]


# ── Pilot Performance Analytics ─────────────────────────────────────────────

class KPITrendPoint(BaseModel):
    measurement_date: str
    actual_value: float
    target_value: float
    notes: Optional[str] = None


class PilotKPISummary(BaseModel):
    kpi_id: str
    name: str
    target_value: float
    unit: str
    target_operator: str
    latest_value: Optional[float] = None
    achievement_percentage: float
    status: str
    history: List[KPITrendPoint] = []


class PilotPerformanceAnalyticsItem(BaseModel):
    pilot_id: str
    pilot_title: str
    challenge_id: str
    challenge_title: str
    startup_id: str
    startup_name: str
    status: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    overall_kpi_achievement: float
    milestone_completion_rate: float
    total_milestones: int
    completed_milestones: int
    risks_count: int
    open_risks_count: int
    issues_count: int
    open_issues_count: int
    evidence_count: int
    performance_trend: str  # "EXCEEDING", "ON_TRACK", "AT_RISK", "CRITICAL"
    kpis: List[PilotKPISummary] = []


class PilotPerformanceAnalyticsResponse(BaseModel):
    total: int
    pilots: List[PilotPerformanceAnalyticsItem]


# ── Procurement Pipeline ────────────────────────────────────────────────────

class PipelineStageItem(BaseModel):
    stage_id: str
    stage_name: str
    count: int
    conversion_rate_from_previous: float
    dropoff_count: int
    description: str


class ProcurementPipelineResponse(BaseModel):
    total_stages: int
    stages: List[PipelineStageItem]
    overall_conversion_rate: float


# ── Bottleneck Detection ────────────────────────────────────────────────────

class BottleneckItem(BaseModel):
    id: str
    severity: str  # "HIGH", "MEDIUM", "LOW"
    category: str  # "DISCOVERY", "PROPOSAL", "EVALUATION", "PILOT", "PROCUREMENT"
    title: str
    description: str
    evidence: str
    affected_entity_type: str  # "CHALLENGE", "PILOT", "PROPOSAL"
    affected_entity_id: str
    affected_entity_title: str
    recommended_action: str


class BottleneckResponse(BaseModel):
    total_bottlenecks: int
    high_severity_count: int
    medium_severity_count: int
    low_severity_count: int
    bottlenecks: List[BottleneckItem]


# ── AI & Rule-Based Structured Insights ─────────────────────────────────────

class KeyInsightItem(BaseModel):
    title: str
    description: str
    category: str
    evidence: str


class OpportunityItem(BaseModel):
    title: str
    description: str
    evidence: str
    impact: str  # "HIGH", "MEDIUM", "LOW"


class RiskAreaItem(BaseModel):
    title: str
    description: str
    evidence: str
    severity: str  # "CRITICAL", "HIGH", "MEDIUM"


class ProcurementBottleneckInsightItem(BaseModel):
    stage: str
    issue: str
    evidence: str
    recommendation: str


class RecommendedActionItem(BaseModel):
    action: str
    target: str
    priority: str  # "CRITICAL", "HIGH", "MEDIUM"
    rationale: str


class StructuredInsightsResponse(BaseModel):
    source: str = Field("rule_based", description="'rule_based' or 'ai_assisted'")
    generated_at: datetime
    key_insights: List[KeyInsightItem]
    top_opportunities: List[OpportunityItem]
    risk_areas: List[RiskAreaItem]
    procurement_bottlenecks: List[ProcurementBottleneckInsightItem]
    recommended_actions: List[RecommendedActionItem]


# ── Export / Report ─────────────────────────────────────────────────────────

class AnalyticsReportExportResponse(BaseModel):
    report_title: str
    generated_at: str
    entity_type: str
    entity_id: Optional[str] = None
    content_format: str
    report_content: str
