/**
 * What-If Procurement Simulator — StartupSetu Decision Support Sandbox.
 *
 * Allows authorized government officers and administrators to test alternative
 * matching factor weights and pilot decision thresholds against live database
 * entities without mutating official procurement records.
 */

import { useEffect, useState } from "react";
import {
  Sliders,
  Play,
  RotateCcw,
  Save,
  Shield,
  Target,
  FlaskConical,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { listChallenges } from "@/services/challengeService";
import { pilotService } from "@/services/pilotService";
import {
  simulationService,
  type MatchingSimulationResponse,
  type PilotSimulationResponse,
  type SavedScenarioItem,
} from "@/services/simulationService";
import type { Challenge, Pilot } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

// Default factor weights defined by the system
const DEFAULT_MATCHING_WEIGHTS: Record<string, number> = {
  technology_fit: 0.25,
  domain_fit: 0.20,
  relevant_projects: 0.15,
  team_capability: 0.10,
  deployment_experience: 0.10,
  scalability: 0.10,
  security_readiness: 0.05,
  budget_compatibility: 0.05,
};

const FACTOR_METADATA: Record<string, { label: string; description: string }> = {
  technology_fit: {
    label: "Technology & Stack Fit",
    description: "Alignment with required frameworks, architecture, and technical depth.",
  },
  domain_fit: {
    label: "Domain & Sector Fit",
    description: "Relevance of the startup's primary sector to the challenge problem.",
  },
  relevant_projects: {
    label: "Past Project Experience",
    description: "Demonstrated prior production deployments and verified project artifacts.",
  },
  team_capability: {
    label: "Team Strength & Capacity",
    description: "Core technical team composition, key personnel, and capacity.",
  },
  deployment_experience: {
    label: "Field Deployment Readiness",
    description: "Experience rolling out solutions in government or enterprise settings.",
  },
  scalability: {
    label: "Scalability & Architecture",
    description: "High-volume throughput capacity and scaling readiness.",
  },
  security_readiness: {
    label: "Security & Compliance",
    description: "Data privacy standards, CERT-In compliance, and access security.",
  },
  budget_compatibility: {
    label: "Commercial & Budget Fit",
    description: "Cost structure compatibility with estimated challenge allocations.",
  },
};

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState<"MATCHING" | "PILOT" | "SAVED">("MATCHING");

  // ── Matching Simulation State ──────────────────────────────────────────────
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [simulatedWeights, setSimulatedWeights] = useState<Record<string, number>>({
    ...DEFAULT_MATCHING_WEIGHTS,
  });
  const [matchingResult, setMatchingResult] = useState<MatchingSimulationResponse | null>(null);
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [expandedStartupId, setExpandedStartupId] = useState<string | null>(null);

  // ── Pilot Decision Simulation State ────────────────────────────────────────
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [selectedPilotId, setSelectedPilotId] = useState<string>("");
  const [pilotThresholds, setPilotThresholds] = useState({
    min_overall_score: 75.0,
    min_kpi_score: 70.0,
    max_acceptable_risk: "MEDIUM",
    require_zero_critical_risks: true,
    require_zero_blocked_milestones: true,
  });
  const [pilotResult, setPilotResult] = useState<PilotSimulationResponse | null>(null);
  const [loadingPilot, setLoadingPilot] = useState(false);

  // ── Saved Scenarios State ──────────────────────────────────────────────────
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioItem[]>([]);
  const [scenarioFilter, setScenarioFilter] = useState<"ALL" | "MATCHING" | "PILOT_DECISION">("ALL");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [savingScenario, setSavingScenario] = useState(false);

  // ── General Status State ───────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initial data loading
  useEffect(() => {
    async function loadData() {
      try {
        const [challengeRes, pilotRes, scenariosRes] = await Promise.all([
          listChallenges({ limit: 100 }).catch(() => ({ items: [] })),
          pilotService.getPilots().catch(() => []),
          simulationService.getScenarios().catch(() => []),
        ]);

        const chList = challengeRes.items || [];
        setChallenges(chList);
        if (chList.length > 0) {
          setSelectedChallengeId(chList[0].id);
        }

        const pList = pilotRes || [];
        setPilots(pList);
        if (pList.length > 0) {
          setSelectedPilotId(pList[0].id);
        }

        setSavedScenarios(scenariosRes || []);
      } catch (err) {
        console.error("Failed to initialize simulation workspace data:", err);
      }
    }
    loadData();
  }, []);

  // Compute total simulated weight sum
  const totalWeightPercent = Math.round(
    Object.values(simulatedWeights).reduce((sum, val) => sum + val * 100, 0)
  );

  const handleWeightChange = (factor: string, percent: number) => {
    setSimulatedWeights((prev) => ({
      ...prev,
      [factor]: Math.max(0, Math.min(100, percent)) / 100,
    }));
  };

  const normalizeWeights = () => {
    const total = Object.values(simulatedWeights).reduce((s, v) => s + v, 0);
    if (total <= 0) return;
    const normalized: Record<string, number> = {};
    for (const key of Object.keys(simulatedWeights)) {
      normalized[key] = Math.round((simulatedWeights[key] / total) * 100) / 100;
    }
    setSimulatedWeights(normalized);
  };

  const resetWeights = () => {
    setSimulatedWeights({ ...DEFAULT_MATCHING_WEIGHTS });
  };

  const handleRunMatchingSimulation = async () => {
    if (!selectedChallengeId) return;
    setError(null);
    setLoadingMatching(true);
    try {
      const res = await simulationService.runMatchingSimulation(
        selectedChallengeId,
        simulatedWeights
      );
      setMatchingResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Matching simulation failed to execute.");
    } finally {
      setLoadingMatching(false);
    }
  };

  const handleRunPilotSimulation = async () => {
    if (!selectedPilotId) return;
    setError(null);
    setLoadingPilot(true);
    try {
      const res = await simulationService.runPilotSimulation(selectedPilotId, pilotThresholds);
      setPilotResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pilot simulation failed to execute.");
    } finally {
      setLoadingPilot(false);
    }
  };

  const handleOpenSaveModal = () => {
    if (activeTab === "MATCHING" && matchingResult) {
      setSaveTitle(`Matching: ${matchingResult.challenge_title.slice(0, 40)}... (Scenario)`);
      setSaveDescription("Tuned weights scenario analyzing ranking shifts.");
      setSaveModalOpen(true);
    } else if (activeTab === "PILOT" && pilotResult) {
      setSaveTitle(`Pilot: ${pilotResult.pilot_title.slice(0, 40)}... (Thresholds)`);
      setSaveDescription("Decision simulation testing alternative risk and KPI thresholds.");
      setSaveModalOpen(true);
    }
  };

  const handleConfirmSaveScenario = async () => {
    if (!saveTitle.trim()) return;
    setSavingScenario(true);
    setError(null);
    try {
      let payload;
      if (activeTab === "MATCHING" && matchingResult) {
        payload = {
          title: saveTitle,
          description: saveDescription,
          scenario_type: "MATCHING" as const,
          target_id: matchingResult.challenge_id,
          target_title: matchingResult.challenge_title,
          input_parameters: simulatedWeights,
          baseline_parameters: matchingResult.baseline_weights,
          results_summary: {
            total_ranked: matchingResult.rankings.length,
            top_promoted: matchingResult.top_promoted?.startup_name || null,
            top_demoted: matchingResult.top_demoted?.startup_name || null,
            rankings: matchingResult.rankings.map((r) => ({
              startup_name: r.startup_name,
              baseline_rank: r.baseline_rank,
              simulated_rank: r.simulated_rank,
              rank_change: r.rank_change,
              score_diff: r.score_diff,
            })),
          },
          explanation: matchingResult.explanation,
        };
      } else if (activeTab === "PILOT" && pilotResult) {
        payload = {
          title: saveTitle,
          description: saveDescription,
          scenario_type: "PILOT_DECISION" as const,
          target_id: pilotResult.pilot_id,
          target_title: pilotResult.pilot_title,
          input_parameters: pilotThresholds,
          baseline_parameters: pilotResult.baseline_thresholds,
          results_summary: {
            baseline_outcome: pilotResult.baseline_outcome,
            simulated_outcome: pilotResult.simulated_outcome,
            outcome_changed: pilotResult.outcome_changed,
            metrics: pilotResult.metrics,
          },
          explanation: pilotResult.explanation,
        };
      } else {
        return;
      }

      const saved = await simulationService.saveScenario(payload);
      setSavedScenarios((prev) => [saved, ...prev]);
      setSaveModalOpen(false);
      setSuccessMessage(`Scenario "${saved.title}" saved successfully to your repository.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save scenario.");
    } finally {
      setSavingScenario(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      await simulationService.deleteScenario(id);
      setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete scenario.");
    }
  };

  const handleLoadScenario = (item: SavedScenarioItem) => {
    if (item.scenario_type === "MATCHING") {
      setSelectedChallengeId(item.target_id);
      setSimulatedWeights((item.input_parameters as Record<string, number>) || DEFAULT_MATCHING_WEIGHTS);
      setActiveTab("MATCHING");
      setSuccessMessage(`Loaded scenario parameters for "${item.title}". Click "Run Simulation" to execute.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setSelectedPilotId(item.target_id);
      setPilotThresholds({
        min_overall_score: Number((item.input_parameters as any)?.min_overall_score ?? 75),
        min_kpi_score: Number((item.input_parameters as any)?.min_kpi_score ?? 70),
        max_acceptable_risk: String((item.input_parameters as any)?.max_acceptable_risk ?? "MEDIUM"),
        require_zero_critical_risks: Boolean((item.input_parameters as any)?.require_zero_critical_risks ?? true),
        require_zero_blocked_milestones: Boolean((item.input_parameters as any)?.require_zero_blocked_milestones ?? true),
      });
      setActiveTab("PILOT");
      setSuccessMessage(`Loaded scenario parameters for "${item.title}". Click "Run Simulation" to execute.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId);
  const selectedPilot = pilots.find((p) => p.id === selectedPilotId);

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                What-If Procurement Simulator
              </h1>
              <p className="text-xs text-slate-500">
                Decision-support sandbox for evaluating alternative scoring weights and pilot thresholds.
              </p>
            </div>
          </div>
        </div>

        {/* Action / Notification Pill */}
        <div className="flex items-center gap-2">
          {activeTab !== "SAVED" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab("SAVED")}
              className="text-xs flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>Saved Scenarios ({savedScenarios.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Prominent Sandbox Safety Notice ─────────────────────────────────── */}
      <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
        <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-blue-900">
          <strong className="font-semibold">In-Memory Decision Sandbox:</strong> Simulation runs are calculated strictly in memory using verified business logic. Testing hypothetical assumptions will <em>never</em> alter official startup rankings, challenge data, proposal scores, pilot telemetry, or system settings.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Mode Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("MATCHING")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "MATCHING"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Startup Matching Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PILOT")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "PILOT"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Pilot Decision Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SAVED")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "SAVED"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Scenarios ({savedScenarios.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: STARTUP MATCHING SIMULATOR
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "MATCHING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Target className="w-4 h-4 text-blue-600" />
                <span>1. Select Challenge</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Challenge
                </label>
                <select
                  value={selectedChallengeId}
                  onChange={(e) => {
                    setSelectedChallengeId(e.target.value);
                    setMatchingResult(null);
                  }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.domain})
                    </option>
                  ))}
                </select>
              </div>

              {selectedChallenge && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-slate-800 line-clamp-1">
                    {selectedChallenge.title}
                  </div>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed">
                    {selectedChallenge.description || selectedChallenge.problemStatement}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                    <span>Domain: <strong>{selectedChallenge.domain}</strong></span>
                    <span>Status: <strong className="text-blue-700">{selectedChallenge.status}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Weight Configuration Sliders */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>2. Tune Dimension Weights</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetWeights}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    title="Reset to official system defaults"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  {totalWeightPercent !== 100 && (
                    <button
                      type="button"
                      onClick={normalizeWeights}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                    >
                      Normalize
                    </button>
                  )}
                </div>
              </div>

              {/* Total Weight Status Bar */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-600">Total Assigned Weight:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    totalWeightPercent === 100
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {totalWeightPercent}% / 100%
                </span>
              </div>

              {/* Sliders for each dimension */}
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {Object.keys(simulatedWeights).map((dimKey) => {
                  const meta = FACTOR_METADATA[dimKey] || { label: dimKey, description: "" };
                  const percentVal = Math.round(simulatedWeights[dimKey] * 100);
                  const defaultVal = Math.round(DEFAULT_MATCHING_WEIGHTS[dimKey] * 100);
                  const diffFromDefault = percentVal - defaultVal;

                  return (
                    <div key={dimKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate" title={meta.description}>
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono shrink-0">
                          {diffFromDefault !== 0 && (
                            <span
                              className={`text-[10px] font-semibold ${
                                diffFromDefault > 0 ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {diffFromDefault > 0 ? `+${diffFromDefault}%` : `${diffFromDefault}%`}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 w-9 text-right">
                            {percentVal}%
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={percentVal}
                        onChange={(e) => handleWeightChange(dimKey, parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                onClick={handleRunMatchingSimulation}
                loading={loadingMatching}
                disabled={!selectedChallengeId}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 mt-3"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Run Matching Simulation</span>
              </Button>
            </div>
          </div>

          {/* Results Panel (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {!matchingResult ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Sliders className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Ready to Simulate Startup Matching
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                  Adjust the criteria weights on the left and click <strong>Run Matching Simulation</strong> to see how ranking orders and scores dynamically shift.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRunMatchingSimulation}
                  disabled={!selectedChallengeId}
                  className="text-xs"
                >
                  Run Baseline Comparison
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Result Header & Save Button */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                      Simulation Result
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {matchingResult.challenge_title}
                    </h2>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenSaveModal}
                    className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-600" />
                    <span>Save This Scenario</span>
                  </Button>
                </div>

                {/* Deterministic Explanation Card */}
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Why Results Changed (Deterministic Analysis)</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {matchingResult.explanation}
                  </p>
                  {matchingResult.summary_insights.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      {matchingResult.summary_insights.map((insight, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comparative Rankings Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Startup Ranking Movements ({matchingResult.rankings.length} evaluated)
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Baseline vs Simulated
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {matchingResult.rankings.map((item) => {
                      const isExpanded = expandedStartupId === item.startup_id;

                      return (
                        <div key={item.startup_id} className="p-4 hover:bg-slate-50/60 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            {/* Rank change badge & Startup Name */}
                            <div className="flex items-center gap-3">
                              {/* Position indicator */}
                              <div
                                className={`w-14 text-center py-1 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1 shrink-0 ${
                                  item.rank_change > 0
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.rank_change < 0
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {item.rank_change > 0 && <TrendingUp className="w-3 h-3" />}
                                {item.rank_change < 0 && <TrendingDown className="w-3 h-3" />}
                                {item.rank_change === 0 && <Minus className="w-3 h-3" />}
                                <span>#{item.simulated_rank}</span>
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    {item.startup_name}
                                  </span>
                                  {item.dpiit_number && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {item.dpiit_number}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>Official Rank: #{item.baseline_rank}</span>
                                  {item.rank_change !== 0 && (
                                    <span
                                      className={`font-semibold ${
                                        item.rank_change > 0 ? "text-emerald-600" : "text-amber-600"
                                      }`}
                                    >
                                      ({item.rank_change > 0 ? `+${item.rank_change}` : item.rank_change} spot{Math.abs(item.rank_change) > 1 ? "s" : ""})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Scores & expand toggle */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className="text-xs font-mono font-bold text-slate-900">
                                    {item.simulated_score.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">/100</span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  Score Diff:{" "}
                                  <strong
                                    className={
                                      item.score_diff > 0
                                        ? "text-emerald-600"
                                        : item.score_diff < 0
                                        ? "text-amber-600"
                                        : "text-slate-500"
                                    }
                                  >
                                    {item.score_diff > 0 ? `+${item.score_diff}` : item.score_diff}
                                  </strong>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedStartupId(isExpanded ? null : item.startup_id)
                                }
                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                title="Toggle breakdown"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Reason note */}
                          {item.movement_reason && (
                            <p className="text-[11px] text-slate-600 mt-2 pl-[4.25rem] italic">
                              {item.movement_reason}
                            </p>
                          )}

                          {/* Expandable Breakdown Details */}
                          {isExpanded && (
                            <div className="mt-3.5 pl-[4.25rem] pr-2 pt-3 border-t border-slate-100 text-xs">
                              <span className="font-semibold text-slate-700 block mb-2">
                                Factor Scores & Contribution Shift
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.keys(item.simulated_breakdown || {}).map((fKey) => {
                                  const baseScore = item.baseline_breakdown?.[fKey];
                                  if (baseScore === undefined) return null;
                                  const simW = simulatedWeights[fKey] || 0;
                                  const baseW = matchingResult.baseline_weights[fKey] || 0;
                                  const wDiff = Math.round((simW - baseW) * 100);

                                  return (
                                    <div key={fKey} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px]">
                                      <div className="font-medium text-slate-700 truncate" title={fKey}>
                                        {FACTOR_METADATA[fKey]?.label || fKey}
                                      </div>
                                      <div className="font-bold text-slate-900 mt-0.5">
                                        {Number(baseScore).toFixed(0)}/100
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Weight: {Math.round(simW * 100)}%{" "}
                                        {wDiff !== 0 && (
                                          <span className={wDiff > 0 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                                            ({wDiff > 0 ? `+${wDiff}` : wDiff}%)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: PILOT DECISION SIMULATOR
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "PILOT" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                <span>1. Select Pilot Project</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Pilot
                </label>
                <select
                  value={selectedPilotId}
                  onChange={(e) => {
                    setSelectedPilotId(e.target.value);
                    setPilotResult(null);
                  }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {pilots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPilot && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-slate-800 line-clamp-1">
                    {selectedPilot.name}
                  </div>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                    <span>Startup: <strong>{selectedPilot.startup?.company_name || "Active Startup"}</strong></span>
                    <span>Status: <strong className="text-blue-700">{selectedPilot.status}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Threshold Adjustments */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>2. Modify Decision Thresholds</span>
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setPilotThresholds({
                      min_overall_score: 75.0,
                      min_kpi_score: 70.0,
                      max_acceptable_risk: "MEDIUM",
                      require_zero_critical_risks: true,
                      require_zero_blocked_milestones: true,
                    })
                  }
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Min Overall Score Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">Min Overall Score for Scale</span>
                  <span className="font-mono font-bold text-slate-900">{pilotThresholds.min_overall_score}/100</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="1"
                  value={pilotThresholds.min_overall_score}
                  onChange={(e) =>
                    setPilotThresholds((prev) => ({
                      ...prev,
                      min_overall_score: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Min KPI Performance Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">Min KPI Achievement Rate</span>
                  <span className="font-mono font-bold text-slate-900">{pilotThresholds.min_kpi_score}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={pilotThresholds.min_kpi_score}
                  onChange={(e) =>
                    setPilotThresholds((prev) => ({
                      ...prev,
                      min_kpi_score: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Max Acceptable Risk Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Acceptable Operational Risk
                </label>
                <select
                  value={pilotThresholds.max_acceptable_risk}
                  onChange={(e) =>
                    setPilotThresholds((prev) => ({
                      ...prev,
                      max_acceptable_risk: e.target.value,
                    }))
                  }
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                >
                  <option value="LOW">LOW Only (Strict Risk Tolerance)</option>
                  <option value="MEDIUM">MEDIUM (Standard Government Policy)</option>
                  <option value="HIGH">HIGH (High Risk Tolerance)</option>
                </select>
              </div>

              {/* Strict Safeguard Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={pilotThresholds.require_zero_critical_risks}
                    onChange={(e) =>
                      setPilotThresholds((prev) => ({
                        ...prev,
                        require_zero_critical_risks: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Require zero open critical risks for Scale</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={pilotThresholds.require_zero_blocked_milestones}
                    onChange={(e) =>
                      setPilotThresholds((prev) => ({
                        ...prev,
                        require_zero_blocked_milestones: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Require zero blocked milestones for Scale</span>
                </label>
              </div>

              <Button
                type="button"
                onClick={handleRunPilotSimulation}
                loading={loadingPilot}
                disabled={!selectedPilotId}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 mt-3"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Run Pilot Simulation</span>
              </Button>
            </div>
          </div>

          {/* Results Panel (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {!pilotResult ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <FlaskConical className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Ready to Simulate Pilot Decision
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                  Select a pilot and adjust risk or KPI thresholds on the left to evaluate if the recommended outcome shifts between <strong>SCALE</strong>, <strong>EXTEND</strong>, or <strong>REJECT</strong>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRunPilotSimulation}
                  disabled={!selectedPilotId}
                  className="text-xs"
                >
                  Run Baseline Decision Check
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Result Header & Save Button */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                      Decision Simulation Result
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {pilotResult.pilot_title}
                    </h2>
                    <span className="text-xs text-slate-500">
                      Startup: <strong>{pilotResult.startup_name}</strong>
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenSaveModal}
                    className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-600" />
                    <span>Save This Scenario</span>
                  </Button>
                </div>

                {/* Side-by-Side Outcome Comparison Banner */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Procurement Outcome Comparison
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        pilotResult.outcome_changed
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {pilotResult.outcome_changed ? "Outcome Changed" : "Outcome Stable"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
                    {/* Baseline outcome */}
                    <div className="text-center space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Official Baseline Outcome
                      </span>
                      <span
                        className={`text-sm font-extrabold px-3 py-1 rounded-full border inline-block ${
                          pilotResult.baseline_outcome === "SCALE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : pilotResult.baseline_outcome === "EXTEND"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-red-50 text-red-800 border-red-300"
                        }`}
                      >
                        {pilotResult.baseline_outcome}
                      </span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block" />

                    {/* Simulated outcome */}
                    <div className="text-center space-y-1">
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                        Simulated Outcome
                      </span>
                      <span
                        className={`text-sm font-extrabold px-4 py-1.5 rounded-full border shadow-sm inline-block ${
                          pilotResult.simulated_outcome === "SCALE"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-400"
                            : pilotResult.simulated_outcome === "EXTEND"
                            ? "bg-amber-100 text-amber-900 border-amber-400"
                            : "bg-red-100 text-red-900 border-red-400"
                        }`}
                      >
                        {pilotResult.simulated_outcome}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Decision Explanation</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {pilotResult.explanation}
                  </p>
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    {pilotResult.detailed_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actual Pilot Telemetry Summary Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Actual Pilot Telemetry Measured in Database
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 uppercase block">Overall Score</span>
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {pilotResult.metrics.overall_score}/100
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 uppercase block">KPI Rate</span>
                      <span className="text-sm font-mono font-bold text-blue-700">
                        {pilotResult.metrics.kpi_performance}%
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 uppercase block">Milestones</span>
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {pilotResult.metrics.milestone_performance}%
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 uppercase block">Risk Level</span>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-0.5 ${
                          pilotResult.metrics.risk_level === "LOW"
                            ? "bg-emerald-100 text-emerald-800"
                            : pilotResult.metrics.risk_level === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {pilotResult.metrics.risk_level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: SAVED SCENARIOS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "SAVED" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600" />
              <span>Saved Simulation Scenarios ({savedScenarios.length})</span>
            </h2>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 text-xs">
              {(["ALL", "MATCHING", "PILOT_DECISION"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setScenarioFilter(filter)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    scenarioFilter === filter
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter === "MATCHING" ? "Matching" : "Pilot Decisions"}
                </button>
              ))}
            </div>
          </div>

          {savedScenarios.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
              <Bookmark className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs text-slate-600 font-medium">No saved scenarios found.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Run a matching or pilot decision simulation above and click "Save This Scenario" to save it for future reference.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedScenarios
                .filter(
                  (s) => scenarioFilter === "ALL" || s.scenario_type === scenarioFilter
                )
                .map((scenario) => (
                  <div
                    key={scenario.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            scenario.scenario_type === "MATCHING"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {scenario.scenario_type === "MATCHING" ? "Startup Matching" : "Pilot Decision"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(scenario.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {scenario.title}
                      </h3>
                      {scenario.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {scenario.description}
                        </p>
                      )}

                      <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600 space-y-0.5">
                        <div className="truncate">
                          Target: <strong>{scenario.target_title}</strong>
                        </div>
                        {scenario.created_by_name && (
                          <div className="text-slate-400 text-[10px]">
                            Saved by: {scenario.created_by_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoadScenario(scenario)}
                        className="text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-blue-700" />
                        <span>Load Scenario Parameters</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Save Scenario Modal ────────────────────────────────────────────── */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save What-If Scenario"
      >
        <div className="space-y-4 py-2 text-xs">
          <p className="text-slate-500 leading-relaxed">
            Persist this simulation scenario for future review and side-by-side benchmarking.
            Saving a scenario does <strong>not</strong> modify official procurement records.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="e.g. High Technical Capability Scenario"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Justification (Optional)
            </label>
            <textarea
              rows={3}
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Provide context or rationale for this scenario assumption..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSaveScenario}
              loading={savingScenario}
              disabled={!saveTitle.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              Confirm & Save Scenario
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
