/**
 * InnovationMemoryPage — Institutional Knowledge & Procurement Intelligence.
 *
 * Searchable, structured institutional memory capturing what solutions worked,
 * what failed, real KPI benchmarks, and lessons learned from past startup pilots.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import {
  innovationMemoryService,
  type InnovationMemoryItem,
} from "@/services/innovationMemoryService";
import {
  BookOpen,
  Search,
  Filter,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Building2,
  ArrowRight,
  Award,
  Sparkles,
} from "lucide-react";

export default function InnovationMemoryPage() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState<InnovationMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await innovationMemoryService.getMemories({
        page,
        page_size: pageSize,
        search: search || undefined,
        outcome: selectedOutcome || undefined,
        domain: selectedDomain || undefined,
      });
      setMemories(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load innovation memories", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedOutcome, selectedDomain]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Derived metrics
  const scaleCount = memories.filter((m) => m.outcome === "SCALE").length;
  const extendCount = memories.filter((m) => m.outcome === "EXTEND").length;
  const rejectCount = memories.filter((m) => m.outcome === "REJECT").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Innovation Memory"
        description="Institutional knowledge base capturing validated pilot outcomes, KPI achievements, and lessons learned from past procurement workflows to accelerate future decision-making."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Evidence-Based Procurement
            </span>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Knowledge Entries
            </p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{total}</p>
            <p className="text-xs text-neutral-400 mt-1">Archived pilot outcomes</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Scaled Innovations
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{scaleCount}</p>
            <p className="text-xs text-neutral-400 mt-1">Successfully deployed</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Extended Solutions
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{extendCount}</p>
            <p className="text-xs text-neutral-400 mt-1">Refining field performance</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Avoided Pitfalls
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{rejectCount}</p>
            <p className="text-xs text-neutral-400 mt-1">Documented failure modes</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search problems, technologies, startups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Outcome:</span>
          </div>
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="py-1.5 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Outcomes</option>
            <option value="SCALE">Scale Approved</option>
            <option value="EXTEND">Extension Granted</option>
            <option value="REJECT">Rejected / Closed</option>
          </select>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="py-1.5 px-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Domains</option>
            <option value="Smart Infrastructure">Smart Infrastructure</option>
            <option value="Defence">Defence & Security</option>
            <option value="Health">Healthcare & Diagnostics</option>
          </select>

          {(search || selectedOutcome || selectedDomain) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedOutcome("");
                setSelectedDomain("");
              }}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Memory Card Grid */}
      {loading ? (
        <LoadingState variant="inline" message="Loading institutional innovation memory..." />
      ) : memories.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
          <Lightbulb className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-800">No Innovation Memories Found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/gov/innovation-memory/${m.id}`)}
              className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Outcome Badge + Domain */}
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={m.outcome || "DRAFT"} />
                  {m.domain && (
                    <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded truncate max-w-[140px]">
                      {m.domain}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-neutral-900 line-clamp-2 leading-snug">
                  {m.title}
                </h3>

                {/* Startup Attribution */}
                {m.startup_name && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{m.startup_name}</span>
                  </div>
                )}

                {/* Summary */}
                <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                  {m.summary}
                </p>

                {/* Key Metrics Chips */}
                {m.key_metrics && Object.keys(m.key_metrics).length > 0 && (
                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5">
                    {Object.entries(m.key_metrics).slice(0, 3).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200 text-neutral-700"
                      >
                        <strong className="text-neutral-900">{String(v)}</strong> {k.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {/* Lesson learned preview */}
                {m.lessons_learned && m.lessons_learned.length > 0 && (
                  <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100/80 text-xs text-amber-900">
                    <div className="flex items-center gap-1 font-semibold text-amber-800 text-[11px] mb-1">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      <span>Key Lesson:</span>
                    </div>
                    <p className="line-clamp-2 italic text-[11px] text-amber-950">
                      "{m.lessons_learned[0]}"
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-primary-600 font-medium">
                <span>Explore Full Analysis & Directives</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
