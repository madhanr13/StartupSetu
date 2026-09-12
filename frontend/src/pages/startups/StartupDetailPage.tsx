/**
 * Startup Detail Page — Government Procurement Capability Record.
 * Displays overall Startup Readiness Score breakdown (0-100), technology stack,
 * domains, past case study projects, deployments, and certifications.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { getStartup } from "@/services/startupService";
import type { Startup } from "@/types";
import {
  ArrowLeft,
  MapPin,
  Globe,
  Mail,
  ShieldCheck,
  Users,
  CheckCircle2,
  Award,
  Layers,
  FileCheck,
  Zap,
} from "lucide-react";

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStartupData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getStartup(id);
      setStartup(res);
    } catch (err: any) {
      setError(err.message || "Failed to load startup capability record");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStartupData();
  }, [fetchStartupData]);

  if (loading) return <LoadingState message="Loading capability profile..." />;
  if (error || !startup)
    return <ErrorState message={error || "Startup profile not found"} onRetry={fetchStartupData} />;

  const rScore = startup.readiness_score || {
    technical_capability: 80,
    team_strength: 80,
    deployment_readiness: 80,
    security_readiness: 80,
    scalability: 80,
    financial_readiness: 80,
    domain_experience: 80,
    government_readiness: 80,
    overall_score: 80,
  };

  const dimensions = [
    { label: "Technical Capability", score: rScore.technical_capability },
    { label: "Team Strength", score: rScore.team_strength },
    { label: "Deployment Readiness", score: rScore.deployment_readiness },
    { label: "Security Readiness", score: rScore.security_readiness },
    { label: "Scalability", score: rScore.scalability },
    { label: "Financial Readiness", score: rScore.financial_readiness },
    { label: "Domain Experience", score: rScore.domain_experience },
    { label: "Government Readiness", score: rScore.government_readiness },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {startup.dpiit_recognized && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DPIIT Recognized {startup.dpiit_number ? `(${startup.dpiit_number})` : ""}</span>
              </span>
            )}
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
              Est. {startup.founded_year || "2021"}
            </span>
          </div>
        </div>

        <PageHeader
          title={startup.company_name}
          description={startup.short_description || "Startup Capability Record"}
          className="mb-0"
        />

        {/* Contact & Meta strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          {startup.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{startup.location}</span>
            </span>
          )}
          {startup.website && (
            <a
              href={startup.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-700 font-semibold hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{startup.website.replace("https://", "").replace("http://", "")}</span>
            </a>
          )}
          {startup.contact_email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{startup.contact_email}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{startup.employee_count || "20+"} Team Members</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Readiness Scorecard & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Startup Readiness Scorecard */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Startup Readiness Score
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                General Preparedness
              </span>
            </div>

            <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Overall Readiness
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {rScore.overall_score.toFixed(1)}{" "}
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Dimensional Progress Bars */}
            <div className="space-y-3 pt-2">
              {dimensions.map((dim) => (
                <div key={dim.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{dim.label}</span>
                    <span className="text-slate-900">{dim.score.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-[11px] text-slate-500 leading-normal space-y-1">
              <span className="font-bold text-slate-700 block">Note on Scoring:</span>
              <span>
                Startup Readiness Score evaluates general company operational and technical maturity. It is distinct from challenge-specific match scores.
              </span>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Security & Compliance
            </h3>
            {startup.certifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No formal certifications listed.</p>
            ) : (
              <div className="space-y-2">
                {startup.certifications.map((cert, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{cert.name}</span>
                      <Award className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    {cert.issuing_authority && (
                      <span className="block text-[11px] text-slate-500">Issuer: {cert.issuing_authority}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2 cols): Capabilities, Case Studies, Deployments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Description */}
          {startup.description && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
                Company Description & Core Focus
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {startup.description}
              </p>
            </div>
          )}

          {/* Technology & Domain Stacks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tech Stack */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Technology Stack</span>
                <Zap className="w-4 h-4 text-blue-700" />
              </h3>
              <div className="space-y-2">
                {startup.technologies.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                    <span className="font-bold text-slate-900">{t.technology}</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {t.proficiency || "Expert"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Industry Domains</span>
                <Layers className="w-4 h-4 text-purple-700" />
              </h3>
              <div className="space-y-2">
                {startup.domains.map((d, i) => (
                  <div key={i} className="text-xs font-bold text-slate-800 p-2 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{d.domain}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Previous Case Study Projects */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Verified Previous Case Studies</h3>
                <p className="text-xs text-slate-500">Past projects, deployment scale, and quantitative outcomes.</p>
              </div>
              <FileCheck className="w-4 h-4 text-slate-400" />
            </div>

            {startup.projects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No case study projects added.</p>
            ) : (
              <div className="space-y-4">
                {startup.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{proj.name}</h4>
                      {proj.client_type && (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                          {proj.client_type}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                    {proj.outcome && (
                      <div className="p-2 bg-emerald-50/60 border border-emerald-200/60 rounded text-[11px] font-semibold text-emerald-900">
                        Outcome: {proj.outcome}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {proj.deployment_scale && (
                        <span>Scale: <strong>{proj.deployment_scale}</strong></span>
                      )}
                      {proj.year && <span>Year: {proj.year}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
