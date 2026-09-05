/**
 * StatCard — Institutional Metric Card Component.
 *
 * Compact card showing KPI label, primary metric value, optional trend percentage,
 * and a light-accented icon container.
 */

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  accentColor?: "blue" | "emerald" | "amber" | "indigo" | "purple";
  className?: string;
}

const accentMap = {
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  purple: "bg-purple-50 text-purple-800 border-purple-200",
};

export default function StatCard({
  icon,
  label,
  value,
  change,
  changeLabel,
  subtitle,
  accentColor = "blue",
  className,
}: StatCardProps) {
  return (
    <div className={cn("gov-card p-4 flex flex-col justify-between hover:border-slate-300 transition-colors", className)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={cn("p-2 rounded-md border text-sm font-semibold shrink-0", accentMap[accentColor])}>
          {icon}
        </div>
      </div>

      <div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
          {value}
        </div>

        {(change !== undefined || subtitle) && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            {change !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center font-bold px-1.5 py-0.2 rounded text-[10px]",
                  change > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : change < 0
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : change < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                ) : (
                  <Minus className="w-3 h-3 mr-0.5" />
                )}
                {change > 0 ? `+${change}%` : `${change}%`}
              </span>
            )}
            {changeLabel && <span>{changeLabel}</span>}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
