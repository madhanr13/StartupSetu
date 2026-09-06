/**
 * Challenge Creation Page with AI-Assisted Structuring.
 * Allows government officers to structure informal problem descriptions using AI,
 * edit details, add requirements/KPIs/evaluation criteria, and publish or save as draft.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import {
  createChallenge,
  publishChallenge,
  structureChallengeWithAI,
} from "@/services/challengeService";
import type {
  RequirementType,
  ChallengeRequirement,
  ChallengeKPI,
  ChallengeEvaluationCriterion,
} from "@/types";
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";

const DOMAINS = [
  "Infrastructure & Mobility",
  "Water Resources & Smart Utilities",
  "Public Health & Medical Technology",
  "Smart Governance & Digital Services",
  "Agriculture & Rural Technology",
  "Clean Energy & Environment",
];

export default function ChallengeCreatePage() {
  const navigate = useNavigate();

  // AI Prompt input state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDomain, setAiDomain] = useState("Infrastructure & Mobility");
  const [isStructuring, setIsStructuring] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("Infrastructure & Mobility");
  const [subDomain, setSubDomain] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState(5000000);
  const [targetPilotDurationWeeks, setTargetPilotDurationWeeks] = useState(12);
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [technologiesText, setTechnologiesText] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [constraintsText, setConstraintsText] = useState("");

  // Child collections
  const [requirements, setRequirements] = useState<Omit<ChallengeRequirement, "id">[]>([
    {
      requirementType: "technical",
      title: "Core System Capability",
      description: "Must process high-volume operational data in real-time.",
      isMandatory: true,
      order: 1,
    },
  ]);

  const [kpis, setKpis] = useState<Omit<ChallengeKPI, "id">[]>([
    {
      name: "Accuracy Rate",
      description: "Target accuracy for core automated functionality",
      targetValue: 90,
      unit: "%",
      weight: 0.4,
    },
  ]);

  const [evaluationCriteria, setEvaluationCriteria] = useState<
    Omit<ChallengeEvaluationCriterion, "id">[]
  >([
    {
      criterionName: "Technical Feasibility",
      description: "Architecture robustness, algorithm accuracy, and system design",
      weight: 35,
      maxScore: 10,
    },
    {
      criterionName: "Cost Effectiveness & Budget Compatibility",
      description: "Total cost of ownership and pilot cost realism",
      weight: 25,
      maxScore: 10,
    },
  ]);

  // AI Metadata tracking
  const [isAiStructured, setIsAiStructured] = useState(false);
  const [rawPrompt, setRawPrompt] = useState("");
  const [aiNotes, setAiNotes] = useState("");

  // Submitting state
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Structuring handler
  const handleAIStructure = async () => {
    if (!aiPrompt.trim()) {
      setErrorMessage("Please enter a problem description for AI structuring.");
      return;
    }

    try {
      setIsStructuring(true);
      setErrorMessage(null);
      setAiSuccessMessage(null);

      const res = await structureChallengeWithAI({
        problemStatement: aiPrompt,
        domain: aiDomain,
      });

      // Populate form
      setTitle(res.title);
      setDomain(res.domain);
      setSubDomain(res.subDomain || "");
      setProblemStatement(res.problemStatement);
      setEstimatedBudget(res.estimatedBudget);
      setTargetPilotDurationWeeks(res.targetPilotDurationWeeks);
      setTechnologiesText(res.technologies.join(", "));
      setOutcomesText(res.expectedOutcomes.join("\n"));
      setConstraintsText(res.constraints.join("\n"));

      // Set child collections
      setRequirements(
        res.requirements.map((r, idx) => ({
          requirementType: r.requirementType as RequirementType,
          title: r.title,
          description: r.description,
          isMandatory: r.isMandatory,
          order: idx + 1,
        }))
      );

      setKpis(
        res.kpis.map((k) => ({
          name: k.name,
          description: k.description,
          targetValue: k.targetValue,
          unit: k.unit,
          weight: k.weight,
        }))
      );

      setEvaluationCriteria(
        res.evaluationCriteria.map((e) => ({
          criterionName: e.criterionName,
          description: e.description,
          weight: e.weight,
          maxScore: e.maxScore,
        }))
      );

      setIsAiStructured(true);
      setRawPrompt(aiPrompt);
      setAiNotes(res.aiNotes);
      setAiSuccessMessage("Challenge structured by AI. Review and edit the generated fields below.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to structure challenge using AI.");
    } finally {
      setIsStructuring(false);
    }
  };

  // Build payload
  const buildPayload = () => {
    const technologies = technologiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const expectedOutcomes = outcomesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const constraints = constraintsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      title,
      domain,
      subDomain: subDomain || undefined,
      problemStatement,
      description: description || undefined,
      estimatedBudget: Number(estimatedBudget),
      targetPilotDurationWeeks: Number(targetPilotDurationWeeks),
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : undefined,
      technologies,
      expectedOutcomes,
      constraints,
      requirements,
      kpis,
      evaluationCriteria,
      isAiStructured,
      rawUnstructuredPrompt: rawPrompt || undefined,
      aiStructuringNotes: aiNotes || undefined,
    };
  };

  // Submit handlers
  const handleSaveDraft = async () => {
    if (!title.trim() || !problemStatement.trim()) {
      setErrorMessage("Please enter at least a Title and Problem Statement.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const challenge = await createChallenge(buildPayload());
      navigate(`/gov/challenges/${challenge.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save challenge draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !problemStatement.trim()) {
      setErrorMessage("Please enter at least a Title and Problem Statement.");
      return;
    }

    try {
      setIsPublishing(true);
      setErrorMessage(null);
      const challenge = await createChallenge(buildPayload());
      await publishChallenge(challenge.id);
      navigate(`/gov/challenges/${challenge.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to publish challenge.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper functions for dynamic lists
  const addRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      {
        requirementType: "technical",
        title: "",
        description: "",
        isMandatory: true,
        order: prev.length + 1,
      },
    ]);
  };

  const removeRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const addKpi = () => {
    setKpis((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        targetValue: 0,
        unit: "%",
        weight: 0.2,
      },
    ]);
  };

  const removeKpi = (index: number) => {
    setKpis((prev) => prev.filter((_, i) => i !== index));
  };

  const addEvaluationCriterion = () => {
    setEvaluationCriteria((prev) => [
      ...prev,
      {
        criterionName: "",
        description: "",
        weight: 20,
        maxScore: 10,
      },
    ]);
  };

  const removeEvaluationCriterion = (index: number) => {
    setEvaluationCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/gov/challenges")}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader
          title="Create Procurement Challenge"
          description="Define a new government problem statement, requirements, and evaluation metrics."
          className="mb-0 flex-1"
        />
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── 1. AI-Assisted Challenge Structuring Box ──────────────────────── */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-300" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-purple-200">
            AI-Assisted Challenge Structuring
          </h2>
        </div>
        <p className="text-xs text-purple-100 mb-4 max-w-3xl">
          Describe your department's problem in plain, informal language. The AI assistant will automatically translate it into structured requirements, target KPIs, and evaluation criteria.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <textarea
                rows={3}
                placeholder="Example: We need an automated system to detect potholes from road photos collected by garbage trucks and prioritize road maintenance..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium resize-none"
              />
            </div>
            <div className="space-y-2">
              <select
                value={aiDomain}
                onChange={(e) => setAiDomain(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d} className="text-slate-900">
                    {d}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isStructuring}
                onClick={handleAIStructure}
                className="w-full py-2.5 px-4 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
              >
                {isStructuring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Structuring...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Structure with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {aiSuccessMessage && (
          <div className="mt-4 p-3 bg-purple-800/60 border border-purple-400/40 rounded-lg text-xs text-purple-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{aiSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* ── 2. Challenge Details Form ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Basic Challenge Details</h3>
          {isAiStructured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>AI Populated — Editable</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Challenge Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Automated Pothole Detection & Road Quality Assessment System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Domain <span className="text-red-500">*</span>
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sub-Domain
            </label>
            <input
              type="text"
              placeholder="e.g. Municipal Road Infrastructure"
              value={subDomain}
              onChange={(e) => setSubDomain(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Problem Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed description of the problem government department faces..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description / Context
            </label>
            <textarea
              rows={2}
              placeholder="Background context, current workflow, or pilot operational environment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Pilot Budget (₹)
            </label>
            <input
              type="number"
              min={0}
              step={100000}
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Pilot Duration (Weeks)
            </label>
            <input
              type="number"
              min={1}
              max={52}
              value={targetPilotDurationWeeks}
              onChange={(e) => setTargetPilotDurationWeeks(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submission Deadline
            </label>
            <input
              type="date"
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Technologies (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Vision, Edge AI, IoT Sensors, Geospatial GIS"
              value={technologiesText}
              onChange={(e) => setTechnologiesText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Outcomes (One per line)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Real-time road condition heatmaps&#10;Automated maintenance dispatch work orders"
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Constraints & Governance Rules (One per line)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Must comply with DPDP Act data privacy rules&#10;On-premise data residency required"
              value={constraintsText}
              onChange={(e) => setConstraintsText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Structured Requirements Table ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Functional & Technical Requirements</h3>
            <p className="text-xs text-slate-500">Specify precise technical and compliance specifications.</p>
          </div>
          <button
            type="button"
            onClick={addRequirement}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Requirement</span>
          </button>
        </div>

        <div className="space-y-3">
          {requirements.map((req, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="w-36 shrink-0">
                <select
                  value={req.requirementType}
                  onChange={(e) => {
                    const updated = [...requirements];
                    updated[idx].requirementType = e.target.value as RequirementType;
                    setRequirements(updated);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 capitalize"
                >
                  <option value="technical">Technical</option>
                  <option value="functional">Functional</option>
                  <option value="compliance">Compliance</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  placeholder="Requirement Title"
                  value={req.title}
                  onChange={(e) => {
                    const updated = [...requirements];
                    updated[idx].title = e.target.value;
                    setRequirements(updated);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Detailed description..."
                  value={req.description}
                  onChange={(e) => {
                    const updated = [...requirements];
                    updated[idx].description = e.target.value;
                    setRequirements(updated);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600"
                />
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <label className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={req.isMandatory}
                    onChange={(e) => {
                      const updated = [...requirements];
                      updated[idx].isMandatory = e.target.checked;
                      setRequirements(updated);
                    }}
                    className="rounded text-blue-700 focus:ring-blue-600"
                  />
                  <span>Mandatory</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeRequirement(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Target KPIs Section ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Target Pilot KPIs</h3>
            <p className="text-xs text-slate-500">Measurable target metrics to evaluate pilot success.</p>
          </div>
          <button
            type="button"
            onClick={addKpi}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add KPI</span>
          </button>
        </div>

        <div className="space-y-3">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
            >
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="KPI Name (e.g. Detection Accuracy)"
                  value={kpi.name}
                  onChange={(e) => {
                    const updated = [...kpis];
                    updated[idx].name = e.target.value;
                    setKpis(updated);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Target"
                  value={kpi.targetValue}
                  onChange={(e) => {
                    const updated = [...kpis];
                    updated[idx].targetValue = Number(e.target.value);
                    setKpis(updated);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Unit (%, sec, hrs)"
                  value={kpi.unit}
                  onChange={(e) => {
                    const updated = [...kpis];
                    updated[idx].unit = e.target.value;
                    setKpis(updated);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  placeholder="Weight (0-1)"
                  value={kpi.weight}
                  onChange={(e) => {
                    const updated = [...kpis];
                    updated[idx].weight = Number(e.target.value);
                    setKpis(updated);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => removeKpi(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Evaluation Criteria Section ──────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Proposal Evaluation Rubric</h3>
            <p className="text-xs text-slate-500">Criteria and weights used by technical evaluators.</p>
          </div>
          <button
            type="button"
            onClick={addEvaluationCriterion}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Criterion</span>
          </button>
        </div>

        <div className="space-y-3">
          {evaluationCriteria.map((crit, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
            >
              <div className="sm:col-span-3 space-y-1">
                <input
                  type="text"
                  placeholder="Criterion Name (e.g. Technical Feasibility)"
                  value={crit.criterionName}
                  onChange={(e) => {
                    const updated = [...evaluationCriteria];
                    updated[idx].criterionName = e.target.value;
                    setEvaluationCriteria(updated);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Scoring guidance for evaluators..."
                  value={crit.description}
                  onChange={(e) => {
                    const updated = [...evaluationCriteria];
                    updated[idx].description = e.target.value;
                    setEvaluationCriteria(updated);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Weight (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={crit.weight}
                  onChange={(e) => {
                    const updated = [...evaluationCriteria];
                    updated[idx].weight = Number(e.target.value);
                    setEvaluationCriteria(updated);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Max Score</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={crit.maxScore}
                  onChange={(e) => {
                    const updated = [...evaluationCriteria];
                    updated[idx].maxScore = Number(e.target.value);
                    setEvaluationCriteria(updated);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => removeEvaluationCriterion(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigate("/gov/challenges")}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={isSaving || isPublishing}
          onClick={handleSaveDraft}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Save className="w-4 h-4 text-slate-600" />
          )}
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          disabled={isSaving || isPublishing}
          onClick={handlePublish}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Publish Challenge</span>
        </button>
      </div>
    </div>
  );
}
