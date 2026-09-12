/**
 * Challenge List Page — Browse, search, and filter innovation challenges.
 * Connected to live FastAPI backend endpoints.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { listChallenges, type ListChallengesResponse } from "@/services/challengeService";
import type { Challenge, ChallengeStatus } from "@/types";
import {
  Plus,
  Search,
  Calendar,
  IndianRupee,
  Clock,
  FileText,
  Sparkles,
  Building2,
  ChevronRight,
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

const STATUSES: { label: string; value: ChallengeStatus | "ALL" }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Accepting Proposals", value: "ACCEPTING_PROPOSALS" },
  { label: "Under Evaluation", value: "UNDER_EVALUATION" },
  { label: "Pilot Phase", value: "PILOT_PHASE" },
  { label: "Completed", value: "COMPLETED" },
];

export default function ChallengeListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGovOfficer = user?.role === "GOVERNMENT_OFFICER" || user?.role === "ADMIN";

  const [data, setData] = useState<ListChallengesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listChallenges({
        search: search || undefined,
        domain: selectedDomain !== "All Domains" ? selectedDomain : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        page,
        limit: 10,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, [search, selectedDomain, selectedStatus, page]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Procurement Challenges"
        description="Browse and manage government innovation requirements and pilot opportunities."
        actions={
          isGovOfficer ? (
            <button
              onClick={() => navigate("/gov/challenges/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Challenge</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, domain, or problem..."
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

        {/* Status Filter */}
        <div className="sm:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as ChallengeStatus | "ALL");
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading challenges..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchChallenges} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No Challenges Found"
          description="There are no challenges matching your filter criteria. Create a new challenge or adjust your filters."
          action={
            isGovOfficer ? (
              <button
                onClick={() => navigate("/gov/challenges/new")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Challenge</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium px-1">
            Showing {data.items.length} of {data.total} challenge{data.total !== 1 ? "s" : ""}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.items.map((challenge: Challenge) => (
              <div
                key={challenge.id}
                onClick={() => {
                  const pathPrefix = user?.role === "STARTUP" ? "/startup" : user?.role === "EVALUATOR" ? "/evaluator" : user?.role === "ADMIN" ? "/admin" : "/gov";
                  navigate(`${pathPrefix}/challenges/${challenge.id}`);
                }}
                className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Column: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={challenge.status} />
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {challenge.domain}
                      </span>
                      {challenge.isAiStructured && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>AI Structured</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {challenge.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-normal">
                        {challenge.problemStatement}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      {challenge.departmentName && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{challenge.departmentName}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        <span>Est. {formatCurrency(challenge.estimatedBudget)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{challenge.targetPilotDurationWeeks} weeks pilot</span>
                      </span>
                      {challenge.submissionDeadline && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Deadline: {new Date(challenge.submissionDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{challenge.proposalCount} proposals</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center justify-end md:self-center shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 group-hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
