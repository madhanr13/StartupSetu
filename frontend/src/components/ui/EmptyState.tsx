/**
 * EmptyState — displayed when a section has no data.
 * Icon + title + description + optional action.
 */

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="p-4 rounded-full bg-neutral-100 text-neutral-400 mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-medium text-neutral-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
