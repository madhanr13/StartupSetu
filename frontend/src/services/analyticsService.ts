import { apiRequest } from './api';
import type {
  AnalyticsReportExportResponse,
  BottleneckResponse,
  ChallengeAnalyticsResponse,
  OverviewMetricsResponse,
  PilotPerformanceAnalyticsResponse,
  ProcurementPipelineResponse,
  StartupIntelligenceResponse,
  StructuredInsightsResponse,
} from '../types';

export const analyticsService = {
  // Macro platform procurement overview metrics
  async getOverviewMetrics(): Promise<OverviewMetricsResponse> {
    return apiRequest<OverviewMetricsResponse>('/analytics/overview');
  },

  // Challenge-level participation, score distribution, and conversion
  async getChallengeAnalytics(challengeId?: string): Promise<ChallengeAnalyticsResponse> {
    const q = challengeId ? `?challenge_id=${encodeURIComponent(challengeId)}` : '';
    return apiRequest<ChallengeAnalyticsResponse>(`/analytics/challenges${q}`);
  },

  // Dynamic multi-dimensional startup performance profiles
  async getStartupIntelligence(startupId?: string): Promise<StartupIntelligenceResponse> {
    const q = startupId ? `?startup_id=${encodeURIComponent(startupId)}` : '';
    return apiRequest<StartupIntelligenceResponse>(`/analytics/startups${q}`);
  },

  // Pilot telemetry, milestone completion, and time-series KPI trends
  async getPilotPerformance(pilotId?: string): Promise<PilotPerformanceAnalyticsResponse> {
    const q = pilotId ? `?pilot_id=${encodeURIComponent(pilotId)}` : '';
    return apiRequest<PilotPerformanceAnalyticsResponse>(`/analytics/pilots${q}`);
  },

  // Full 9-stage procurement pipeline with conversion rates
  async getProcurementPipeline(): Promise<ProcurementPipelineResponse> {
    return apiRequest<ProcurementPipelineResponse>('/analytics/pipeline');
  },

  // Deterministic operational bottlenecks
  async getBottlenecks(): Promise<BottleneckResponse> {
    return apiRequest<BottleneckResponse>('/analytics/bottlenecks');
  },

  // Dual-layer structured decision insights (AI + Rule-based fallback)
  async getInsights(): Promise<StructuredInsightsResponse> {
    return apiRequest<StructuredInsightsResponse>('/analytics/insights');
  },

  // Generate and export comprehensive report
  async exportSummaryReport(params: {
    type?: 'CHALLENGE' | 'PILOT' | 'PLATFORM';
    id?: string;
    format?: 'markdown' | 'json';
  }): Promise<AnalyticsReportExportResponse> {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.id) query.append('id', params.id);
    if (params.format) query.append('format', params.format);
    return apiRequest<AnalyticsReportExportResponse>(`/analytics/export/report?${query.toString()}`);
  },
};
