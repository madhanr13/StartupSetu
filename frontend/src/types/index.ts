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

export interface Startup {
  id: string;
  name: string;
  logo?: string;
  description: string;
  domain: string[];
  technologies: string[];
  founded: string;
  teamSize: number;
  dpiitRecognized: boolean;
  website?: string;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
}

export interface MatchBreakdown {
  technologyFit: number;
  domainFit: number;
  previousProjects: number;
  teamCapability: number;
  scalability: number;
  securityReadiness: number;
  budgetCompatibility: number;
  explanation: string;
}

// ── Proposal ────────────────────────────────────────────────────────────────

export type ProposalStatus =
  | "SUBMITTED"
  | "SCREENING"
  | "AI_ANALYSIS"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "SELECTED"
  | "REJECTED";

export interface Proposal {
  id: string;
  challengeId: string;
  challengeTitle: string;
  startupId: string;
  startupName: string;
  status: ProposalStatus;
  submittedAt: string;
  aiScore?: number;
  humanScore?: number;
  finalScore?: number;
  documentUrl?: string;
}

// ── Pilot ───────────────────────────────────────────────────────────────────

export type PilotStatus =
  | "SETUP"
  | "IN_PROGRESS"
  | "MONITORING"
  | "VALIDATION"
  | "COMPLETED"
  | "TERMINATED";

export interface Pilot {
  id: string;
  challengeId: string;
  challengeTitle: string;
  startupId: string;
  startupName: string;
  status: PilotStatus;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  kpis: KPIResult[];
}

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

export type ProcurementDecision = "SCALE" | "EXTEND_PILOT" | "REJECT";

export interface ProcurementRecord {
  id: string;
  pilotId: string;
  challengeTitle: string;
  startupName: string;
  aiRecommendation: ProcurementDecision;
  aiConfidence: number;
  aiExplanation: string;
  humanDecision?: ProcurementDecision;
  decidedBy?: string;
  decidedAt?: string;
  notes?: string;
}

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
