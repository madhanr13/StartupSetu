/**
 * PendingActions — Action Required Component for Officers.
 *
 * Displays prioritized tasks demanding government officer decision or approval.
 */

import { AlertOctagon, ArrowUpRight, CheckSquare, Clock } from "lucide-react";
import { cn } from "@/utils/cn";

export interface PendingActionItem {
  id: string;
  title: string;
  context: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  deadline: string;
  actionType: string;
}

interface PendingActionsProps {
  actions?: PendingActionItem[];
}

const defaultPendingActions: PendingActionItem[] = [
  {
    id: "pa-1",
    title: "Review Shortlisted Proposals",
    context: "AI-Based Road Damage Detection (5 proposals ready)",
    urgency: "HIGH",
    deadline: "Expires in 2 days",
    actionType: "Review Proposals",
  },
  {
    id: "pa-2",
    title: "Approve Pilot Extension",
    context: "Water Quality Monitoring (Requesting +30 days stage 2)",
    urgency: "HIGH",
    deadline: "Action Required",
    actionType: "Approve / Reject",
  },
  {
    id: "pa-3",
    title: "Procurement Decision Required",
    context: "Digital Health Records Integration (Pilot validation complete)",
    urgency: "HIGH",
    deadline: "Immediate",
    actionType: "Issue RFP / PO",
  },
  {
    id: "pa-4",
    title: "Assign Technical Evaluators",
    context: "Land Records Challenge (Needs 3 committee members)",
    urgency: "MEDIUM",
    deadline: "Within 5 days",
    actionType: "Assign Evaluators",
  },
];

export default function PendingActions({ actions = defaultPendingActions }: PendingActionsProps) {
  return (
    <div className="gov-card">
      <div className="gov-card-header">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Officer Actions Required</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
          {actions.length} Pending
        </span>
      </div>

      <div className="gov-card-body p-3 space-y-2.5">
        {actions.map((act) => {
          let urgencyBadge = "bg-amber-100 text-amber-900 border-amber-200";
          if (act.urgency === "HIGH") {
            urgencyBadge = "bg-rose-100 text-rose-900 border-rose-200";
          } else if (act.urgency === "LOW") {
            urgencyBadge = "bg-slate-100 text-slate-800 border-slate-200";
          }

          return (
            <div
              key={act.id}
              className="p-3 bg-white rounded-md border border-slate-200 hover:border-blue-400 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {act.context}
                  </p>
                </div>
                <span className={cn("text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider", urgencyBadge)}>
                  {act.urgency}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {act.deadline}
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors"
                >
                  <CheckSquare className="w-3 h-3 text-blue-700" />
                  <span>{act.actionType}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
