/**
 * Startup Dashboard — Production-quality shell with synthetic data.
 */

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Send,
  Activity,
} from "lucide-react";
import { startupDashboardStats, startupRecentActivity } from "@/data/demoData";

export default function StartupDashboard() {
  const stats = startupDashboardStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Startup Innovation Portal"
        description="Public challenge discovery, proposal submission tracking, and live pilot telemetry sync"
      />

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={<Send className="w-4 h-4 text-emerald-700" />}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            accentColor="emerald"
          />
        ))}
      </div>

      {/* ── Recent Activity ──────────────────────────────────────── */}
      <div className="max-w-3xl space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Recent Proposal & Pilot Activity
          </h2>
        </div>
        <div className="gov-card divide-y divide-slate-100">
          {startupRecentActivity.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[11px] text-slate-400 font-medium">({item.time})</span>
                </div>
                <p className="text-xs text-slate-600">{item.description}</p>
              </div>
              <StatusBadge status={item.status} className="shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
