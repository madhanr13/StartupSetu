/**
 * Breadcrumb — auto-generated from current route path.
 * Clickable segments for navigation context.
 */

import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/** Map of path segments to human-readable labels. */
const segmentLabels: Record<string, string> = {
  gov: "Government",
  startup: "Startup",
  evaluator: "Evaluator",
  admin: "Admin",
  challenges: "Challenges",
  "startup-discovery": "Startup Discovery",
  proposals: "Proposals",
  pilots: "Pilots",
  "kpi-analytics": "KPI Analytics",
  procurement: "Procurement",
  "innovation-memory": "Innovation Memory",
  reports: "Reports",
  "audit-logs": "Audit Logs",
  settings: "Settings",
  profile: "My Profile",
  feedback: "Feedback",
  notifications: "Notifications",
  evaluations: "Evaluations",
  validation: "Validation",
  users: "Users",
  departments: "Departments",
  startups: "Startups",
  "system-settings": "System Settings",
};

function formatSegment(segment: string): string {
  return segmentLabels[segment] || segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-neutral-500"
    >
      <Link
        to="/"
        className="p-0.5 hover:text-neutral-700 transition-colors"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-neutral-300" />
            {isLast ? (
              <span className="font-medium text-neutral-700">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                to={path}
                className="hover:text-neutral-700 transition-colors"
              >
                {formatSegment(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
