/**
 * StatusBadge — Procurement Lifecycle Status Badge.
 *
 * Accessible status indication with icons + text + subtle tinted background + border.
 * Supports exact procurement statuses:
 * - SCALE (Green)
 * - EXTEND (Amber)
 * - REJECT (Red)
 * - IN REVIEW (Blue)
 * - DRAFT (Gray)
 * - PILOT PHASE (Indigo)
 * - PUBLISHED (Sky)
 * - ACCEPTING PROPOSALS (Emerald)
 */

import { cn } from "@/utils/cn";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileEdit,
  FlaskConical,
  Globe,
  Award,
} from "lucide-react";

export type ProcurementStatus =
  | "SCALE"
  | "EXTEND"
  | "REJECT"
  | "IN REVIEW"
  | "DRAFT"
  | "PILOT PHASE"
  | "PUBLISHED"
  | "ACCEPTING PROPOSALS";

interface StatusBadgeProps {
  status: ProcurementStatus | string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; bgClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SCALE: { label: "Scale Approved", bgClass: "status-scale", icon: Award },
  EXTEND: { label: "Extend Request", bgClass: "status-extend", icon: AlertTriangle },
  REJECT: { label: "Rejected / Closed", bgClass: "status-reject", icon: XCircle },
  "IN REVIEW": { label: "In Review", bgClass: "status-in-review", icon: Clock },
  DRAFT: { label: "Draft", bgClass: "status-draft", icon: FileEdit },
  "PILOT PHASE": { label: "Pilot Phase", bgClass: "status-pilot-phase", icon: FlaskConical },
  PUBLISHED: { label: "Published", bgClass: "status-published", icon: Globe },
  "ACCEPTING PROPOSALS": {
    label: "Accepting Proposals",
    bgClass: "status-accepting-proposals",
    icon: CheckCircle2,
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedKey = status.toUpperCase();
  const config = statusConfig[normalizedKey] || {
    label: status,
    bgClass: "status-draft",
    icon: Clock,
  };

  const IconComponent = config.icon;

  return (
    <span className={cn("gov-badge", config.bgClass, className)}>
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
