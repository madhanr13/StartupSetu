/**
 * Simulation API Service — What-If Procurement Decision Sandbox.
 *
 * Provides interfaces to simulate startup matching and pilot decision outcomes
 * with temporary parameters, and save/load simulation scenarios.
 */

import { apiRequest } from "./api";

export interface StartupRankComparison {
  startup_id: string;
  startup_name: string;
  dpiit_number?: string;
  baseline_rank: number;
  simulated_rank: number;
  rank_change: number;
  baseline_score: number;
  simulated_score: number;
  score_diff: number;
  baseline_breakdown: Record<string, number>;
  simulated_breakdown: Record<string, number>;
  movement_reason?: string;
}

export interface MatchingSimulationResponse {
  challenge_id: string;
  challenge_title: string;
  baseline_weights: Record<string, number>;
  simulated_weights: Record<string, number>;
  rankings: StartupRankComparison[];
  top_promoted?: StartupRankComparison;
  top_demoted?: StartupRankComparison;
  summary_insights: string[];
  explanation: string;
}

export interface PilotSimulationResponse {
  pilot_id: string;
  pilot_title: string;
  startup_name: string;
  baseline_thresholds: Record<string, unknown>;
  simulated_thresholds: Record<string, unknown>;
  baseline_outcome: "SCALE" | "EXTEND" | "REJECT" | string;
  simulated_outcome: "SCALE" | "EXTEND" | "REJECT" | string;
  outcome_changed: boolean;
  metrics: {
    overall_score: number;
    kpi_performance: number;
    milestone_performance: number;
    risk_level: string;
    open_critical_risks: number;
    blocked_milestones: number;
    total_kpis: number;
    total_milestones: number;
  };
  explanation: string;
  detailed_reasons: string[];
}

export interface SavedScenarioItem {
  id: string;
  title: string;
  description?: string;
  scenario_type: "MATCHING" | "PILOT_DECISION";
  target_id: string;
  target_title: string;
  input_parameters: Record<string, unknown>;
  baseline_parameters: Record<string, unknown>;
  results_summary: Record<string, unknown>;
  explanation?: string;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveScenarioPayload {
  title: string;
  description?: string;
  scenario_type: "MATCHING" | "PILOT_DECISION";
  target_id: string;
  target_title: string;
  input_parameters: Record<string, unknown>;
  baseline_parameters: Record<string, unknown>;
  results_summary: Record<string, unknown>;
  explanation?: string;
}

export const simulationService = {
  /** Run a startup matching what-if simulation */
  async runMatchingSimulation(
    challengeId: string,
    weights: Record<string, number>
  ): Promise<MatchingSimulationResponse> {
    return apiRequest<MatchingSimulationResponse>("/simulations/matching", {
      method: "POST",
      body: { challenge_id: challengeId, weights },
    });
  },

  /** Run a pilot decision what-if simulation */
  async runPilotSimulation(
    pilotId: string,
    thresholds: Record<string, unknown>
  ): Promise<PilotSimulationResponse> {
    return apiRequest<PilotSimulationResponse>("/simulations/pilot", {
      method: "POST",
      body: { pilot_id: pilotId, thresholds },
    });
  },

  /** List saved simulation scenarios */
  async getScenarios(scenarioType?: string): Promise<SavedScenarioItem[]> {
    const query = scenarioType ? `?scenario_type=${encodeURIComponent(scenarioType)}` : "";
    return apiRequest<SavedScenarioItem[]>(`/simulations/scenarios${query}`);
  },

  /** Save a simulation scenario */
  async saveScenario(payload: SaveScenarioPayload): Promise<SavedScenarioItem> {
    return apiRequest<SavedScenarioItem>("/simulations/scenarios", {
      method: "POST",
      body: payload,
    });
  },

  /** Get a single saved scenario */
  async getScenario(id: string): Promise<SavedScenarioItem> {
    return apiRequest<SavedScenarioItem>(`/simulations/scenarios/${id}`);
  },

  /** Delete a saved scenario */
  async deleteScenario(id: string): Promise<void> {
    return apiRequest<void>(`/simulations/scenarios/${id}`, {
      method: "DELETE",
    });
  },
};
