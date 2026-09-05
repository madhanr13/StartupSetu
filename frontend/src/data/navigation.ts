/**
 * Navigation Configuration for Startup Procurement.
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
      { label: "Dashboard", path: "/gov/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "PROCUREMENT",
    items: [
      { label: "Challenges", path: "/challenges", iconName: "Target", badge: "23" },
      { label: "Startup Discovery", path: "/discovery", iconName: "Search" },
      { label: "Proposals", path: "/proposals", iconName: "FileText", badge: "14" },
      { label: "Pilots", path: "/pilots", iconName: "FlaskConical", badge: "7" },
      { label: "Procurement", path: "/procurement", iconName: "ShoppingCart" },
    ],
  },
  {
    groupName: "INTELLIGENCE",
    items: [
      { label: "KPI Analytics", path: "/kpi-analytics", iconName: "BarChart3" },
      { label: "Innovation Memory", path: "/innovation-memory", iconName: "Brain" },
    ],
  },
  {
    groupName: "GOVERNANCE",
    items: [
      { label: "Reports", path: "/reports", iconName: "FileBarChart" },
      { label: "Audit Logs", path: "/audit-logs", iconName: "Shield" },
      { label: "Settings", path: "/settings", iconName: "Settings" },
    ],
  },
];

export const startupNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/startup/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "PROCUREMENT",
    items: [
      { label: "Active Challenges", path: "/challenges", iconName: "Target", badge: "New" },
      { label: "My Applications", path: "/applications", iconName: "FileText" },
      { label: "Active Pilots", path: "/pilots", iconName: "FlaskConical" },
      { label: "Procurement Orders", path: "/procurement", iconName: "ShoppingCart" },
    ],
  },
  {
    groupName: "INTELLIGENCE",
    items: [
      { label: "Performance KPIs", path: "/kpi-analytics", iconName: "BarChart3" },
    ],
  },
  {
    groupName: "ACCOUNT",
    items: [
      { label: "Startup Profile", path: "/profile", iconName: "Building" },
      { label: "Settings", path: "/settings", iconName: "Settings" },
    ],
  },
];

export const evaluatorNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/evaluator/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "EVALUATION WORKFLOW",
    items: [
      { label: "Assigned Proposals", path: "/proposals", iconName: "FileText", badge: "5" },
      { label: "Pilot Evaluations", path: "/pilots", iconName: "FlaskConical" },
      { label: "Scoring Rubrics", path: "/rubrics", iconName: "ClipboardCheck" },
    ],
  },
  {
    groupName: "INTELLIGENCE",
    items: [
      { label: "Innovation Repository", path: "/innovation-memory", iconName: "Brain" },
    ],
  },
];

export const adminNavGroups: NavGroup[] = [
  {
    groupName: "OVERVIEW",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    groupName: "PLATFORM GOVERNANCE",
    items: [
      { label: "User Management", path: "/users", iconName: "Users" },
      { label: "Departments", path: "/departments", iconName: "Building2" },
      { label: "All Challenges", path: "/challenges", iconName: "Target" },
      { label: "All Pilots", path: "/pilots", iconName: "FlaskConical" },
    ],
  },
  {
    groupName: "AUDIT & SECURITY",
    items: [
      { label: "Audit Logs", path: "/audit-logs", iconName: "Shield" },
      { label: "System Settings", path: "/settings", iconName: "Settings" },
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
