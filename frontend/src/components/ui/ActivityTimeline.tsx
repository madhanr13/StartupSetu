/**
 * ActivityTimeline — Audit-Compliant Activity Feed Component.
 *
 * Displays clean timeline events with official timestamps, icons, and categories.
 */

import { FileText, CheckCircle, Clock, FlaskConical, AlertCircle, Building2 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ActivityItem {
  id: string;
  timestamp: string;
  title: string;
  actor: string;
  category: "proposal" | "evaluation" | "pilot" | "procurement" | "challenge";
  details?: string;
}

interface ActivityTimelineProps {
  activities?: ActivityItem[];
}

const defaultActivities: ActivityItem[] = [
  {
    id: "act-1",
    timestamp: "Today, 14:30",
    title: "Proposal Submitted",
    actor: "TechVista Solutions",
    category: "proposal",
    details: "Proposal submitted for Traffic Signal Optimization Challenge (#P-048).",
  },
  {
    id: "act-2",
    timestamp: "Today, 11:15",
    title: "Technical Evaluation Completed",
    actor: "Dr. Anand Mehta (Evaluator)",
    category: "evaluation",
    details: "Scored 92/100 for Road Damage Detection Proposal #P-041.",
  },
  {
    id: "act-3",
    timestamp: "Yesterday, 16:45",
    title: "Pilot Telemetry Milestone Met",
    actor: "Water Quality Monitoring",
    category: "pilot",
    details: "Sensor SLA accuracy verified at 99.2% over 30 consecutive days.",
  },
  {
    id: "act-4",
    timestamp: "03 Sep 2026",
    title: "Procurement Approval Recommended",
    actor: "Ministry Audit Committee",
    category: "procurement",
    details: "Approved commercial scale deployment for Smart Lighting Pilot.",
  },
];

export default function ActivityTimeline({ activities = defaultActivities }: ActivityTimelineProps) {
  return (
    <div className="gov-card">
      <div className="gov-card-header">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">Procurement Activity Log</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">Real-time Telemetry</span>
      </div>

      <div className="gov-card-body p-4">
        <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-4">
          {activities.map((act) => {
            let icon = <FileText className="w-3.5 h-3.5 text-blue-600" />;
            let badgeBg = "bg-blue-100 text-blue-800";

            if (act.category === "evaluation") {
              icon = <CheckCircle className="w-3.5 h-3.5 text-purple-600" />;
              badgeBg = "bg-purple-100 text-purple-800";
            } else if (act.category === "pilot") {
              icon = <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />;
              badgeBg = "bg-indigo-100 text-indigo-800";
            } else if (act.category === "procurement") {
              icon = <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
              badgeBg = "bg-emerald-100 text-emerald-800";
            } else if (act.category === "challenge") {
              icon = <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
              badgeBg = "bg-amber-100 text-amber-800";
            }

            return (
              <div key={act.id} className="relative group">
                <span className="absolute -left-[27px] top-1 p-1 rounded-full bg-white border border-slate-300 group-hover:border-blue-500 transition-colors">
                  {icon}
                </span>

                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-900">{act.title}</span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{act.timestamp}</span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-slate-700">{act.actor}</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider", badgeBg)}>
                    {act.category}
                  </span>
                </div>

                {act.details && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    {act.details}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
