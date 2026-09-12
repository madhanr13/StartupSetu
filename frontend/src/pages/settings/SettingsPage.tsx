/**
 * SettingsPage — Platform System Settings & Policy Configuration.
 *
 * Configurable matching weights, eligibility parameters, pilot operational thresholds,
 * and system branding with RBAC enforcement and immutable audit recording.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import LoadingState from "@/components/ui/LoadingState";
import Button from "@/components/ui/Button";
import { settingsService, type SystemSettingItem } from "@/services/settingsService";
import {
  Sliders,
  ShieldCheck,
  FlaskConical,
  Settings as SettingsIcon,
  Check,
  RotateCcw,
  AlertCircle,
  Save,
  Lock,
} from "lucide-react";

type SettingsTab = "MATCHING" | "ELIGIBILITY" | "PILOT" | "GENERAL";

const DEFAULT_WEIGHTS: Record<string, number> = {
  technology_fit: 0.25,
  domain_fit: 0.2,
  relevant_projects: 0.15,
  team_capability: 0.1,
  deployment_experience: 0.1,
  scalability: 0.1,
  security_readiness: 0.05,
  budget_compatibility: 0.05,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<SettingsTab>("MATCHING");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings State
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [eligibility, setEligibility] = useState<{
    dpiit_required: boolean;
    max_age_years: number;
    max_turnover_cr: number;
    min_incorporation_status: string;
  }>({
    dpiit_required: true,
    max_age_years: 10,
    max_turnover_cr: 100,
    min_incorporation_status: "ACTIVE",
  });
  const [pilotDefaults, setPilotDefaults] = useState<{
    default_duration_days: number;
    min_kpis_required: number;
    max_budget_lakhs: number;
    allow_auto_assessment: boolean;
  }>({
    default_duration_days: 90,
    min_kpis_required: 2,
    max_budget_lakhs: 25,
    allow_auto_assessment: true,
  });
  const [platformTitle, setPlatformTitle] = useState("AI-Powered Government Innovation Procurement Platform");

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const [weightsRes, settingsList] = await Promise.all([
        settingsService.getMatchingWeights().catch(() => ({ weights: DEFAULT_WEIGHTS })),
        settingsService.getSettings().catch(() => [] as SystemSettingItem[]),
      ]);

      if (weightsRes?.weights) {
        setWeights(weightsRes.weights);
      }

      for (const s of settingsList) {
        if (s.key === "eligibility.criteria" && typeof s.value === "object") {
          setEligibility(s.value as typeof eligibility);
        } else if (s.key === "pilot.defaults" && typeof s.value === "object") {
          setPilotDefaults(s.value as typeof pilotDefaults);
        } else if (s.key === "general.platform_name" && typeof s.value === "string") {
          setPlatformTitle(s.value);
        }
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Weight Calculation & Normalization
  const totalWeight = Object.values(weights).reduce((acc, val) => acc + val, 0);

  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(1, val)),
    }));
  };

  const handleSaveWeights = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await settingsService.updateMatchingWeights(weights);
      showNotification("Startup matching dimension weights successfully saved and audited.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update weights";
      showNotification(errorMsg, true);
    } finally {
      setSaving(false);
    }
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleSaveEligibility = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await settingsService.updateSetting("eligibility.criteria", eligibility);
      showNotification("Statutory eligibility parameters updated.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update eligibility";
      showNotification(errorMsg, true);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePilotDefaults = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await settingsService.updateSetting("pilot.defaults", pilotDefaults);
      showNotification("Pilot project operational defaults updated.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update pilot defaults";
      showNotification(errorMsg, true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await settingsService.updateSetting("general.platform_name", platformTitle);
      showNotification("General platform configuration updated.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update general settings";
      showNotification(errorMsg, true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingState variant="inline" message="Loading system settings and configuration..." />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="System Settings & Policy Tuning"
        description="Configure AI matching parameters, statutory startup eligibility rules, pilot project defaults, and governance operational controls."
        actions={
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Read-Only (Admin Required to Save)
              </span>
            )}
            {isAdmin && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Admin Write Access Active
              </span>
            )}
          </div>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab("MATCHING")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "MATCHING"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>AI Matching Weights</span>
        </button>

        <button
          onClick={() => setActiveTab("ELIGIBILITY")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ELIGIBILITY"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Eligibility Criteria</span>
        </button>

        <button
          onClick={() => setActiveTab("PILOT")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "PILOT"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Pilot Defaults</span>
        </button>

        <button
          onClick={() => setActiveTab("GENERAL")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "GENERAL"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>General</span>
        </button>
      </div>

      {/* Tab 1: AI Matching Weights */}
      {activeTab === "MATCHING" && (
        <div className="bg-white rounded-b-xl border border-t-0 border-neutral-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Multi-Criteria Startup Ranking Dimensions
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Controls the weight vector applied when matching and ranking registered startups against challenges.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">
                Sum of Weights:{" "}
                <strong
                  className={
                    Math.abs(totalWeight - 1.0) < 0.01 ? "text-emerald-600" : "text-amber-600"
                  }
                >
                  {(totalWeight * 100).toFixed(0)}%
                </strong>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetWeights}
                disabled={!isAdmin}
                className="text-xs gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Defaults
              </Button>
            </div>
          </div>

          {/* Weight Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(weights).map(([key, value]) => {
              const label = key
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              return (
                <div key={key} className="space-y-1.5 p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                    <span>{label}</span>
                    <span className="font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      {(value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={value}
                    disabled={!isAdmin}
                    onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={!isAdmin || saving}
              onClick={handleSaveWeights}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Matching Weights"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Eligibility Criteria */}
      {activeTab === "ELIGIBILITY" && (
        <div className="bg-white rounded-b-xl border border-t-0 border-neutral-200 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">
              Statutory Startup Eligibility Parameters
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Defines regulatory validation rules enforced by the automated eligibility analyzer during discovery and proposal submission.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* DPIIT Recognition Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  DPIIT Recognition Mandatory
                </p>
                <p className="text-xs text-neutral-500">
                  Only allow startups with valid DPIIT certification numbers to participate.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibility.dpiit_required}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setEligibility((prev) => ({ ...prev, dpiit_required: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Max Age */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Maximum Company Age (Years from Incorporation)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={eligibility.max_age_years}
                disabled={!isAdmin}
                onChange={(e) =>
                  setEligibility((prev) => ({
                    ...prev,
                    max_age_years: parseInt(e.target.value) || 10,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-[11px] text-neutral-400">
                DPIIT gazette statutory definition ceiling is 10 years.
              </p>
            </div>

            {/* Max Turnover */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Maximum Annual Turnover (₹ Crores)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={eligibility.max_turnover_cr}
                disabled={!isAdmin}
                onChange={(e) =>
                  setEligibility((prev) => ({
                    ...prev,
                    max_turnover_cr: parseInt(e.target.value) || 100,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-[11px] text-neutral-400">
                DPIIT standard limit is ₹100 Crore in any financial year.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={!isAdmin || saving}
              onClick={handleSaveEligibility}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Eligibility Rules"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Pilot Operational Defaults */}
      {activeTab === "PILOT" && (
        <div className="bg-white rounded-b-xl border border-t-0 border-neutral-200 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">
              Pilot Project Operational Parameters
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Default baseline parameters applied during proposal conversion into live pilot contracts.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Standard Pilot Duration (Days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={pilotDefaults.default_duration_days}
                disabled={!isAdmin}
                onChange={(e) =>
                  setPilotDefaults((prev) => ({
                    ...prev,
                    default_duration_days: parseInt(e.target.value) || 90,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Min KPIs */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Minimum Mandatory KPIs per Pilot Project
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={pilotDefaults.min_kpis_required}
                disabled={!isAdmin}
                onChange={(e) =>
                  setPilotDefaults((prev) => ({
                    ...prev,
                    min_kpis_required: parseInt(e.target.value) || 2,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Max Budget */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Maximum Direct Grant Pilot Budget (₹ Lakhs)
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={pilotDefaults.max_budget_lakhs}
                disabled={!isAdmin}
                onChange={(e) =>
                  setPilotDefaults((prev) => ({
                    ...prev,
                    max_budget_lakhs: parseInt(e.target.value) || 25,
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Auto Assessment Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Enable AI Pilot Telemetry Assessment
                </p>
                <p className="text-xs text-neutral-500">
                  Allow automated readiness scoring based on real KPI metrics when a pilot completes.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pilotDefaults.allow_auto_assessment}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setPilotDefaults((prev) => ({
                      ...prev,
                      allow_auto_assessment: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={!isAdmin || saving}
              onClick={handleSavePilotDefaults}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Pilot Configuration"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: General */}
      {activeTab === "GENERAL" && (
        <div className="bg-white rounded-b-xl border border-t-0 border-neutral-200 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">
              General Platform Identity & Branding
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Portal-wide display configuration and public procurement portal attributes.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Official Portal Title</label>
              <input
                type="text"
                value={platformTitle}
                disabled={!isAdmin}
                onChange={(e) => setPlatformTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="p-4 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 space-y-1.5">
              <p className="font-semibold">Compliance Assurance Note:</p>
              <p className="leading-relaxed">
                All configuration changes performed in this panel are recorded into the immutable
                audit trail with before-and-after values, timestamp, and administrator credentials.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={!isAdmin || saving}
              onClick={handleSaveGeneral}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save General Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
