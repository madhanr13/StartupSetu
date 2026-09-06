/**
 * Challenge domain types matching backend FastAPI schemas.
 */

export type ChallengeStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ACCEPTING_PROPOSALS"
  | "UNDER_EVALUATION"
  | "PILOT_PHASE"
  | "COMPLETED"
  | "CANCELLED";

export type RequirementType =
  | "technical"
  | "functional"
  | "compliance"
  | "security";

export interface ChallengeRequirement {
  id?: string;
  requirementType: RequirementType;
  title: string;
  description: string;
  isMandatory: boolean;
  order: number;
}

export interface ChallengeKPI {
  id?: string;
  name: string;
  description: string;
  targetValue: number;
  unit: string;
  weight: number;
  baselineValue?: number;
}

export interface ChallengeEvaluationCriterion {
  id?: string;
  criterionName: string;
  description: string;
  weight: number;
  maxScore: number;
  scoringGuide?: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  problemStatement: string;
  description?: string;
  domain: string;
  subDomain?: string;
  departmentId?: string;
  departmentName?: string;
  creatorId?: string;
  creatorName?: string;
  status: ChallengeStatus;
  estimatedBudget: number;
  targetPilotDurationWeeks: number;
  submissionDeadline?: string;
  pilotStartDate?: string;
  eligibleStartupStages?: string[];
  technologies?: string[];
  expectedOutcomes?: string[];
  constraints?: string[];
  isAiStructured: boolean;
  rawUnstructuredPrompt?: string;
  aiStructuringNotes?: string;
  requirements: ChallengeRequirement[];
  kpis: ChallengeKPI[];
  evaluationCriteria: ChallengeEvaluationCriterion[];
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ChallengeCreateInput {
  title: string;
  problemStatement: string;
  description?: string;
  domain: string;
  subDomain?: string;
  estimatedBudget: number;
  targetPilotDurationWeeks: number;
  submissionDeadline?: string;
  eligibleStartupStages?: string[];
  technologies?: string[];
  expectedOutcomes?: string[];
  constraints?: string[];
  requirements?: Omit<ChallengeRequirement, "id">[];
  kpis?: Omit<ChallengeKPI, "id">[];
  evaluationCriteria?: Omit<ChallengeEvaluationCriterion, "id">[];
  isAiStructured?: boolean;
  rawUnstructuredPrompt?: string;
  aiStructuringNotes?: string;
}

export interface ChallengeUpdateInput extends Partial<ChallengeCreateInput> {
  status?: ChallengeStatus;
}

export interface AIStructureInput {
  problemStatement: string;
  domain?: string;
}

export interface AIStructureResponse {
  title: string;
  problemStatement: string;
  domain: string;
  subDomain?: string;
  technologies: string[];
  expectedOutcomes: string[];
  constraints: string[];
  estimatedBudget: number;
  targetPilotDurationWeeks: number;
  requirements: Array<{
    requirementType: RequirementType;
    title: string;
    description: string;
    isMandatory: boolean;
  }>;
  kpis: Array<{
    name: string;
    description: string;
    targetValue: number;
    unit: string;
    weight: number;
  }>;
  evaluationCriteria: Array<{
    criterionName: string;
    description: string;
    weight: number;
    maxScore: number;
  }>;
  aiNotes: string;
}
