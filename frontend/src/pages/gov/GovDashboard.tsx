/**
 * Government Officer Dashboard — Operational Task-Oriented View.
 */

import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import AIIntelligencePanel from "@/components/ui/AIIntelligencePanel";
import ActivityTimeline from "@/components/ui/ActivityTimeline";
import PendingActions from "@/components/ui/PendingActions";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  govDemoChallenges,
  govDemoPendingActions,
  govDemoAIInsights,
  govDemoActivities,
  type DemoChallenge,
} from "@/data/demoData";
import {
  Target,
  FileText,
  FlaskConical,
  CheckCircle2,
  Award,
  Eye,
  ArrowUpRight,
} from "lucide-react";

interface DemoPilot {
  id: string;
  name: string;
  startup: string;
  progress: number;
  status: "PILOT PHASE" | "IN REVIEW" | "SCALE";
}

const activePilotsData: DemoPilot[] = [
  {
    id: "PL-01",
    name: "AI Road Damage & Pothole Detection",
    startup: "TechVista Solutions",
    progress: 72,
    status: "PILOT PHASE",
  },
  {
    id: "PL-02",
    name: "Water Quality IoT Sensor Field Test",
    startup: "AquaSense Tech",
    progress: 88,
    status: "IN REVIEW",
  },
  {
    id: "PL-03",
    name: "Smart Streetlight Energy Optimization",
    startup: "LumiGrid Innovations",
    progress: 95,
    status: "SCALE",
  },
];

export default function GovDashboard() {
  const navigate = useNavigate();

  // Active Challenges Table Columns
  const challengeColumns: TableColumn<DemoChallenge>[] = [
    {
      key: "title",
      header: "Challenge",
      render: (row) => (
        <div>
          <span
            onClick={() => navigate(`/gov/challenges/${row.id}`)}
            className="font-bold text-slate-900 text-xs hover:text-blue-700 cursor-pointer"
          >
            {row.title}
          </span>
          <span className="block text-[11px] text-slate-500 font-medium">
            {row.department}
          </span>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      width: "140px",
      render: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: "proposalsCount",
      header: "Proposals",
      width: "100px",
      align: "center",
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
          {row.proposalsCount}
        </span>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      width: "150px",
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">{row.deadline}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      width: "90px",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/gov/challenges/${row.id}`)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  // Active Pilots Table Columns
  const pilotColumns: TableColumn<DemoPilot>[] = [
    {
      key: "name",
      header: "Pilot Project",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">{row.name}</span>
          <span className="block text-[11px] text-slate-500 font-medium">{row.startup}</span>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      width: "160px",
      render: (row) => (
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1">
            <span>Progress</span>
            <span className="text-blue-900">{row.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "130px",
      align: "right",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Dashboard Operational Header */}
      <PageHeader
        title="Dashboard"
        description={`You have ${govDemoPendingActions.length} actions requiring attention.`}
      />

      {/* Overview Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Target className="w-4 h-4 text-blue-700" />}
          label="Active Challenges"
          value="23"
          accentColor="blue"
        />
        <StatCard
          icon={<FileText className="w-4 h-4 text-purple-700" />}
          label="Proposals Review"
          value="14"
          accentColor="purple"
        />
        <StatCard
          icon={<FlaskConical className="w-4 h-4 text-indigo-700" />}
          label="Active Pilots"
          value="7"
          accentColor="indigo"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-amber-700" />}
          label="Pending Decisions"
          value="3"
          accentColor="amber"
        />
        <StatCard
          icon={<Award className="w-4 h-4 text-emerald-700" />}
          label="Scaled Solutions"
          value="4"
          accentColor="emerald"
        />
      </div>

      {/* Main Two-Column Layout: Actions Required (Top/Right) & Active Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Challenges & Active Pilots */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Challenges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Active Challenges</h2>
              <a href="#challenges" onClick={(e) => e.preventDefault()} className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-0.5">
                View all (23) <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <Table
              columns={challengeColumns}
              data={govDemoChallenges}
              keyExtractor={(item) => item.id}
            />
          </div>

          {/* Active Pilots Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Active Pilots</h2>
              <a href="#pilots" onClick={(e) => e.preventDefault()} className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-0.5">
                View all (7) <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <Table
              columns={pilotColumns}
              data={activePilotsData}
              keyExtractor={(item) => item.id}
            />
          </div>
        </div>

        {/* Right Column (1 Col): Actions Required */}
        <div className="space-y-6">
          <PendingActions actions={govDemoPendingActions} />
        </div>
      </div>

      {/* Operational Recommendations */}
      <AIIntelligencePanel insights={govDemoAIInsights} />

      {/* Recent Activity Log */}
      <ActivityTimeline activities={govDemoActivities} />
    </div>
  );
}
