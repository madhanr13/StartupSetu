/**
 * Proposal Management, AI Fact Extraction, Document & Evaluation Types.
 */

export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'AI_ANALYSIS_READY'
  | 'EVALUATION_IN_PROGRESS'
  | 'EVALUATED'
  | 'SHORTLISTED'
  | 'NOT_SHORTLISTED';

export type AnalysisStatus =
  | 'NOT_ANALYZED'
  | 'ANALYZING'
  | 'ANALYSIS_READY'
  | 'ANALYSIS_FAILED';

export type EvaluationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProposalDocument {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  checksum: string;
  uploaded_at: string;
}

export interface ProposalAnalysis {
  id: string;
  analysis_status: AnalysisStatus;
  solution_summary: string;
  technologies: string[];
  architecture_summary: string;
  implementation_plan: string;
  timeline_summary: string;
  budget_summary: string;
  team_summary: string;
  previous_deployments: string;
  infrastructure_requirements: string;
  security_measures: string;
  data_requirements: string;
  scalability_assessment: string;
  risks: string[];
  expected_outcomes: string[];
  key_assumptions: string[];
  source_traceability: Record<string, string>;
  analyzed_at?: string;
}

export interface CriterionScoreOutput {
  criterion_id: string;
  criterion_name: string;
  score: number;
  max_score: number;
  weight: number;
  weighted_score: number;
  comment?: string;
}

export interface ProposalEvaluation {
  id: string;
  proposal_id: string;
  evaluator_id: string;
  evaluator_name: string;
  status: EvaluationStatus;
  criterion_scores: CriterionScoreOutput[];
  total_weighted_score: number;
  general_comments?: string;
  submitted_at?: string;
  created_at: string;
}

export interface ChallengeSimple {
  id: string;
  title: string;
  problem_statement: string;
  department_id: string;
  department_name?: string;
  status: string;
}

export interface StartupSimple {
  id: string;
  company_name: string;
  dpiit_number: string;
  sector?: string;
  stage?: string;
}

export interface Proposal {
  id: string;
  challenge_id: string;
  startup_id: string;
  title: string;
  executive_summary: string;
  estimated_cost: number;
  implementation_duration_days: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status: ProposalStatus;
  assigned_evaluator_ids?: string[];
  shortlist_reason?: string;
  shortlisted_at?: string;
  shortlisted_by?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  challenge?: ChallengeSimple;
  startup?: StartupSimple;
  document?: ProposalDocument;
  analysis?: ProposalAnalysis;
  evaluations?: ProposalEvaluation[];
  average_evaluation_score?: number;
}

export interface ProposalCreateInput {
  title: string;
  executive_summary: string;
  estimated_cost: number;
  implementation_duration_days: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface CriterionScoreInput {
  criterion_id: string;
  score: number;
  comment?: string;
}

export interface EvaluationCreateInput {
  criterion_scores: CriterionScoreInput[];
  general_comments?: string;
}

export interface ProposalShortlistInput {
  decision: 'SHORTLISTED' | 'NOT_SHORTLISTED';
  reason: string;
}

export interface AuditEventItem {
  id: string;
  action: string;
  summary: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
  details: Record<string, any>;
}
