/**
 * Navigation Configuration for StartupSetu.
 */

import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const govNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/gov", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "PROCUREMENT",
    items: [
      { label: "Challenges", path: "/gov/challenges", iconName: "Target" },
      { label: "Startup Discovery", path: "/gov/startup-discovery", iconName: "Search" },
      { label: "Proposals", path: "/gov/proposals", iconName: "FileText" },
      { label: "Pilots", path: "/gov/pilots", iconName: "FlaskConical" },
      { label: "Procurement", path: "/gov/procurement", iconName: "ShoppingCart" },
    ],
  },
  {
    groupName: "INTELLIGENCE",
    items: [
      { label: "KPI Analytics", path: "/gov/kpi-analytics", iconName: "BarChart3" },
      { label: "What-If Simulator", path: "/gov/simulation", iconName: "Sliders" },
      { label: "Innovation Memory", path: "/gov/innovation-memory", iconName: "Brain" },
    ],
  },
  {
    groupName: "GOVERNANCE",
    items: [
      { label: "Reports", path: "/gov/reports", iconName: "FileBarChart" },
      { label: "Audit Logs", path: "/gov/audit-logs", iconName: "Shield" },
      { label: "Settings", path: "/gov/settings", iconName: "Settings" },
    ],
  },
];

export const startupNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/startup", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "PROCUREMENT",
    items: [
      { label: "Active Challenges", path: "/startup/challenges", iconName: "Target" },
      { label: "My Proposals", path: "/startup/proposals", iconName: "FileText" },
      { label: "Active Pilots", path: "/startup/pilots", iconName: "FlaskConical" },
    ],
  },
  {
    groupName: "ACCOUNT",
    items: [
      { label: "Startup Profile", path: "/startup/profile", iconName: "Building" },
      { label: "Notifications", path: "/startup/notifications", iconName: "Settings" },
    ],
  },
];

export const evaluatorNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/evaluator", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "EVALUATION WORKFLOW",
    items: [
      { label: "Assigned Evaluations", path: "/evaluator/evaluations", iconName: "FileText" },
      { label: "Pilots", path: "/evaluator/pilots", iconName: "FlaskConical" },
      { label: "Validation", path: "/evaluator/validation", iconName: "ClipboardCheck" },
    ],
  },
];

export const adminNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/admin", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "PLATFORM GOVERNANCE",
    items: [
      { label: "User Management", path: "/admin/users", iconName: "Users" },
      { label: "Departments", path: "/admin/departments", iconName: "Building2" },
      { label: "Startups", path: "/admin/startups", iconName: "Building" },
      { label: "All Challenges", path: "/admin/challenges", iconName: "Target" },
      { label: "What-If Simulator", path: "/admin/simulation", iconName: "Sliders" },
    ],
  },
  {
    groupName: "AUDIT & SECURITY",
    items: [
      { label: "Audit Logs", path: "/admin/audit-logs", iconName: "Shield" },
      { label: "Reports", path: "/admin/reports", iconName: "FileBarChart" },
      { label: "System Settings", path: "/admin/system-settings", iconName: "Settings" },
    ],
  },
];

export const navigationConfig: Record<UserRole, NavGroup[]> = {
  GOVERNMENT_OFFICER: govNavGroups,
  STARTUP: startupNavGroups,
  EVALUATOR: evaluatorNavGroups,
  ADMIN: adminNavGroups,
  AUDITOR: adminNavGroups,
};

export const roleLabels: Record<UserRole, string> = {
  GOVERNMENT_OFFICER: "Government Officer",
  STARTUP: "Startup Founder",
  EVALUATOR: "Technical Evaluator",
  ADMIN: "Platform Admin",
  AUDITOR: "Public Auditor",
};

export const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
  GOVERNMENT_OFFICER: { bg: "bg-blue-50", text: "text-blue-900", border: "border-blue-200" },
  STARTUP: { bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-200" },
  EVALUATOR: { bg: "bg-purple-50", text: "text-purple-900", border: "border-purple-200" },
  ADMIN: { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200" },
  AUDITOR: { bg: "bg-slate-100", text: "text-slate-900", border: "border-slate-300" },
};

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case "GOVERNMENT_OFFICER":
      return "/gov/dashboard";
    case "STARTUP":
      return "/startup/dashboard";
    case "EVALUATOR":
      return "/evaluator/dashboard";
    case "ADMIN":
    case "AUDITOR":
      return "/admin/dashboard";
  }
}
