/**
 * Challenge Detail Page — Structured view of a single challenge.
 * Displays problem statement, requirements, KPIs, evaluation criteria, and AI notes.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { getChallenge, publishChallenge } from "@/services/challengeService";
import type { Challenge } from "@/types";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  IndianRupee,
  FileText,
  Sparkles,
  CheckCircle2,
  Send,
  Loader2,
  ShieldCheck,
  Target,
  ListChecks,
  Award,
} from "lucide-react";

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "kpis" | "rubric">("overview");

  const fetchChallengeData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getChallenge(id);
      setChallenge(data);
    } catch (err: any) {
      setError(err.message || "Failed to load challenge details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallengeData();
  }, [fetchChallengeData]);

  const handlePublish = async () => {
    if (!id) return;
    try {
      setIsPublishing(true);
      const updated = await publishChallenge(id);
      setChallenge(updated);
    } catch (err: any) {
      alert(err.message || "Failed to publish challenge");
    } finally {
      setIsPublishing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) return <LoadingState label="Loading challenge details..." />;
  if (error || !challenge) return <ErrorState message={error || "Challenge not found"} onRetry={fetchChallengeData} />;

  const isGovOfficer = user?.role === "GOVERNMENT_OFFICER" || user?.role === "ADMIN";
  const isStartup = user?.role === "STARTUP";

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const backPath = isStartup ? "/startup/challenges" : "/gov/challenges";
              navigate(backPath);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={challenge.status} />
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              {challenge.domain}
            </span>
            {challenge.isAiStructured && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Structured</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isGovOfficer && challenge.status === "DRAFT" && (
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Publish Challenge</span>
              </button>
            )}

            {isStartup && (challenge.status === "PUBLISHED" || challenge.status === "ACCEPTING_PROPOSALS") && (
              <button
                type="button"
                onClick={() => alert("Proposal submission form will be available in Phase 3.")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Submit Proposal</span>
              </button>
            )}
          </div>
        </div>

        <PageHeader
          title={challenge.title}
          description={challenge.subDomain ? `Domain: ${challenge.domain} • Sub-Domain: ${challenge.subDomain}` : `Domain: ${challenge.domain}`}
          className="mb-0"
        />

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Est. Budget</span>
              <span className="font-bold text-slate-900">{formatCurrency(challenge.estimatedBudget)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Pilot Duration</span>
              <span className="font-bold text-slate-900">{challenge.targetPilotDurationWeeks} Weeks</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Deadline</span>
              <span className="font-bold text-slate-900">
                {challenge.submissionDeadline
                  ? new Date(challenge.submissionDeadline).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Open"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Proposals Received</span>
              <span className="font-bold text-slate-900">{challenge.proposalCount} Submitted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Problem Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("requirements")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "requirements"
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Requirements ({challenge.requirements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("kpis")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "kpis"
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Target KPIs ({challenge.kpis.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("rubric")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === "rubric"
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Evaluation Rubric ({challenge.evaluationCriteria.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* AI Structuring Log Banner */}
          {challenge.isAiStructured && challenge.aiStructuringNotes && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-purple-800">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Challenge Structuring Log</span>
              </div>
              <p className="text-purple-700 text-[11px] leading-relaxed">
                {challenge.aiStructuringNotes}
              </p>
              {challenge.rawUnstructuredPrompt && (
                <div className="mt-2 pt-2 border-t border-purple-200/60 text-[11px] font-mono text-purple-800 bg-purple-100/50 p-2 rounded">
                  <span className="font-sans font-bold text-purple-900 block mb-1">Original Officer Input:</span>
                  "{challenge.rawUnstructuredPrompt}"
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Problem Statement</h3>
              <p className="text-xs text-slate-800 leading-relaxed font-normal bg-slate-50 p-4 rounded-lg border border-slate-200/60 whitespace-pre-line">
                {challenge.problemStatement}
              </p>
            </div>

            {challenge.description && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Context & Background</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {challenge.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {challenge.technologies && challenge.technologies.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Relevant Technologies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {challenge.technologies.map((tech, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-800 font-medium px-2.5 py-1 rounded-md border border-slate-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {challenge.expectedOutcomes && challenge.expectedOutcomes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Expected Outcomes</h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {challenge.expectedOutcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {challenge.constraints && challenge.constraints.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Constraints & Compliance Rules</h4>
                <ul className="space-y-1 text-xs text-slate-700">
                  {challenge.constraints.map((constraint, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "requirements" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Functional & Technical Specifications</h3>
            <p className="text-xs text-slate-500">Formal specifications for startup solution compliance.</p>
          </div>

          {challenge.requirements.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No specific requirements defined.</p>
          ) : (
            <div className="space-y-3">
              {challenge.requirements.map((req, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {req.requirementType}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{req.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600">{req.description}</p>
                  </div>

                  {req.isMandatory ? (
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      Optional
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "kpis" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Target Pilot Key Performance Indicators</h3>
            <p className="text-xs text-slate-500">Quantifiable metrics used to validate pilot performance prior to scaling.</p>
          </div>

          {challenge.kpis.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No KPIs defined.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {challenge.kpis.map((kpi, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{kpi.name}</h4>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Target: {kpi.targetValue} {kpi.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{kpi.description}</p>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Importance Weight: {(kpi.weight * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "rubric" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Evaluation Rubric & Scoring Guide</h3>
            <p className="text-xs text-slate-500">Criteria and weighting used during technical evaluation.</p>
          </div>

          {challenge.evaluationCriteria.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No evaluation criteria defined.</p>
          ) : (
            <div className="space-y-3">
              {challenge.evaluationCriteria.map((crit, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{crit.criterionName}</h4>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        Weight: {crit.weight}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{crit.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-md block">
                      Max: {crit.maxScore} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
