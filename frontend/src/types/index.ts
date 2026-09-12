/**
 * Core TypeScript types for Startup Procurement.
 *
 * Defines domain models shared across all frontend components.
 */

// ── User Roles ──────────────────────────────────────────────────────────────

export type UserRole =
  | "GOVERNMENT_OFFICER"
  | "STARTUP"
  | "EVALUATOR"
  | "ADMIN"
  | "AUDITOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  department_name?: string;
  avatar?: string;
}

// ── Challenge ───────────────────────────────────────────────────────────────

export * from "./challenge";


// ── Startup ─────────────────────────────────────────────────────────────────

export * from "./startup";

// ── Proposal ────────────────────────────────────────────────────────────────

export * from "./proposal";

// ── Pilot ───────────────────────────────────────────────────────────────────

export * from "./pilot";
export * from "./procurement";

// ── KPIs ────────────────────────────────────────────────────────────────────

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  unit: string;
  weight: number; // importance weight, 0-1
}

export interface KPIResult {
  kpiId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "on_track" | "at_risk" | "off_track";
}

// ── Procurement Decision ────────────────────────────────────────────────────
// (ProcurementDecision, DecisionType, etc. are defined in ./procurement.ts
//  and re-exported via `export * from "./procurement"` below)


// ── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

// ── Evaluation ──────────────────────────────────────────────────────────────

export interface Evaluation {
  id: string;
  proposalId: string;
  evaluatorId: string;
  challengeTitle: string;
  startupName: string;
  scores: EvaluationScore[];
  totalScore: number;
  comments: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  assignedAt: string;
  completedAt?: string;
}

export interface EvaluationScore {
  criterion: string;
  weight: number;
  score: number; // 0-10
  justification: string;
}

// ── Notification ────────────────────────────────────────────────────────────

export type NotificationType = "info" | "success" | "warning" | "action";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ── Stats ───────────────────────────────────────────────────────────────────

export interface StatItem {
  label: string;
  value: string | number;
  change?: number; // percentage change
  changeLabel?: string;
  icon?: string;
}

// ── Auth State ──────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export * from "./analytics";
