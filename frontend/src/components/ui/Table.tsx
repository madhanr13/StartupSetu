/**
 * Table — Institutional Structured Data Table Component.
 *
 * Professional table design with clear column headers, subtle row dividers,
 * status badge integration, hover states, and pagination support.
 */

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  className?: string;
  footer?: ReactNode;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyText = "No data available",
  className,
  footer,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="gov-card p-8 text-center text-slate-500 text-xs font-medium">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn("gov-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors text-xs text-slate-800",
                  onRowClick && "cursor-pointer hover:bg-slate-50/80"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 align-middle font-medium",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
