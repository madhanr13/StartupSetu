/**
 * Settings API Service
 *
 * Provides query and mutation interfaces for system configuration,
 * including matching weights, eligibility parameters, and operational defaults.
 */

import { apiRequest } from "./api";

export interface SystemSettingItem {
  id: string;
  key: string;
  value: unknown;
  value_type: "STRING" | "INTEGER" | "FLOAT" | "BOOLEAN" | "JSON";
  category: "GENERAL" | "ELIGIBILITY" | "MATCHING" | "PILOT" | "WORKFLOW" | "NOTIFICATIONS";
  label: string;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface MatchingWeightsResponse {
  weights: Record<string, number>;
  updated_at?: string;
  updated_by?: string;
}

export const settingsService = {
  /**
   * Fetch all system settings
   */
  async getSettings(): Promise<SystemSettingItem[]> {
    return apiRequest<SystemSettingItem[]>("/settings");
  },

  /**
   * Fetch settings filtered by category
   */
  async getSettingsByCategory(category: string): Promise<SystemSettingItem[]> {
    return apiRequest<SystemSettingItem[]>(`/settings/category/${category}`);
  },

  /**
   * Fetch a single setting by key
   */
  async getSetting(key: string): Promise<SystemSettingItem> {
    return apiRequest<SystemSettingItem>(`/settings/${encodeURIComponent(key)}`);
  },

  /**
   * Update setting value (Admin only)
   */
  async updateSetting(key: string, value: unknown): Promise<SystemSettingItem> {
    return apiRequest<SystemSettingItem>(`/settings/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: { value },
    });
  },

  /**
   * Fetch active multi-criteria startup matching weights
   */
  async getMatchingWeights(): Promise<MatchingWeightsResponse> {
    return apiRequest<MatchingWeightsResponse>("/settings/matching-weights");
  },

  /**
   * Update startup matching weights (Admin only)
   */
  async updateMatchingWeights(weights: Record<string, number>): Promise<MatchingWeightsResponse> {
    return apiRequest<MatchingWeightsResponse>("/settings/matching-weights", {
      method: "PATCH",
      body: { weights },
    });
  },
};
