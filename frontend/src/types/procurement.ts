/**
 * Procurement Decision & Scale-Up Type Definitions.
 */

export type DecisionType = 'SCALE' | 'EXTEND' | 'REJECT';

export type ScaleUpStatus =
  | 'READY_FOR_PROCUREMENT'
  | 'PROCUREMENT_IN_PROGRESS'
  | 'SCALED';

export interface PilotAssessment {
  overall_score: number;
  kpi_performance: number;
  milestone_performance: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  recommendation: DecisionType;
  reasons: string[];
  strengths: string[];
  concerns: string[];
  missing_information: string[];
}

export interface ProcurementDecision {
  id: string;
  pilot_id: string;
  challenge_id: string;
  startup_id: string;
  decision: DecisionType;
  ai_recommendation: DecisionType;
  ai_score: number;
  ai_confidence: number;
  justification: string;
  decided_by: string;
  decided_at: string;
  extension_duration?: number | null;
  extension_reason?: string | null;
  rejection_reason?: string | null;
  assessment_snapshot: Record<string, any>;
  created_at: string;
  updated_at: string;
  decided_by_user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ProcurementDecisionInput {
  decision: DecisionType;
  justification: string;
  extension_duration?: number | null;
  extension_reason?: string | null;
  rejection_reason?: string | null;
}

export interface ApprovedKPI {
  name: string;
  target: string;
  achieved: string;
  status: string;
  weight?: number;
}

export interface ProcurementScaleUp {
  id: string;
  pilot_id: string;
  decision_id: string;
  challenge_id: string;
  startup_id: string;
  department_id?: string | null;
  solution_name: string;
  pilot_outcome_summary: string;
  approved_kpis: ApprovedKPI[];
  proposed_scale_scope: string;
  status: ScaleUpStatus;
  budget_allocation?: number | null;
  target_completion_date?: string | null;
  procurement_notes?: string | null;
  created_at: string;
  updated_at: string;
  startup?: {
    id: string;
    company_name: string;
    dpiit_number?: string | null;
    contact_email?: string | null;
  };
  challenge?: {
    id: string;
    title: string;
    department_id?: string | null;
    department_name?: string | null;
  };
}

export interface ProcurementScaleUpUpdateInput {
  status?: ScaleUpStatus;
  budget_allocation?: number | null;
  target_completion_date?: string | null;
  procurement_notes?: string | null;
}
