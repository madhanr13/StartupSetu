/**
 * Analytics & Decision Intelligence Domain Types
 */

export interface OverviewMetricsResponse {
  total_challenges: number;
  published_challenges: number;
  active_pilots: number;
  completed_pilots: number;
  solutions_ready_for_procurement: number;
  scaled_solutions: number;
  extended_pilots: number;
  rejected_solutions: number;
  avg_evaluation_score: number;
  avg_kpi_achievement: number;
  avg_time_to_decision_days: number;
}

export interface ChallengeScoreBin {
  range_label: string;
  count: number;
}

export interface ChallengeAnalyticsItem {
  challenge_id: string;
  challenge_title: string;
  department_id?: string | null;
  department_name?: string | null;
  status: string;
  startups_discovered: number;
  eligible_startups: number;
  proposals_count: number;
  avg_proposal_score?: number | null;
  current_pilot_status?: string | null;
  final_procurement_outcome?: string | null;
  score_distribution: ChallengeScoreBin[];
  conversion_rate_discovered_to_proposal: number;
}

export interface ChallengeAnalyticsResponse {
  total: number;
  challenges: ChallengeAnalyticsItem[];
}

export interface StartupPerformanceRadar {
  match_quality: number;
  proposal_quality: number;
  pilot_performance: number;
  kpi_achievement: number;
  overall_readiness: number;
}

export interface StartupIntelligenceItem {
  startup_id: string;
  startup_name: string;
  legal_name: string;
  dpiit_recognized: boolean;
  readiness_stage: string;
  performance_profile: StartupPerformanceRadar;
  proposals_submitted: number;
  evaluations_count: number;
  pilots_count: number;
  active_pilots: number;
  completed_pilots: number;
  final_procurement_outcomes: string[];
  top_domains: string[];
  top_technologies: string[];
}

export interface StartupIntelligenceResponse {
  total: number;
  startups: StartupIntelligenceItem[];
}

export interface KPITrendPoint {
  measurement_date: string;
  actual_value: number;
  target_value: number;
  notes?: string | null;
}

export interface PilotKPISummary {
  kpi_id: string;
  name: string;
  target_value: number;
  unit: string;
  target_operator: string;
  latest_value?: number | null;
  achievement_percentage: number;
  status: string;
  history: KPITrendPoint[];
}

export interface PilotPerformanceAnalyticsItem {
  pilot_id: string;
  pilot_title: string;
  challenge_id: string;
  challenge_title: string;
  startup_id: string;
  startup_name: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  overall_kpi_achievement: number;
  milestone_completion_rate: number;
  total_milestones: number;
  completed_milestones: number;
  risks_count: number;
  open_risks_count: number;
  issues_count: number;
  open_issues_count: number;
  evidence_count: number;
  performance_trend: "EXCEEDING" | "ON_TRACK" | "AT_RISK" | "CRITICAL";
  kpis: PilotKPISummary[];
}

export interface PilotPerformanceAnalyticsResponse {
  total: number;
  pilots: PilotPerformanceAnalyticsItem[];
}

export interface PipelineStageItem {
  stage_id: string;
  stage_name: string;
  count: number;
  conversion_rate_from_previous: number;
  dropoff_count: number;
  description: string;
}

export interface ProcurementPipelineResponse {
  total_stages: number;
  stages: PipelineStageItem[];
  overall_conversion_rate: number;
}

export interface BottleneckItem {
  id: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: "DISCOVERY" | "PROPOSAL" | "EVALUATION" | "PILOT" | "PROCUREMENT";
  title: string;
  description: string;
  evidence: string;
  affected_entity_type: "CHALLENGE" | "PILOT" | "PROPOSAL";
  affected_entity_id: string;
  affected_entity_title: string;
  recommended_action: string;
}

export interface BottleneckResponse {
  total_bottlenecks: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  bottlenecks: BottleneckItem[];
}

export interface KeyInsightItem {
  title: string;
  description: string;
  category: string;
  evidence: string;
}

export interface OpportunityItem {
  title: string;
  description: string;
  evidence: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export interface RiskAreaItem {
  title: string;
  description: string;
  evidence: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface ProcurementBottleneckInsightItem {
  stage: string;
  issue: string;
  evidence: string;
  recommendation: string;
}

export interface RecommendedActionItem {
  action: string;
  target: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  rationale: string;
}

export interface StructuredInsightsResponse {
  source: "rule_based" | "ai_assisted";
  generated_at: string;
  key_insights: KeyInsightItem[];
  top_opportunities: OpportunityItem[];
  risk_areas: RiskAreaItem[];
  procurement_bottlenecks: ProcurementBottleneckInsightItem[];
  recommended_actions: RecommendedActionItem[];
}

export interface AnalyticsReportExportResponse {
  report_title: string;
  generated_at: string;
  entity_type: string;
  entity_id?: string | null;
  content_format: string;
  report_content: string;
}
