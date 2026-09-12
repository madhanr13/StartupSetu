/**
 * AI Startup Discovery Page — Recommended Startups for a Government Challenge.
 * Displays AI-ranked candidates with Challenge Match Scores (%), Readiness Scores,
 * eligibility screening results, weighted capability breakdown, and evidence explanations.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import StartupCompareModal from "@/components/startups/StartupCompareModal";
import { getChallenge } from "@/services/challengeService";
import { getChallengeRecommendations } from "@/services/startupService";
import type { Challenge, StartupMatchRecommendation } from "@/types";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Columns,
} from "lucide-react";

export default function FindStartupsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role === "STARTUP" ? "/startup" : user?.role === "EVALUATOR" ? "/evaluator" : user?.role === "ADMIN" ? "/admin" : "/gov";

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [recommendations, setRecommendations] = useState<StartupMatchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comparison selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [chData, recsData] = await Promise.all([
        getChallenge(id),
        getChallengeRecommendations(id),
      ]);
      setChallenge(chData);
      setRecommendations(recsData);
    } catch (err: any) {
      setError(err.message || "Failed to load startup recommendations");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelect = (startupId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(startupId)) {
        return prev.filter((i) => i !== startupId);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 startups at a time.");
        return prev;
      }
      return [...prev, startupId];
    });
  };

  if (loading) return <LoadingState message="Analyzing startup capabilities & ranking candidates..." />;
  if (error || !challenge)
    return <ErrorState message={error || "Challenge not found"} onRetry={fetchData} />;

  const selectedRecs = recommendations.filter((r) => selectedIds.includes(r.startup.id));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/gov/challenges/${id}`)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Semantic Startup Discovery</span>
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md transition-all"
            >
              <Columns className="w-4 h-4" />
              <span>Compare Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>

        <PageHeader
          title="Recommended Startups"
          description="Startups ranked by intelligent capability suitability for this challenge."
          className="mb-0"
        />

        {/* Challenge Context Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Challenge Context
            </span>
            <span className="text-xs font-semibold text-blue-300">
              {challenge.domain}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">{challenge.title}</h3>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {challenge.problemStatement}
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <EmptyState
          title="No Matching Startups Found"
          description="No registered startups currently match the challenge requirements."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Showing {recommendations.length} recommended startups ranked by match suitability</span>
            <span>Select up to 3 to compare side-by-side</span>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => {
              const isSelected = selectedIds.includes(rec.startup.id);

              return (
                <div
                  key={rec.startup.id}
                  className={`bg-white border rounded-xl p-6 shadow-sm transition-all space-y-4 ${
                    isSelected ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20" : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for compare */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(rec.startup.id)}
                        className="mt-1 text-slate-400 hover:text-blue-700 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-700" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Rank badge */}
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                        #{rec.rank}
                      </div>

                      {/* Startup Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => navigate(`${rolePrefix}/startups/${rec.startup.id}`)}
                            className="text-base font-bold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            {rec.startup.company_name}
                          </h3>
                          {rec.startup.dpiit_recognized && (
                            <span title="DPIIT Recognized">
                              <ShieldCheck className="w-4 h-4 text-blue-700" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                          {rec.startup.short_description}
                        </p>
                      </div>
                    </div>

                    {/* Right Scores */}
                    <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                      {/* Match Score */}
                      <div className="text-right bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-900">
                          Challenge Match
                        </span>
                        <span className="text-base font-black text-blue-700">
                          {rec.match_score.toFixed(1)}%
                        </span>
                      </div>

                      {/* General Readiness Score */}
                      <div className="text-right bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          General Readiness
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {rec.readiness_overall.toFixed(1)} <span className="text-[10px] font-medium text-slate-400">/ 100</span>
                        </span>
                      </div>

                      {/* Eligibility Status */}
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border block ${
                            rec.eligibility.status === "ELIGIBLE"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : rec.eligibility.status === "CONDITIONALLY_ELIGIBLE"
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-red-700 bg-red-50 border-red-200"
                          }`}
                        >
                          {rec.eligibility.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capability Match Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Tech Fit</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.technology_fit.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Domain Fit</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.domain_fit.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Experience</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.relevant_projects.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Deployment</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.deployment_experience.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Scalability</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.scalability.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Security</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.security_readiness.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold">Budget</span>
                      <span className="font-bold text-slate-900">{rec.match_breakdown.budget_compatibility.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Why Recommended & Concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Why Recommended?</span>
                      </h4>
                      <ul className="space-y-1">
                        {rec.why_recommended.map((reason, idx) => (
                          <li key={idx} className="text-slate-700 flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{reason.replace("✓ ", "")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rec.potential_concerns.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Potential Considerations</span>
                        </h4>
                        <ul className="space-y-1">
                          {rec.potential_concerns.map((concern, idx) => (
                            <li key={idx} className="text-amber-900 flex items-start gap-1.5">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{concern.replace("⚠ ", "")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`${rolePrefix}/startups/${rec.startup.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
                    >
                      <span>View Capability Record</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <StartupCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        challengeTitle={challenge.title}
        recommendations={selectedRecs}
      />
    </div>
  );
}
