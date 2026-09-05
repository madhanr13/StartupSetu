/**
 * Admin Dashboard — Production-quality shell with synthetic data.
 * Also used for AUDITOR role.
 */

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Table, { type TableColumn } from "@/components/ui/Table";
import { Shield } from "lucide-react";
import { adminDashboardStats, adminRecentAuditLogs } from "@/data/demoData";

type AuditRow = (typeof adminRecentAuditLogs)[number];

const auditColumns: TableColumn<AuditRow>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    width: "160px",
    render: (row) => (
      <span className="text-xs text-slate-500 font-mono">{row.timestamp}</span>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    render: (row) => (
      <div>
        <p className="font-bold text-slate-900">{row.actor}</p>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
          {row.role}
        </span>
      </div>
    ),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => <span className="text-slate-700 font-semibold">{row.action}</span>,
  },
  {
    key: "entity",
    header: "Entity",
    width: "160px",
    render: (row) => (
      <span className="text-slate-500 font-mono text-xs">{row.entity}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "140px",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export default function AdminDashboard() {
  const stats = adminDashboardStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin & Audit Overview"
        description="Platform administration, system health monitoring, and public audit compliance"
      />

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={<Shield className="w-4 h-4 text-blue-700" />}
            label={stat.label}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </div>

      {/* ── Recent Audit Logs ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Recent System Audit Events
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Immutably Logged
          </span>
        </div>
        <Table
          columns={auditColumns}
          data={adminRecentAuditLogs}
          keyExtractor={(row) => row.id}
        />
      </div>
    </div>
  );
}
