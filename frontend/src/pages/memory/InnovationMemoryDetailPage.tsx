/**
 * InnovationMemoryDetailPage — Deep Institutional Analysis & Recommendations.
 *
 * Full case study view showing Problem → Solution → Pilot Performance →
 * KPI Benchmarks → Success/Failure Factors → Future Procurement Directives.
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import Button from "@/components/ui/Button";
import {
  innovationMemoryService,
  type InnovationMemoryItem,
} from "@/services/innovationMemoryService";
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  ExternalLink,
  Target,
  Building2,
  Compass,
  Cpu,
} from "lucide-react";

export default function InnovationMemoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [memory, setMemory] = useState<InnovationMemoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    innovationMemoryService
      .getMemoryById(id)
      .then(setMemory)
      .catch((err) => console.error("Failed to load memory detail", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <LoadingState variant="inline" message="Loading institutional case study..." />
    );
  }

  if (!memory) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <h3 className="text-base font-semibold text-neutral-800">Memory Entry Not Found</h3>
        <p className="text-sm text-neutral-500 mt-1 mb-4">
          The requested institutional memory record does not exist or has been relocated.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/gov/innovation-memory")}>
          Return to Innovation Memory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/gov/innovation-memory"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Innovation Memory Repository
        </Link>
      </div>

      {/* Main Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={memory.outcome || "DRAFT"} />
            {memory.domain && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-neutral-100 text-neutral-700">
                {memory.domain}
              </span>
            )}
            {memory.technology && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Cpu className="w-3 h-3 inline mr-1" />
                {memory.technology}
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-400">
            Recorded {new Date(memory.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">
          {memory.title}
        </h1>

        {/* Attribution Badges */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
          {memory.startup_name && (
            <div className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-neutral-400" />
              <span>Innovator: {memory.startup_name}</span>
            </div>
          )}
          {memory.challenge_area && (
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-neutral-400" />
              <span>Area: {memory.challenge_area}</span>
            </div>
          )}
          {memory.pilot_id && (
            <Link
              to={`/gov/pilots/${memory.pilot_id}`}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium"
            >
              <span>View Source Pilot Project</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Problem & Solution Summary */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-400" />
          Executive Outcome Summary
        </h2>
        <p className="text-sm text-neutral-800 leading-relaxed font-normal">
          {memory.summary}
        </p>
      </div>

      {/* KPI & Telemetry Results */}
      {memory.key_metrics && Object.keys(memory.key_metrics).length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
            <Target className="w-4 h-4 text-neutral-400" />
            Validated Field Telemetry & KPI Benchmarks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(memory.key_metrics).map(([k, v]) => (
              <div key={k} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
                <p className="text-xl font-bold text-neutral-900">{String(v)}</p>
                <p className="text-xs text-neutral-500 uppercase font-medium mt-0.5">
                  {k.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons Learned */}
      {memory.lessons_learned && memory.lessons_learned.length > 0 && (
        <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Field Lessons Learned & Operational Takeaways
          </h2>
          <ul className="space-y-2.5">
            {memory.lessons_learned.map((lesson, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-amber-950">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{lesson}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success vs Failure Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Factors */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Key Success Factors
          </h2>
          {memory.success_factors && memory.success_factors.length > 0 ? (
            <ul className="space-y-2">
              {memory.success_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-400 italic">No specific success factors recorded.</p>
          )}
        </div>

        {/* Failure / Bottleneck Factors */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            Failure Modes & Critical Vulnerabilities
          </h2>
          {memory.failure_factors && memory.failure_factors.length > 0 ? (
            <ul className="space-y-2">
              {memory.failure_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-400 italic">
              No critical failure factors observed during this pilot.
            </p>
          )}
        </div>
      </div>

      {/* Recommendations & Future Directives */}
      {memory.recommendations && memory.recommendations.length > 0 && (
        <div className="bg-indigo-50/50 rounded-xl border border-indigo-200/80 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Future Procurement Specifications & Policy Directives
          </h2>
          <div className="space-y-2.5">
            {memory.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-indigo-950 font-medium flex items-start gap-2"
              >
                <span className="text-indigo-600 font-bold">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
