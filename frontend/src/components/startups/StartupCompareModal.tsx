/**
 * Startup Compare Modal — Side-by-Side Capability Comparison Matrix.
 * Allows government officers to compare up to 3 candidate startups across 8 dimensions.
 */

import type { StartupMatchRecommendation } from "@/types";
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface StartupCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeTitle: string;
  recommendations: StartupMatchRecommendation[];
}

export default function StartupCompareModal({
  isOpen,
  onClose,
  challengeTitle,
  recommendations,
}: StartupCompareModalProps) {
  if (!isOpen || recommendations.length === 0) return null;

  const rows = [
    {
      label: "Challenge Match Score",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="text-base font-black text-blue-700">
          {r.match_score.toFixed(1)}%
        </span>
      ),
    },
    {
      label: "Technology Fit",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-slate-900">
          {r.match_breakdown.technology_fit.toFixed(0)}%
        </span>
      ),
    },
    {
      label: "Domain Fit",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-slate-900">
          {r.match_breakdown.domain_fit.toFixed(0)}%
        </span>
      ),
    },
    {
      label: "Relevant Experience",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-slate-900">
          {r.match_breakdown.relevant_projects.toFixed(0)}%
        </span>
      ),
    },
    {
      label: "Deployment Readiness",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-slate-900">
          {r.match_breakdown.deployment_experience.toFixed(0)}%
        </span>
      ),
    },
    {
      label: "Scalability",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-slate-900">
          {r.match_breakdown.scalability.toFixed(0)}%
        </span>
      ),
    },
    {
      label: "Security Readiness",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-slate-900">
          {r.match_breakdown.security_readiness.toFixed(0)}%
        </span>
      ),
    },
    {
      label: "Startup General Readiness",
      getValue: (r: StartupMatchRecommendation) => (
        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          {r.readiness_overall.toFixed(1)} / 100
        </span>
      ),
    },
    {
      label: "Eligibility Status",
      getValue: (r: StartupMatchRecommendation) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            r.eligibility.status === "ELIGIBLE"
              ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
              : r.eligibility.status === "CONDITIONALLY_ELIGIBLE"
              ? "text-amber-700 bg-amber-50 border border-amber-200"
              : "text-red-700 bg-red-50 border border-red-200"
          }`}
        >
          {r.eligibility.status.replace("_", " ")}
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Side-by-Side Startup Capability Comparison
            </h2>
            <p className="text-xs text-slate-500 font-medium line-clamp-1">
              Challenge: {challengeTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Matrix */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-slate-500 font-bold uppercase tracking-wider w-1/4">
                    Dimension
                  </th>
                  {recommendations.map((rec) => (
                    <th key={rec.startup.id} className="py-3 px-4 text-slate-900 font-extrabold text-sm">
                      <div className="flex items-center gap-1.5">
                        <span>{rec.startup.company_name}</span>
                        {rec.startup.dpiit_recognized && (
                          <span title="DPIIT Recognized">
                            <ShieldCheck className="w-4 h-4 text-blue-700" />
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                        {rec.startup.location || "India"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {row.label}
                    </td>
                    {recommendations.map((rec) => (
                      <td key={rec.startup.id} className="py-3 px-4">
                        {row.getValue(rec)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Key Strengths */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 align-top">
                    Key Evidence Reasons
                  </td>
                  {recommendations.map((rec) => (
                    <td key={rec.startup.id} className="py-3 px-4 align-top">
                      <ul className="space-y-1">
                        {rec.why_recommended.map((reason, i) => (
                          <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{reason.replace("✓ ", "")}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Potential Concerns */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 align-top">
                    Potential Concerns
                  </td>
                  {recommendations.map((rec) => (
                    <td key={rec.startup.id} className="py-3 px-4 align-top">
                      {rec.potential_concerns.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">None noted</span>
                      ) : (
                        <ul className="space-y-1">
                          {rec.potential_concerns.map((c, i) => (
                            <li key={i} className="text-[11px] text-amber-800 flex items-start gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>{c.replace("⚠ ", "")}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
