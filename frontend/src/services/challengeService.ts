/**
 * Challenge API service — client-side communication with Challenge backend endpoints.
 */

import { apiRequest } from "@/services/api";
import type {
  Challenge,
  ChallengeCreateInput,
  ChallengeUpdateInput,
  AIStructureInput,
  AIStructureResponse,
} from "@/types";

export interface ListChallengesParams {
  domain?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListChallengesResponse {
  items: Challenge[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

function normalizeChallenge(raw: any): Challenge {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug || raw.id,
    problemStatement: raw.problem_statement || raw.problemStatement || raw.description || "",
    description: raw.description,
    domain: raw.domain || "Infrastructure",
    subDomain: raw.sub_domain || raw.subDomain,
    departmentId: raw.department_id || raw.departmentId,
    departmentName: raw.department_name || raw.departmentName || raw.department || "Government Department",
    creatorId: raw.created_by || raw.creatorId,
    creatorName: raw.creator_name || raw.creatorName,
    status: raw.status,
    estimatedBudget: raw.budget_max || raw.estimated_budget || raw.estimatedBudget || raw.budget_min || 5000000,
    targetPilotDurationWeeks: raw.pilot_duration_weeks || raw.targetPilotDurationWeeks || 12,
    submissionDeadline: raw.deadline || raw.submissionDeadline,
    pilotStartDate: raw.pilot_start_date || raw.pilotStartDate,
    eligibleStartupStages: raw.eligible_startup_stages || raw.eligibleStartupStages || [],
    technologies: raw.technologies || [],
    expectedOutcomes: raw.expected_outcomes || raw.expectedOutcomes || [],
    constraints: raw.constraints || [],
    isAiStructured: Boolean(raw.is_ai_structured || raw.isAiStructured),
    rawUnstructuredPrompt: raw.raw_unstructured_prompt || raw.rawUnstructuredPrompt,
    aiStructuringNotes: raw.ai_structuring_notes || raw.aiStructuringNotes,
    requirements: (raw.requirements || []).map((r: any) => ({
      id: r.id,
      requirementType: r.requirement_type || r.requirementType || "technical",
      title: r.title || r.description || "Requirement",
      description: r.description || "",
      isMandatory: Boolean(r.is_mandatory ?? r.isMandatory ?? true),
      order: r.order || 0,
    })),
    kpis: (raw.kpis || []).map((k: any) => ({
      id: k.id,
      name: k.name,
      description: k.description || "",
      targetValue: k.target_value ?? k.targetValue ?? 0,
      unit: k.unit || "",
      weight: k.weight ?? 1.0,
      baselineValue: k.baseline_value ?? k.baselineValue,
    })),
    evaluationCriteria: (raw.evaluation_criteria || raw.evaluationCriteria || []).map((ec: any) => ({
      id: ec.id,
      criterionName: ec.name || ec.criterionName || "Evaluation Criterion",
      description: ec.description || "",
      weight: ec.weight ?? 1.0,
      maxScore: ec.max_score ?? ec.maxScore ?? 10,
      scoringGuide: ec.scoring_guide || ec.scoringGuide,
    })),
    proposalCount: raw.proposal_count ?? raw.proposalCount ?? 0,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    publishedAt: raw.published_at || raw.publishedAt,
  };
}

/**
 * Fetch a paginated list of challenges with optional search and filter.
 */
export async function listChallenges(
  params: ListChallengesParams = {}
): Promise<ListChallengesResponse> {
  const query = new URLSearchParams();
  if (params.domain) query.append("domain", params.domain);
  if (params.status) query.append("status", params.status);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("page_size", params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const rawRes = await apiRequest<any>(`/challenges${queryString}`);

  const items = (rawRes.items || []).map(normalizeChallenge);
  const total = rawRes.total || items.length;
  const pageSize = rawRes.page_size || params.limit || 10;
  const pages = Math.ceil(total / pageSize) || 1;

  return {
    items,
    total,
    page: rawRes.page || 1,
    pages,
    limit: pageSize,
  };
}

/**
 * Fetch a single challenge by ID.
 */
export async function getChallenge(id: string): Promise<Challenge> {
  const raw = await apiRequest<any>(`/challenges/${id}`);
  return normalizeChallenge(raw);
}

/**
 * Create a new challenge (DRAFT).
 */
export async function createChallenge(
  data: ChallengeCreateInput
): Promise<Challenge> {
  return apiRequest<Challenge>("/challenges", {
    method: "POST",
    body: data,
  });
}

/**
 * Update an existing challenge.
 */
export async function updateChallenge(
  id: string,
  data: ChallengeUpdateInput
): Promise<Challenge> {
  return apiRequest<Challenge>(`/challenges/${id}`, {
    method: "PUT",
    body: data,
  });
}

/**
 * Publish a DRAFT challenge, transitioning it to PUBLISHED or ACCEPTING_PROPOSALS.
 */
export async function publishChallenge(id: string): Promise<Challenge> {
  return apiRequest<Challenge>(`/challenges/${id}/publish`, {
    method: "POST",
  });
}

/**
 * Request AI to structure an unstructured problem statement.
 */
export async function structureChallengeWithAI(
  data: AIStructureInput
): Promise<AIStructureResponse> {
  return apiRequest<AIStructureResponse>("/challenges/structure", {
    method: "POST",
    body: data,
  });
}
