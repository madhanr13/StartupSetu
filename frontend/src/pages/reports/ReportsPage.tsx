/**
 * Reports — Document Generation Center
 *
 * Dedicated page for generating, viewing, and exporting formal procurement
 * intelligence reports. Separated from the live KPI Analytics dashboard.
 *
 * Uses the existing /analytics/export/report backend endpoint.
 */

import { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileBarChart,
  FileText,
  FlaskConical,
  Loader2,
  RefreshCw,
  ScrollText,
  Target,
  X,
} from "lucide-react";

import { analyticsService } from "@/services/analyticsService";
import type {
  AnalyticsReportExportResponse,
  ChallengeAnalyticsResponse,
  PilotPerformanceAnalyticsResponse,
} from "@/types";

interface GeneratedReportEntry {
  report: AnalyticsReportExportResponse;
  generatedAt: Date;
}

export default function ReportsPage() {
  // Report type selection
  const [reportType, setReportType] = useState<"PLATFORM" | "CHALLENGE" | "PILOT">("PLATFORM");
  const [entityId, setEntityId] = useState<string>("");

  // Entity lists for pickers
  const [challenges, setChallenges] = useState<{ id: string; title: string }[]>([]);
  const [pilots, setPilots] = useState<{ id: string; title: string }[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  // Report generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<AnalyticsReportExportResponse | null>(null);
  const [reportHistory, setReportHistory] = useState<GeneratedReportEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load challenge & pilot lists for entity pickers
  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoadingEntities(true);
        const [challengeRes, pilotRes] = await Promise.all([
          analyticsService.getChallengeAnalytics(),
          analyticsService.getPilotPerformance(),
        ]);

        setChallenges(
          (challengeRes as ChallengeAnalyticsResponse).challenges.map((c) => ({
            id: c.challenge_id,
            title: c.challenge_title,
          }))
        );

        setPilots(
          (pilotRes as PilotPerformanceAnalyticsResponse).pilots.map((p) => ({
            id: p.pilot_id,
            title: p.pilot_title,
          }))
        );
      } catch (err) {
        console.error("Failed to load entity lists for reports:", err);
      } finally {
        setLoadingEntities(false);
      }
    };

    loadEntities();
  }, []);

  // Auto-select first entity when type changes
  useEffect(() => {
    if (reportType === "CHALLENGE" && challenges.length > 0) {
      setEntityId(challenges[0].id);
    } else if (reportType === "PILOT" && pilots.length > 0) {
      setEntityId(pilots[0].id);
    } else {
      setEntityId("");
    }
  }, [reportType, challenges, pilots]);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedReport(null);

      const res = await analyticsService.exportSummaryReport({
        type: reportType,
        id: entityId || undefined,
        format: "markdown",
      });

      setGeneratedReport(res);
      setReportHistory((prev) => [{ report: res, generatedAt: new Date() }, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport.report_content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleDownloadReport = () => {
    if (generatedReport) {
      const blob = new Blob([generatedReport.report_content], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${generatedReport.report_title.replace(/\s+/g, "_")}.md`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleViewHistoryReport = (entry: GeneratedReportEntry) => {
    setGeneratedReport(entry.report);
    setReportType(entry.report.entity_type as "PLATFORM" | "CHALLENGE" | "PILOT");
  };

  const reportTypeCards = [
    {
      type: "PLATFORM" as const,
      icon: BarChart3,
      title: "Platform Executive Summary",
      description: "Comprehensive overview of all procurement activity, pipeline conversion, KPI achievements, and decision metrics across the entire platform.",
    },
    {
      type: "CHALLENGE" as const,
      icon: Target,
      title: "Challenge Assessment Report",
      description: "Detailed assessment of a specific challenge including startup participation, proposal quality, evaluation scores, and procurement outcomes.",
    },
    {
      type: "PILOT" as const,
      icon: FlaskConical,
      title: "Pilot Assessment Report",
      description: "Field pilot progress report covering milestone completion, KPI achievement trends, risk assessments, and scale-up readiness evaluation.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 space-y-8">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
            Governance
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Procurement Reports
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Generate formal assessment documents and intelligence summaries from verified platform data.
          Reports are structured for official record-keeping, committee review, and stakeholder communication.
        </p>
      </div>

      {/* ── Report Type Selector ────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary-700" />
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Select Report Type
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypeCards.map((card) => {
            const Icon = card.icon;
            const isSelected = reportType === card.type;

            return (
              <button
                key={card.type}
                type="button"
                onClick={() => {
                  setReportType(card.type);
                  setGeneratedReport(null);
                  setError(null);
                }}
                className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-primary-600 bg-primary-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      isSelected
                        ? "bg-primary-100 text-primary-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-primary-700" />
                  )}
                </div>
                <h3
                  className={`text-sm font-bold mb-1.5 ${
                    isSelected ? "text-primary-900" : "text-slate-800"
                  }`}
                >
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Entity Picker (for Challenge/Pilot) ────────────────── */}
      {(reportType === "CHALLENGE" || reportType === "PILOT") && (
        <div className="gov-card p-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {reportType === "CHALLENGE" ? "Select Challenge" : "Select Pilot"}
          </label>

          {loadingEntities ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading available entities...</span>
            </div>
          ) : (
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-colors"
            >
              {(reportType === "CHALLENGE" ? challenges : pilots).map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.title}
                </option>
              ))}
              {(reportType === "CHALLENGE" ? challenges : pilots).length === 0 && (
                <option value="" disabled>
                  No {reportType === "CHALLENGE" ? "challenges" : "pilots"} available
                </option>
              )}
            </select>
          )}
        </div>
      )}

      {/* ── Generate Button ────────────────────────────────────── */}
      <div>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating || (reportType !== "PLATFORM" && !entityId)}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-primary-800 text-white rounded-xl text-sm font-semibold hover:bg-primary-900 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FileBarChart className="w-4 h-4" />
          )}
          <span>{isGenerating ? "Compiling Report..." : "Generate Report"}</span>
        </button>
      </div>

      {/* ── Error State ────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Report Generation Failed</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Generated Report Viewer ────────────────────────────── */}
      {generatedReport && (
        <div className="gov-card overflow-hidden">
          {/* Report Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileText className="w-5 h-5 text-primary-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {generatedReport.report_title}
                </h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Generated: {new Date(generatedReport.generated_at).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                    {generatedReport.entity_type}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 uppercase">
                    {generatedReport.content_format}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copySuccess ? "Copied!" : "Copy to Clipboard"}</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900 transition-colors shadow-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-6">
            <div className="bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-xs leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap border border-slate-700">
              {generatedReport.report_content}
            </div>
          </div>
        </div>
      )}

      {/* ── Report History (Session) ───────────────────────────── */}
      {reportHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Session Report History
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({reportHistory.length} generated)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportHistory.map((entry, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleViewHistoryReport(entry)}
                className={`text-left p-4 rounded-lg border transition-all duration-150 ${
                  generatedReport === entry.report
                    ? "border-primary-500 bg-primary-50/60"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {entry.report.report_title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {entry.report.entity_type}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {entry.generatedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State (no report generated yet) ──────────────── */}
      {!generatedReport && !isGenerating && !error && (
        <div className="gov-card p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <FileBarChart className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Report Generated Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Select a report type above and click "Generate Report" to create a formal procurement intelligence document.
          </p>
        </div>
      )}
    </div>
  );
}
