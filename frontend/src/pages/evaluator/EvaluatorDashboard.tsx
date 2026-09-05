/**
 * Evaluator Dashboard — Production-quality shell with synthetic data.
 */

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Table, { type TableColumn } from "@/components/ui/Table";
import { ClipboardCheck } from "lucide-react";
import { evaluatorDashboardStats, evaluatorAssignments } from "@/data/demoData";

type AssignmentRow = (typeof evaluatorAssignments)[number];

const assignmentColumns: TableColumn<AssignmentRow>[] = [
  {
    key: "title",
    header: "Proposal & Challenge Title",
    render: (row) => (
      <p className="font-bold text-slate-900 text-xs">{row.title}</p>
    ),
  },
  {
    key: "startup",
    header: "Startup",
    render: (row) => <span className="text-slate-600 font-medium">{row.startup}</span>,
  },
  {
    key: "status",
    header: "Status",
    width: "140px",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "deadline",
    header: "Deadline",
    width: "120px",
    render: (row) => (
      <span className="text-slate-500 font-medium text-xs">{row.deadline}</span>
    ),
  },
];

export default function EvaluatorDashboard() {
  const stats = evaluatorDashboardStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Evaluator Portal"
        description="Assigned proposal scoring, objective evaluation rubrics, and pilot telemetry validation"
      />

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={<ClipboardCheck className="w-4 h-4 text-purple-700" />}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            accentColor="purple"
          />
        ))}
      </div>

      {/* ── Assignments Table ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Assigned Technical Evaluations
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Confidential Review
          </span>
        </div>
        <Table
          columns={assignmentColumns}
          data={evaluatorAssignments}
          keyExtractor={(row) => row.id}
        />
      </div>
    </div>
  );
}
