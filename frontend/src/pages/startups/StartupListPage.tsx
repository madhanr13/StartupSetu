/**
 * Startup Directory Page — Browse & evaluate startup capabilities.
 * Connected to FastAPI backend search and filter endpoints.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { listStartups, type ListStartupsResponse } from "@/services/startupService";
import type { StartupSummary } from "@/types";
import {
  Search,
  MapPin,
  ChevronRight,
  Info,
  ShieldCheck,
} from "lucide-react";

const DOMAINS = [
  "All Domains",
  "Infrastructure & Mobility",
  "Water Resources & Smart Utilities",
  "Public Health & Medical Technology",
  "Smart Governance & Digital Services",
  "Agriculture & Rural Technology",
  "Clean Energy & Environment",
];

export default function StartupListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rolePrefix = user?.role === "STARTUP" ? "/startup" : user?.role === "EVALUATOR" ? "/evaluator" : user?.role === "ADMIN" ? "/admin" : "/gov";

  const [data, setData] = useState<ListStartupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [minReadiness, setMinReadiness] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  const fetchStartups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listStartups({
        search: search || undefined,
        domain: selectedDomain !== "All Domains" ? selectedDomain : undefined,
        minReadiness,
        page,
        limit: 9,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load startup directory");
    } finally {
      setLoading(false);
    }
  }, [search, selectedDomain, minReadiness, page]);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  const getReadinessColor = (score: number) => {
    if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 85) return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-purple-700 bg-purple-50 border-purple-200";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Startup Directory"
        description="Browse and evaluate startup capability profiles and general readiness scores."
      />

      {/* Synthetic Data Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>DEMO / SYNTHETIC DATA:</strong> The startup capability records shown are fictional demonstration companies seeded for platform testing.
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded shrink-0">
          Synthetic
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by startup name, technology, domain, or project..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* Domain Filter */}
        <div className="sm:w-56">
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            {DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>

        {/* Readiness Filter */}
        <div className="sm:w-44">
          <select
            value={minReadiness === undefined ? "" : minReadiness.toString()}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setMinReadiness(val);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            <option value="">All Readiness</option>
            <option value="90">90+ Exceptional</option>
            <option value="85">85+ High Readiness</option>
            <option value="80">80+ Moderate</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading startup capability directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStartups} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No Startups Found"
          description="No startup capability profiles matched your search and filter criteria."
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium px-1">
            Showing {data.items.length} of {data.total} registered startup{data.total !== 1 ? "s" : ""}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((startup: StartupSummary) => {
              const overallScore = startup.readiness_score?.overall_score || 80;

              return (
                <div
                  key={startup.id}
                  onClick={() => navigate(`${rolePrefix}/startups/${startup.id}`)}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header: Name, Location, Readiness Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {startup.company_name}
                          </h3>
                          {startup.dpiit_recognized && (
                            <span title="DPIIT Recognized Startup">
                              <ShieldCheck
                                className="w-4 h-4 text-blue-700 shrink-0"
                              />
                            </span>
                          )}
                        </div>
                        {startup.location && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{startup.location}</span>
                          </div>
                        )}
                      </div>

                      {/* General Readiness Score */}
                      <div
                        className={`px-2.5 py-1 rounded-lg border text-right shrink-0 ${getReadinessColor(
                          overallScore
                        )}`}
                      >
                        <span className="block text-[9px] font-bold uppercase tracking-wider">
                          Readiness
                        </span>
                        <span className="text-xs font-black">
                          {overallScore.toFixed(1)} <span className="text-[9px] font-medium text-slate-500">/ 100</span>
                        </span>
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {startup.short_description}
                    </p>

                    {/* Technologies tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {startup.technologies.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200/60"
                        >
                          {tech}
                        </span>
                      ))}
                      {startup.technologies.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-medium px-1">
                          +{startup.technologies.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Est. {startup.founded_year || "2021"} • {startup.employee_count || "20+"} Team
                    </span>

                    <button
                      type="button"
                      className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-700 group-hover:text-blue-900"
                    >
                      <span>Capability Record</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {data.page} of {data.pages}
              </span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
