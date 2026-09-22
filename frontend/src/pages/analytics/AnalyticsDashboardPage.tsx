/**
 * AI Decision Intelligence & Analytics Dashboard
 *
 * Centralized decision-support layer for government officers:
 * - Macro operational metrics & pipeline conversion rates
 * - Visual 9-stage procurement pipeline
 * - Deterministic operational bottleneck alerts
 * - AI & Rule-based structured insights with grounded evidence
 * - Deep dives: Challenge Analytics, Startup Intelligence, Pilot Telemetry
 * - Government procurement intelligence report export
 */

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Building,
  CheckCircle2,
  Clock,
  FlaskConical,
  Layers,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { analyticsService } from "@/services/analyticsService";
import type {
  BottleneckResponse,
  ChallengeAnalyticsResponse,
  OverviewMetricsResponse,
  PilotPerformanceAnalyticsResponse,
  ProcurementPipelineResponse,
  StartupIntelligenceResponse,
  StructuredInsightsResponse,
} from "@/types";

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "challenges" | "startups" | "pilots">("overview");
  const [insightCategory, setInsightCategory] = useState<"insights" | "opportunities" | "risks" | "bottlenecks" | "actions">("insights");

  // Telemetry states
  const [overview, setOverview] = useState<OverviewMetricsResponse | null>(null);
  const [pipeline, setPipeline] = useState<ProcurementPipelineResponse | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckResponse | null>(null);
  const [insights, setInsights] = useState<StructuredInsightsResponse | null>(null);
  const [challengesData, setChallengesData] = useState<ChallengeAnalyticsResponse | null>(null);
  const [startupsData, setStartupsData] = useState<StartupIntelligenceResponse | null>(null);
  const [pilotsData, setPilotsData] = useState<PilotPerformanceAnalyticsResponse | null>(null);

  // Loading & error
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected pilot for deep dive
  const [selectedPilotId, setSelectedPilotId] = useState<string | null>(null);



  const fetchAllAnalytics = async () => {
    try {
      setError(null);
      const [
        overviewRes,
        pipelineRes,
        bottlenecksRes,
        insightsRes,
        challengesRes,
        startupsRes,
        pilotsRes,
      ] = await Promise.all([
        analyticsService.getOverviewMetrics(),
        analyticsService.getProcurementPipeline(),
        analyticsService.getBottlenecks(),
        analyticsService.getInsights(),
        analyticsService.getChallengeAnalytics(),
        analyticsService.getStartupIntelligence(),
        analyticsService.getPilotPerformance(),
      ]);

      setOverview(overviewRes);
      setPipeline(pipelineRes);
      setBottlenecks(bottlenecksRes);
      setInsights(insightsRes);
      setChallengesData(challengesRes);
      setStartupsData(startupsRes);
      setPilotsData(pilotsRes);

      if (pilotsRes.pilots.length > 0 && !selectedPilotId) {
        setSelectedPilotId(pilotsRes.pilots[0].pilot_id);
      }
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err?.message || "Failed to load procurement intelligence telemetry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllAnalytics();
  };



  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="w-10 h-10 text-primary-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-neutral-800">Aggregating Procurement Intelligence...</h3>
        <p className="text-sm text-neutral-500 max-w-md mt-1">
          Computing real-time telemetry from challenges, proposals, evaluations, pilot milestones, and procurement decisions.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 flex items-start space-x-4">
          <AlertOctagon className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold">Analytics Retrieval Failed</h3>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Retry Aggregation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedPilot = pilotsData?.pilots.find((p) => p.pilot_id === selectedPilotId) || pilotsData?.pilots[0];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 space-y-8">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 uppercase tracking-wider">
              Decision Intelligence
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Live Platform Database Telemetry
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">
            Analytics & Decision Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Centralized decision-support layer synthesizing challenge participation, startup performance, pilot telemetry, and pipeline progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary-600" : ""}`} />
            <span>{isRefreshing ? "Updating..." : "Refresh Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* ── Deterministic Bottlenecks Alert Banner ──────────────── */}
      {bottlenecks && bottlenecks.total_bottlenecks > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                  Operational Bottlenecks Detected ({bottlenecks.total_bottlenecks})
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  {bottlenecks.high_severity_count} High Severity
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Deterministic analytics identified operational stalls that require departmental officer attention:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {bottlenecks.bottlenecks.slice(0, 3).map((b) => (
                  <div key={b.id} className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{b.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.severity === "HIGH" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{b.description}</p>
                    <div className="mt-2 text-[11px] text-primary-800 font-medium">
                      Action: {b.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Macro Dashboard Cards ───────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="gov-card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Challenges</span>
              <Target className="w-4 h-4 text-primary-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{overview.total_challenges}</span>
              <span className="text-xs text-slate-500 font-medium">{overview.published_challenges} published</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Problem statements</div>
          </div>

          <div className="gov-card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Field Pilots</span>
              <FlaskConical className="w-4 h-4 text-primary-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{overview.active_pilots + overview.completed_pilots}</span>
              <span className="text-xs text-emerald-700 font-medium">{overview.completed_pilots} completed</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{overview.active_pilots} actively testing</div>
          </div>

          <div className="gov-card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Scale Transition</span>
              <Building className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{overview.solutions_ready_for_procurement}</span>
              <span className="text-xs text-slate-500 font-medium">{overview.scaled_solutions} scaled</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ready for public tender</div>
          </div>

          <div className="gov-card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Avg Evaluation</span>
              <Award className="w-4 h-4 text-blue-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{overview.avg_evaluation_score}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Committee review score</div>
          </div>

          <div className="gov-card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">KPI Achievement</span>
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-teal-700">{overview.avg_kpi_achievement}%</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across all measured targets</div>
          </div>

          <div className="gov-card p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Decision Speed</span>
              <Clock className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{overview.avg_time_to_decision_days}</span>
              <span className="text-xs text-slate-500">days</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Challenge to final sign-off</div>
          </div>
        </div>
      )}

      {/* ── Procurement Pipeline Funnel ─────────────────────────── */}
      {pipeline && (
        <div className="gov-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-700" />
                <h2 className="text-base font-bold text-slate-900">Procurement Conversion Pipeline</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                End-to-end lifecycle conversion funnel: Track counts, bottlenecks, and solution attrition rates.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Overall Pipeline Yield: </span>
              <span className="text-sm font-bold text-primary-800">{pipeline.overall_conversion_rate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {pipeline.stages.map((stage, idx) => (
              <div
                key={stage.stage_id}
                className="relative bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between hover:bg-slate-100/80 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                    <span>STEP 0{idx + 1}</span>
                    {idx > 0 && (
                      <span className="text-emerald-700 font-medium">
                        {stage.conversion_rate_from_previous}%
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">{stage.count}</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1 leading-snug">
                    {stage.stage_name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 line-clamp-2">
                  {stage.description}
                </div>

                {idx < pipeline.stages.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-slate-300 items-center justify-center shadow-xs">
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI & Rule-Based Structured Insights ──────────────────── */}
      {insights && (
        <div className="gov-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-700" />
                <h2 className="text-base font-bold text-slate-900">
                  Decision Intelligence & Operational Insights
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                  {insights.source === "ai_assisted" ? "AI-Assisted Synthesis" : "Rule-Based Factual Telemetry"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Actionable recommendations and opportunities grounded by verified database telemetry.
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setInsightCategory("insights")}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  insightCategory === "insights"
                    ? "bg-primary-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Key Insights ({insights.key_insights.length})
              </button>
              <button
                onClick={() => setInsightCategory("opportunities")}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  insightCategory === "opportunities"
                    ? "bg-primary-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Opportunities ({insights.top_opportunities.length})
              </button>
              <button
                onClick={() => setInsightCategory("risks")}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  insightCategory === "risks"
                    ? "bg-primary-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Risk Areas ({insights.risk_areas.length})
              </button>
              <button
                onClick={() => setInsightCategory("bottlenecks")}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  insightCategory === "bottlenecks"
                    ? "bg-primary-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Bottlenecks ({insights.procurement_bottlenecks.length})
              </button>
              <button
                onClick={() => setInsightCategory("actions")}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  insightCategory === "actions"
                    ? "bg-primary-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Actions ({insights.recommended_actions.length})
              </button>
            </div>
          </div>

          {/* Render Insights Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insightCategory === "insights" &&
              insights.key_insights.map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-primary-800 uppercase tracking-wider text-[10px]">
                      {item.category}
                    </span>
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                    <span className="font-semibold text-slate-700">Telemetry Grounding: </span>
                    {item.evidence}
                  </div>
                </div>
              ))}

            {insightCategory === "opportunities" &&
              insights.top_opportunities.map((item, i) => (
                <div key={i} className="bg-white border border-emerald-200 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {item.impact} IMPACT
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 bg-emerald-50/50 p-2 rounded">
                    <span className="font-semibold text-emerald-800">Evidence: </span>
                    {item.evidence}
                  </div>
                </div>
              ))}

            {insightCategory === "risks" &&
              insights.risk_areas.map((item, i) => (
                <div key={i} className="bg-white border border-rose-200 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.severity} RISK
                    </span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 bg-rose-50/50 p-2 rounded">
                    <span className="font-semibold text-rose-800">Evidence: </span>
                    {item.evidence}
                  </div>
                </div>
              ))}

            {insightCategory === "bottlenecks" &&
              insights.procurement_bottlenecks.map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase">
                      Stage: {item.stage}
                    </span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.issue}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.recommendation}</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                    <span className="font-semibold text-slate-700">Evidence: </span>
                    {item.evidence}
                  </div>
                </div>
              ))}

            {insightCategory === "actions" &&
              insights.recommended_actions.map((item, i) => (
                <div key={i} className="bg-white border border-blue-200 rounded-lg p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      PRIORITY: {item.priority}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.action}</h4>
                  <div className="text-xs text-primary-800 font-medium mt-1">Target: {item.target}</div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded">
                    <span className="font-semibold text-slate-800">Rationale: </span>
                    {item.rationale}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Deep Dive Tabs Navigation ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "text-primary-800 border-b-2 border-primary-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Macro Analytics Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "challenges"
                ? "text-primary-800 border-b-2 border-primary-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Challenge Analytics ({challengesData?.total || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("startups")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "startups"
                ? "text-primary-800 border-b-2 border-primary-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Startup Intelligence ({startupsData?.total || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("pilots")}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "pilots"
                ? "text-primary-800 border-b-2 border-primary-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Pilot Performance & Telemetry ({pilotsData?.total || 0})</span>
          </button>
        </div>

        {/* ── TAB 1: Macro Analytics Overview Charts ─────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Challenge Participation & Conversion */}
            <div className="gov-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Challenge Funnel Conversion</h3>
                  <p className="text-xs text-slate-500">Startups Discovered vs Proposals Submitted</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      challengesData?.challenges.map((c) => ({
                        name: c.challenge_title.slice(0, 18) + "...",
                        Discovered: c.startups_discovered,
                        Proposals: c.proposals_count,
                      })) || []
                    }
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Discovered" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Proposals" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Score Distribution Histogram */}
            <div className="gov-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Proposal Score Distribution</h3>
                  <p className="text-xs text-slate-500">Evaluator score breakdown across bids</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        range: "0-50 (Below Threshold)",
                        count: challengesData?.challenges.reduce((sum, c) => sum + (c.score_distribution.find((b) => b.range_label === "0-50")?.count || 0), 0) || 0,
                      },
                      {
                        range: "51-70 (Moderate)",
                        count: challengesData?.challenges.reduce((sum, c) => sum + (c.score_distribution.find((b) => b.range_label === "51-70")?.count || 0), 0) || 0,
                      },
                      {
                        range: "71-85 (Qualified)",
                        count: challengesData?.challenges.reduce((sum, c) => sum + (c.score_distribution.find((b) => b.range_label === "71-85")?.count || 0), 0) || 0,
                      },
                      {
                        range: "86-100 (Exemplary)",
                        count: challengesData?.challenges.reduce((sum, c) => sum + (c.score_distribution.find((b) => b.range_label === "86-100")?.count || 0), 0) || 0,
                      },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Challenge Analytics Table ───────────────────── */}
        {activeTab === "challenges" && (
          <div className="gov-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Per-Challenge Procurement Performance</h3>
              <span className="text-xs text-slate-500">Real database metrics across departments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Challenge Title</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Discovered</th>
                    <th className="p-3 text-center">Proposals</th>
                    <th className="p-3 text-center">Avg Score</th>
                    <th className="p-3 text-center">Conversion</th>
                    <th className="p-3">Pilot Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {challengesData?.challenges.map((c) => (
                    <tr key={c.challenge_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">
                        {c.challenge_title}
                      </td>
                      <td className="p-3 text-slate-600">{c.department_name || "N/A"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium text-slate-700">{c.startups_discovered}</td>
                      <td className="p-3 text-center font-bold text-primary-900">{c.proposals_count}</td>
                      <td className="p-3 text-center font-semibold text-slate-800">
                        {c.avg_proposal_score ? `${c.avg_proposal_score}/100` : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-semibold text-emerald-700">
                          {c.conversion_rate_discovered_to_proposal}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.final_procurement_outcome === "SCALE"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.final_procurement_outcome === "EXTEND"
                              ? "bg-blue-100 text-blue-800"
                              : c.final_procurement_outcome === "REJECT"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {c.final_procurement_outcome || "IN_PROGRESS"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: Startup Intelligence Radar & Scoring ─────────── */}
        {activeTab === "startups" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {startupsData?.startups.map((s) => {
                const p = s.performance_profile;
                const radarData = [
                  { metric: "Match Quality", score: p.match_quality },
                  { metric: "Proposal Quality", score: p.proposal_quality },
                  { metric: "Pilot Execution", score: p.pilot_performance },
                  { metric: "KPI Achievement", score: p.kpi_achievement },
                  { metric: "Overall Readiness", score: p.overall_readiness },
                ];

                return (
                  <div key={s.startup_id} className="gov-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{s.startup_name}</h4>
                          <span className="text-xs text-slate-500">{s.legal_name}</span>
                        </div>
                        {s.dpiit_recognized && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> DPIIT
                          </span>
                        )}
                      </div>

                      {/* Radar Chart */}
                      <div className="h-52 my-2 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#475569" }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                            <Radar name={s.startup_name} dataKey="score" stroke="#1D4ED8" fill="#3B82F6" fillOpacity={0.4} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Performance Indices */}
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-500 text-[11px]">Match Quality</span>
                          <div className="font-bold text-slate-800">{p.match_quality}%</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">Proposal Quality</span>
                          <div className="font-bold text-slate-800">{p.proposal_quality}/100</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">Pilot Execution</span>
                          <div className="font-bold text-slate-800">{p.pilot_performance}%</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">KPI Target Fulfilled</span>
                          <div className="font-bold text-slate-800">{p.kpi_achievement}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">
                        Readiness: <span className="font-bold text-primary-800">{p.overall_readiness}%</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                        Stage: {s.readiness_stage}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: Pilot Performance & KPI Telemetry ───────────── */}
        {activeTab === "pilots" && (
          <div className="space-y-6">
            {/* Pilot Selector */}
            <div className="gov-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary-700" />
                <span className="text-xs font-bold text-slate-800">Select Pilot for Deep Telemetry:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pilotsData?.pilots.map((p) => (
                  <button
                    key={p.pilot_id}
                    onClick={() => setSelectedPilotId(p.pilot_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedPilot?.pilot_id === p.pilot_id
                        ? "bg-primary-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {p.pilot_title}
                  </button>
                ))}
              </div>
            </div>

            {selectedPilot && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pilot Metadata & Health Card */}
                <div className="gov-card p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-800 uppercase tracking-wider">
                        Pilot Overview
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          selectedPilot.performance_trend === "EXCEEDING"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedPilot.performance_trend === "ON_TRACK"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {selectedPilot.performance_trend}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{selectedPilot.pilot_title}</h3>
                    <p className="text-xs text-slate-500">Challenge: {selectedPilot.challenge_title}</p>
                    <p className="text-xs text-slate-500">Startup: {selectedPilot.startup_name}</p>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-slate-600">Milestones Completed</span>
                        <span className="text-slate-900">
                          {selectedPilot.completed_milestones} / {selectedPilot.total_milestones} ({selectedPilot.milestone_completion_rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-700 h-full rounded-full transition-all duration-500"
                          style={{ width: `${selectedPilot.milestone_completion_rate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-slate-600">Overall KPI Attainment</span>
                        <span className="text-slate-900">{selectedPilot.overall_kpi_achievement}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(selectedPilot.overall_kpi_achievement, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk/Issue Counts */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px]">Open Risks</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {selectedPilot.open_risks_count} / {selectedPilot.risks_count}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px]">Open Issues</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {selectedPilot.open_issues_count} / {selectedPilot.issues_count}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time-Series KPI Measurement Trends */}
                <div className="gov-card p-5 lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Time-Series KPI Field Measurements</h3>
                    <p className="text-xs text-slate-500">Historical progression of measured parameters over pilot duration</p>
                  </div>

                  {selectedPilot.kpis.length > 0 ? (
                    <div className="space-y-6">
                      {selectedPilot.kpis.map((kpi) => (
                        <div key={kpi.kpi_id} className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <div>
                              <span className="font-bold text-slate-800">{kpi.name}</span>
                              <span className="text-slate-500 ml-2">
                                (Target: {kpi.target_operator} {kpi.target_value} {kpi.unit})
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                kpi.achievement_percentage >= 90
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {kpi.achievement_percentage}% Achieved
                            </span>
                          </div>

                          {kpi.history.length > 0 ? (
                            <div className="h-44">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={kpi.history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                  <XAxis dataKey="measurement_date" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 10 }} />
                                  <Tooltip />
                                  <Line
                                    type="monotone"
                                    dataKey="actual_value"
                                    stroke="#1D4ED8"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Actual Field Value"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="target_value"
                                    stroke="#10B981"
                                    strokeDasharray="4 4"
                                    dot={false}
                                    name="Target Ceiling"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                              No time-series measurement entries recorded for this metric yet.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No KPIs assigned to this pilot record.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
