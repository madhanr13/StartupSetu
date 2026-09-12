/**
 * TypeScript definitions for Pilot Management, Milestones, KPIs, Risks, Issues, and Evidence.
 */

export type PilotStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'READY_FOR_ASSESSMENT'
  | 'SCALED'
  | 'EXTENDED'
  | 'CLOSED'
  | 'CANCELLED';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type KPIStatus = 'PENDING_MEASUREMENT' | 'ACHIEVED' | 'BELOW_TARGET';

export type TargetOperator = '>=' | '<=' | '=' | '>' | '<';

export type RiskCategory = 'TECHNICAL' | 'OPERATIONAL' | 'SECURITY' | 'FINANCIAL' | 'SCHEDULE' | 'COMPLIANCE';

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface KPIMeasurement {
  id: string;
  pilot_kpi_id: string;
  measurement_date: string;
  actual_value: number;
  notes?: string;
  recorded_by_id: string;
  recorded_by_name: string;
  created_at: string;
}

export interface TargetChangeHistoryItem {
  previous_target: number;
  new_target: number;
  reason: string;
  modified_by_id: string;
  modified_by_name: string;
  timestamp: string;
}

export interface PilotKPI {
  id: string;
  pilot_id: string;
  name: string;
  description: string;
  target_value: number;
  target_operator: TargetOperator;
  unit: string;
  measurement_method: string;
  frequency: string;
  weight: number;
  status: KPIStatus;
  target_change_history?: TargetChangeHistoryItem[];
  latest_actual_value?: number;
  latest_measurement_date?: string;
  measurements?: KPIMeasurement[];
  created_at: string;
  updated_at: string;
}

export interface PilotMilestone {
  id: string;
  pilot_id: string;
  name: string;
  description: string;
  planned_start: string;
  planned_end: string;
  status: MilestoneStatus;
  completion_percentage: number;
  blocked_reason?: string;
  completed_at?: string;
}

export interface PilotRisk {
  id: string;
  pilot_id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  probability: string;
  mitigation: string;
  owner_name: string;
  status: RiskStatus;
  created_at: string;
}

export interface PilotIssue {
  id: string;
  pilot_id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  reported_date: string;
  assigned_to_name: string;
  status: IssueStatus;
  resolution?: string;
}

export interface PilotEvidence {
  id: string;
  pilot_id: string;
  file_name: string;
  storage_key: string;
  file_type: string;
  file_size: number;
  description: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface PilotHealthSummary {
  health_label: 'ON_TRACK' | 'NEEDS_ATTENTION' | 'AT_RISK';
  kpis_total: number;
  kpis_achieved: number;
  kpis_below_target: number;
  kpis_pending: number;
  milestones_total: number;
  milestones_completed: number;
  milestones_blocked: number;
  risks_critical_open: number;
  risks_high_open: number;
  issues_unresolved: number;
  rules_applied: string[];
}

export interface Pilot {
  id: string;
  proposal_id: string;
  challenge_id: string;
  startup_id: string;
  name: string;
  objective: string;
  scope: string;
  success_criteria: string;
  government_owner_id: string;
  government_team_notes?: string;
  startup_team_notes?: string;
  evaluator_notes?: string;
  data_access_notes?: string;
  security_requirements?: string;
  ip_notes?: string;
  start_date: string;
  end_date: string;
  status: PilotStatus;
  overall_progress_percentage: number;
  completed_at?: string;
  ready_for_assessment_at?: string;
  created_at: string;
  updated_at: string;

  challenge?: {
    id: string;
    title: string;
    department_id: string;
    department_name?: string;
  };
  startup?: {
    id: string;
    company_name: string;
    dpiit_number: string;
    contact_email?: string;
  };
  government_owner?: {
    id: string;
    name: string;
    email: string;
  };
  health?: PilotHealthSummary;

  milestones: PilotMilestone[];
  kpis: PilotKPI[];
  risks: PilotRisk[];
  issues: PilotIssue[];
  evidence_files: PilotEvidence[];
}

export interface PilotCreateInput {
  proposal_id: string;
  name: string;
  objective: string;
  scope: string;
  success_criteria?: string;
  start_date: string;
  end_date: string;
  government_owner_id?: string;
  government_team_notes?: string;
  startup_team_notes?: string;
  evaluator_notes?: string;
  data_access_notes?: string;
  security_requirements?: string;
  ip_notes?: string;
  initial_milestones?: {
    name: string;
    description?: string;
    planned_start: string;
    planned_end: string;
  }[];
  initial_kpis?: {
    name: string;
    description?: string;
    target_value: number;
    target_operator?: TargetOperator;
    unit?: string;
    measurement_method?: string;
    frequency?: string;
    weight?: number;
  }[];
}
