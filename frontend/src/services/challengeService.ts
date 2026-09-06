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
  if (params.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ListChallengesResponse>(`/challenges${queryString}`);
}

/**
 * Fetch a single challenge by ID.
 */
export async function getChallenge(id: string): Promise<Challenge> {
  return apiRequest<Challenge>(`/challenges/${id}`);
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
