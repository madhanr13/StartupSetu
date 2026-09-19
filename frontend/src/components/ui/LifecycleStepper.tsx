/**
 * LifecycleStepper — Procurement Lifecycle Progress Stepper Component.
 *
 * Visually communicates the 7 stages of the Public Innovation Procurement Mechanism:
 * PROBLEM / CHALLENGES → MATCHING → EVALUATION → PILOT → MEASURE / VALIDATE → SCALE
 */

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface LifecycleStage {
  id: string;
  name: string;
  count?: number;
  status: "completed" | "current" | "upcoming";
}

interface LifecycleStepperProps {
  currentStageId?: string;
  stages?: LifecycleStage[];
  compact?: boolean;
}

const defaultStages: LifecycleStage[] = [
  { id: "challenges", name: "1. Challenges", count: 23, status: "completed" },
  { id: "matching", name: "2. Startup Matching", count: 18, status: "completed" },
  { id: "evaluation", name: "3. Evaluation", count: 14, status: "completed" },
  { id: "pilot", name: "4. Pilot Phase", count: 7, status: "current" },
  { id: "validation", name: "5. Validation", count: 5, status: "upcoming" },
  { id: "procurement", name: "6. Procurement", count: 3, status: "upcoming" },
  { id: "scale", name: "7. National Scale", count: 4, status: "upcoming" },
];

export default function LifecycleStepper({
  currentStageId = "pilot",
  stages = defaultStages,
  compact = false,
}: LifecycleStepperProps) {
  return (
    <div className="gov-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-700"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            StartupSetu Innovation Lifecycle
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Stage 4 of 7 Active: <strong className="text-blue-900 font-semibold">Pilot Phase</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((stage) => {
          const isCurrent = stage.id === currentStageId || stage.status === "current";
          const isCompleted = stage.status === "completed";

          return (
            <div
              key={stage.id}
              className={cn(
                "relative flex flex-col p-2.5 rounded-md border text-left transition-all",
                isCurrent
                  ? "bg-blue-50/80 border-blue-600 shadow-xs"
                  : isCompleted
                  ? "bg-slate-50/90 border-slate-200"
                  : "bg-white border-slate-200/80 opacity-75"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300" />
                )}
                {stage.count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {stage.count}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "text-xs font-semibold truncate",
                  isCurrent
                    ? "text-blue-950 font-bold"
                    : isCompleted
                    ? "text-slate-800"
                    : "text-slate-500"
                )}
              >
                {stage.name}
              </span>

              {!compact && (
                <span className="text-[10px] text-slate-500 mt-0.5 capitalize">
                  {isCurrent ? "Active Execution" : isCompleted ? "Verified" : "Pending"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
