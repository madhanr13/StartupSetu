/**
 * Synthetic / Demo Data for Startup Procurement.
 */

import type { AIInsightItem } from "@/components/ui/AIIntelligencePanel";
import type { PendingActionItem } from "@/components/ui/PendingActions";
import type { ActivityItem } from "@/components/ui/ActivityTimeline";

export interface DemoChallenge {
  id: string;
  title: string;
  department: string;
  stage: "PILOT PHASE" | "EVALUATION" | "MATCHING" | "ACCEPTING PROPOSALS" | "PUBLISHED";
  proposalsCount: number;
  workflowProgress: number; // percentage e.g. 72%
  deadline: string;
}

export const govDemoChallenges: DemoChallenge[] = [
  {
    id: "ch-road-01",
    title: "AI-Based Road Damage & Pothole Detection",
    department: "Ministry of Housing & Urban Affairs",
    stage: "ACCEPTING PROPOSALS",
    proposalsCount: 14,
    workflowProgress: 72,
    deadline: "Closing in 30 days",
  },
  {
    id: "ch-water-01",
    title: "Real-Time Water Quality IoT Monitoring",
    department: "Ministry of Housing & Urban Affairs",
    stage: "PILOT PHASE",
    proposalsCount: 8,
    workflowProgress: 88,
    deadline: "Validation due in 5 days",
  },
  {
    id: "ch-health-01",
    title: "Automated OPD Queue Management for AIIMS",
    department: "Ministry of Health & Family Welfare",
    stage: "MATCHING",
    proposalsCount: 9,
    workflowProgress: 30,
    deadline: "Shortlisting in 4 days",
  },
  {
    id: "ch-land-01",
    title: "Blockchain Land Records Fraud Detection",
    department: "Ministry of Electronics & IT",
    stage: "EVALUATION",
    proposalsCount: 4,
    workflowProgress: 55,
    deadline: "Evaluation ends Friday",
  },
];

export const govDemoPendingActions: PendingActionItem[] = [
  {
    id: "pa-1",
    title: "Review Shortlisted Proposals",
    context: "AI Road Damage Detection (6 candidate startups)",
    urgency: "HIGH",
    deadline: "Action needed today",
    actionType: "Review Proposals",
  },
  {
    id: "pa-2",
    title: "Approve Stage-2 Pilot Extension",
    context: "Water Quality IoT Monitoring (+30 days field test)",
    urgency: "HIGH",
    deadline: "Urgent decision required",
    actionType: "Approve Extension",
  },
  {
    id: "pa-3",
    title: "Commercial Procurement Decision Required",
    context: "Digital Health Records Integration (Pilot validation complete)",
    urgency: "HIGH",
    deadline: "Immediate",
    actionType: "Issue Scale RFP",
  },
  {
    id: "pa-4",
    title: "Assign Technical Evaluators",
    context: "Land Records Fraud Detection (Requires 3 experts)",
    urgency: "MEDIUM",
    deadline: "Within 3 days",
    actionType: "Assign Evaluators",
  },
];

export const govDemoAIInsights: AIInsightItem[] = [
  {
    id: "insight-1",
    type: "high_match",
    title: "3 High-Match Startups Identified",
    description: "DeepTech AI engine matched 3 DPIIT-recognized startups with >88% technical capability match for the 'AI Road Damage Challenge'.",
    metric: "88% Match",
    actionText: "View Matched Startups",
  },
  {
    id: "insight-2",
    type: "validation_ready",
    title: "2 Pilots Ready for Scale Validation",
    description: "Water Quality Monitoring Pilot achieved 94% KPI target compliance over 60 test days.",
    metric: "94% Target Compliance",
    actionText: "Validate for Procurement",
  },
  {
    id: "insight-3",
    type: "coverage_risk",
    title: "1 Challenge Has Low Startup Coverage",
    description: "Land Records Digitization has only 2 submitted proposals. Targeted broadcast recommended.",
    metric: "Action Recommended",
    actionText: "Broadcast to Incubators",
  },
  {
    id: "insight-4",
    type: "kpi_risk",
    title: "1 Pilot Flagged for Hardware SLA Risk",
    description: "Smart Streetlight IoT sensor battery life telemetry is 12% below contract specifications.",
    metric: "12% Telemetry Variance",
    actionText: "Inspect Telemetry Log",
  },
];

export const govDemoActivities: ActivityItem[] = [
  {
    id: "act-1",
    timestamp: "Today, 14:30",
    title: "Proposal Submitted",
    actor: "TechVista Solutions",
    category: "proposal",
    details: "Submitted technical architecture proposal for Traffic Signal Optimization (#P-048).",
  },
  {
    id: "act-2",
    timestamp: "Today, 11:15",
    title: "Technical Evaluation Score Posted",
    actor: "Dr. Anand Mehta (Evaluator)",
    category: "evaluation",
    details: "Scored 92/100 for Road Damage Detection Proposal #P-041.",
  },
  {
    id: "act-3",
    timestamp: "Yesterday, 16:45",
    title: "Pilot Telemetry Milestone Met",
    actor: "Water Quality Monitoring",
    category: "pilot",
    details: "Sensor SLA accuracy verified at 99.2% over 30 consecutive days in Ward 7.",
  },
  {
    id: "act-4",
    timestamp: "03 Sep 2026",
    title: "Procurement Committee Approval",
    actor: "Ministry Audit Committee",
    category: "procurement",
    details: "Approved commercial scale deployment for Smart Lighting Pilot across 3 districts.",
  },
];

// ── Legacy Dashboard Exports ───────────────────────────────────────────────

export const govDashboardStats = [
  { label: "Active Challenges", value: 23, change: 12, changeLabel: "vs last month" },
  { label: "Proposals Awaiting Review", value: 14, change: -3, changeLabel: "vs last week" },
  { label: "Active Pilots", value: 7, change: 8, changeLabel: "vs last month" },
  { label: "Ready for Decision", value: 3, change: 0, changeLabel: "immediate" },
  { label: "Solutions Scaled", value: 4, change: 25, changeLabel: "nationwide" },
];

export const startupDashboardStats = [
  { label: "Applications", value: 3, change: 1 },
  { label: "Active Proposals", value: 2, change: 0 },
  { label: "Active Pilots", value: 1, change: 0 },
  { label: "Deadlines", value: 4, change: -2 },
];

export const startupRecentActivity = [
  { id: "1", title: "Proposal Status Update", description: "AI Road Damage Proposal moved to Evaluation Stage", time: "2 hours ago", status: "IN REVIEW" },
  { id: "2", title: "Milestone Telemetry Uploaded", description: "Water Quality IoT Sensor logs synced for Day 30", time: "Yesterday", status: "PILOT PHASE" },
  { id: "3", title: "New Challenge Matched", description: "Smart Streetlight Energy Optimization matched with 91% score", time: "3 days ago", status: "ACCEPTING PROPOSALS" },
];

export const evaluatorDashboardStats = [
  { label: "Assigned Proposals", value: 5, change: 2 },
  { label: "Evaluations Completed", value: 12, change: 5 },
  { label: "Active Pilots Monitored", value: 3, change: 0 },
  { label: "Pending Reviews", value: 2, change: -1 },
];

export const evaluatorAssignments = [
  { id: "1", title: "AI Road Damage Proposal #P-041", startup: "TechVista Solutions", deadline: "Tomorrow", status: "IN REVIEW" },
  { id: "2", title: "Land Records Fraud Detection #P-019", startup: "SecureChain Tech", deadline: "In 3 days", status: "DRAFT" },
  { id: "3", title: "OPD Queue Optimization #P-033", startup: "HealthFlow AI", deadline: "In 5 days", status: "IN REVIEW" },
];

export const adminDashboardStats = [
  { label: "Total Users", value: 148, change: 12 },
  { label: "Departments", value: 8, change: 0 },
  { label: "Active Challenges", value: 23, change: 4 },
  { label: "Pilots Executing", value: 7, change: 1 },
  { label: "Audit Events Today", value: 342, change: 18 },
];

export const adminRecentAuditLogs = [
  { id: "1", timestamp: "14:32:05", actor: "Dr. Rajesh Kumar", role: "GOVERNMENT_OFFICER", action: "STATUS_CHANGE", entity: "Challenge #CH-101", details: "Moved challenge to PILOT PHASE", status: "PUBLISHED" },
  { id: "2", timestamp: "13:15:22", actor: "Priya Sharma", role: "STARTUP", action: "PROPOSAL_SUBMIT", entity: "Proposal #P-048", details: "Submitted technical architecture PDF", status: "ACCEPTING PROPOSALS" },
  { id: "3", timestamp: "11:04:41", actor: "Dr. Anand Mehta", role: "EVALUATOR", action: "SCORE_SUBMIT", entity: "Evaluation #E-089", details: "Submitted score 92/100", status: "IN REVIEW" },
];
