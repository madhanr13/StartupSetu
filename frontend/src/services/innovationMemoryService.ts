/**
 * Innovation Memory API Service
 *
 * Provides querying, detail views, and related memory matching
 * for institutional procurement knowledge retention.
 */

import { apiRequest } from "./api";

export interface InnovationMemoryItem {
  id: string;
  source_type: string;
  source_id: string;
  title: string;
  summary: string;
  domain?: string;
  technology?: string;
  challenge_area?: string;
  outcome?: string; // SCALE, EXTEND, REJECT
  key_metrics: Record<string, string | number>;
  lessons_learned: string[];
  success_factors: string[];
  failure_factors: string[];
  recommendations: string[];
  startup_id?: string;
  startup_name?: string;
  challenge_id?: string;
  pilot_id?: string;
  decision_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InnovationMemoryListResponse {
  items: InnovationMemoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RelatedMemoryItem {
  id: string;
  title: string;
  domain?: string;
  outcome?: string;
  startup_name?: string;
  key_metrics: Record<string, string | number>;
  lessons_learned: string[];
  created_at: string;
}

export interface InnovationMemoryFilters {
  page?: number;
  page_size?: number;
  domain?: string;
  outcome?: string;
  technology?: string;
  search?: string;
}

export const innovationMemoryService = {
  /**
   * List innovation memories with optional filters
   */
  async getMemories(filters: InnovationMemoryFilters = {}): Promise<InnovationMemoryListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.page_size) params.append("page_size", String(filters.page_size));
    if (filters.domain) params.append("domain", filters.domain);
    if (filters.outcome) params.append("outcome", filters.outcome);
    if (filters.technology) params.append("technology", filters.technology);
    if (filters.search) params.append("search", filters.search);

    const qs = params.toString();
    return apiRequest<InnovationMemoryListResponse>(`/innovation-memory${qs ? `?${qs}` : ""}`);
  },

  /**
   * Get single innovation memory details
   */
  async getMemoryById(id: string): Promise<InnovationMemoryItem> {
    return apiRequest<InnovationMemoryItem>(`/innovation-memory/${id}`);
  },

  /**
   * Find historical innovation memories related to a challenge
   */
  async getRelatedMemories(challengeId: string, limit = 5): Promise<RelatedMemoryItem[]> {
    return apiRequest<RelatedMemoryItem[]>(`/innovation-memory/related/${challengeId}?limit=${limit}`);
  },

  /**
   * Get historical innovation memories for a specific startup
   */
  async getStartupHistory(startupId: string): Promise<InnovationMemoryItem[]> {
    return apiRequest<InnovationMemoryItem[]>(`/innovation-memory/startup/${startupId}`);
  },

  /**
   * Create a manual innovation memory record
   */
  async createMemory(data: Partial<InnovationMemoryItem>): Promise<InnovationMemoryItem> {
    return apiRequest<InnovationMemoryItem>("/innovation-memory", {
      method: "POST",
      body: data,
    });
  },

  /**
   * Update mutable fields of an innovation memory entry
   */
  async updateMemory(id: string, data: Partial<InnovationMemoryItem>): Promise<InnovationMemoryItem> {
    return apiRequest<InnovationMemoryItem>(`/innovation-memory/${id}`, {
      method: "PATCH",
      body: data,
    });
  },
};
