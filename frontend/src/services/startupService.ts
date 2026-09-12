/**
 * Startup API service — communication with Startup and AI Discovery FastAPI endpoints.
 */

import { apiRequest } from "@/services/api";
import type {
  Startup,
  StartupSummary,
  StartupMatchRecommendation,
  StartupComparisonResponse,
} from "@/types";

export interface ListStartupsParams {
  search?: string;
  domain?: string;
  technology?: string;
  location?: string;
  minReadiness?: number;
  page?: number;
  limit?: number;
}

export interface ListStartupsResponse {
  items: StartupSummary[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

/**
 * Fetch paginated & filtered list of startups.
 */
export async function listStartups(
  params: ListStartupsParams = {}
): Promise<ListStartupsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.domain) query.append("domain", params.domain);
  if (params.technology) query.append("technology", params.technology);
  if (params.location) query.append("location", params.location);
  if (params.minReadiness !== undefined)
    query.append("min_readiness", params.minReadiness.toString());
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ListStartupsResponse>(`/startups${queryString}`);
}

/**
 * Fetch detailed capability profile of a single startup by ID or slug.
 */
export async function getStartup(idOrSlug: string): Promise<Startup> {
  return apiRequest<Startup>(`/startups/${idOrSlug}`);
}

/**
 * Get AI-ranked startup recommendations for a challenge.
 */
export async function getChallengeRecommendations(
  challengeId: string
): Promise<StartupMatchRecommendation[]> {
  return apiRequest<StartupMatchRecommendation[]>(
    `/challenges/${challengeId}/startup-recommendations`
  );
}

/**
 * Compare selected startups side-by-side for a challenge.
 */
export async function compareStartups(
  challengeId: string,
  startupIds: string[]
): Promise<StartupComparisonResponse> {
  return apiRequest<StartupComparisonResponse>(
    `/challenges/${challengeId}/compare-startups`,
    {
      method: "POST",
      body: { startup_ids: startupIds },
    }
  );
}
