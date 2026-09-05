/**
 * AIIntelligencePanel / Recommendations — Operational Recommendation Card.
 *
 * Provides actionable recommendations (startup matching, validation readiness, risks)
 * using clean software terminology without hype banners or tech advertisements.
 */

import { ArrowRight, CheckCircle2, AlertTriangle, Info, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

export interface AIInsightItem {
  id: string;
  type: "high_match" | "validation_ready" | "coverage_risk" | "kpi_risk";
  title: string;
  description: string;
  metric?: string;
  actionText: string;
  actionPath?: string;
}

interface AIIntelligencePanelProps {
  insights?: AIInsightItem[];
}

const defaultInsights: AIInsightItem[] = [
  {
    id: "insight-1",
    type: "high_match",
    title: "3 Recommended Startups Identified",
    description: "Matched startups with >88% technical capability for AI Road Damage Challenge.",
    metric: "88% Match",
    actionText: "View Startups",
  },
  {
    id: "insight-2",
    type: "validation_ready",
    title: "2 Pilots Ready for Decision",
    description: "Water Quality Monitoring Pilot achieved 94% target compliance over 60 days.",
    metric: "94% Target",
    actionText: "Review Pilot",
  },
  {
    id: "insight-3",
    type: "coverage_risk",
    title: "1 Challenge Has Low Coverage",
    description: "Land Records Digitization has 2 proposals. Targeted broadcast recommended.",
    metric: "Low Coverage",
    actionText: "Broadcast",
  },
  {
    id: "insight-4",
    type: "kpi_risk",
    title: "1 Pilot Flagged for Variance Risk",
    description: "Smart Streetlight IoT sensor battery life telemetry is 12% below SLA.",
    metric: "12% Variance",
    actionText: "View Log",
  },
];

export default function AIIntelligencePanel({ insights = defaultInsights }: AIIntelligencePanelProps) {
  return (
    <div className="gov-card p-4 border-l-4 border-l-blue-600 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-50 text-blue-800">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Recommendations
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">Automated Insights</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item) => {
          let badgeColor = "bg-blue-100 text-blue-800";
          let icon = <Info className="w-3.5 h-3.5 text-blue-600" />;

          if (item.type === "high_match") {
            badgeColor = "bg-emerald-100 text-emerald-800";
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
          } else if (item.type === "validation_ready") {
            badgeColor = "bg-indigo-100 text-indigo-800";
            icon = <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />;
          } else if (item.type === "coverage_risk" || item.type === "kpi_risk") {
            badgeColor = "bg-amber-100 text-amber-800";
            icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
          }

          return (
            <div
              key={item.id}
              className="p-3 bg-white rounded border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase", badgeColor)}>
                    {icon}
                    {item.type.replace("_", " ")}
                  </span>
                  {item.metric && (
                    <span className="text-[10px] font-bold text-slate-700">{item.metric}</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 transition-colors pt-2 border-t border-slate-100"
              >
                <span>{item.actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
