import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pilotService } from '@/services/pilotService';
import { procurementService } from '@/services/procurementService';
import type {
  DecisionType,
  Pilot,
  PilotAssessment,
  ProcurementDecision,
  ProcurementDecisionInput,
} from '@/types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  RotateCw,
  TrendingUp,
  Building,
  Target,
  Sparkles,
  Layers,
  ChevronRight,
  Send,
  Lock,
} from 'lucide-react';

export default function ProcurementDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [assessment, setAssessment] = useState<PilotAssessment | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<ProcurementDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | null>(null);
  const [justification, setJustification] = useState('');
  const [extensionDuration, setExtensionDuration] = useState<number>(30);
  const [extensionReason, setExtensionReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isGovOrAdmin = user?.role === 'GOVERNMENT_OFFICER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (pilotId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [pilotData, assessData, historyData] = await Promise.all([
        pilotService.getPilotById(pilotId),
        procurementService.getPilotAssessment(pilotId),
        procurementService.getDecisionHistory(pilotId),
      ]);
      setPilot(pilotData);
      setAssessment(assessData);
      setDecisionHistory(historyData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pilot assessment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async () => {
    if (!id) return;
    try {
      setRecomputing(true);
      const refreshed = await procurementService.recomputePilotAssessment(id);
      setAssessment(refreshed);
    } catch (err: any) {
      alert(err?.message || 'Failed to recompute telemetry assessment');
    } finally {
      setRecomputing(false);
    }
  };

  const openDecisionModal = (type: DecisionType) => {
    setSelectedDecision(type);
    setJustification('');
    setExtensionDuration(30);
    setExtensionReason('');
    setRejectionReason('');
    setConfirmationChecked(false);
    setModalError(null);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedDecision) return;

    if (justification.trim().length < 10) {
      setModalError('Official justification must be at least 10 characters long.');
      return;
    }

    if (selectedDecision === 'EXTEND' && (!extensionDuration || extensionDuration <= 0)) {
      setModalError('Please specify a positive extension duration in days.');
      return;
    }

    if (selectedDecision === 'REJECT' && (!rejectionReason || rejectionReason.trim().length < 5)) {
      setModalError('Please specify a clear rejection reason.');
      return;
    }

    if (!confirmationChecked) {
      setModalError('Please confirm that you have reviewed the telemetry before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      const payload: ProcurementDecisionInput = {
        decision: selectedDecision,
        justification: justification.trim(),
        extension_duration: selectedDecision === 'EXTEND' ? extensionDuration : null,
        extension_reason: selectedDecision === 'EXTEND' ? extensionReason.trim() : null,
        rejection_reason: selectedDecision === 'REJECT' ? rejectionReason.trim() : null,
      };

      await procurementService.submitDecision(id, payload);

      // Refresh data and close modal
      await loadData(id);
      setSelectedDecision(null);

      if (selectedDecision === 'SCALE') {
        // Redirect to procurement scale-up board
        navigate('/gov/procurement');
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to submit procurement decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RotateCw className="w-8 h-8 animate-spin text-blue-800" />
          <p className="text-sm font-semibold">Loading Pilot Telemetry & Assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !pilot) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border border-red-200 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Error Loading Assessment</h2>
          <p className="text-slate-600 text-sm">{error || 'Pilot not found'}</p>
          <Link
            to="/gov/pilots"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Pilots
          </Link>
        </div>
      </div>
    );
  }

  // Rec Badge Colors
  const recBadge = {
    SCALE: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      pill: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
      label: 'RECOMMENDED FOR PUBLIC PROCUREMENT (SCALE)',
      desc: 'Pilot exceeded performance benchmarks with robust telemetry and minimal operational risk.',
    },
    EXTEND: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      pill: 'bg-amber-600 text-white',
      icon: Clock,
      label: 'RECOMMENDED FOR EXTENDED EVALUATION (EXTEND)',
      desc: 'Pilot demonstrated partial efficacy; additional operational verification recommended before procurement scale-up.',
    },
    REJECT: {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      pill: 'bg-rose-600 text-white',
      icon: XCircle,
      label: 'NOT RECOMMENDED FOR PROCUREMENT (REJECT)',
      desc: 'Pilot did not satisfy essential performance thresholds or unresolved operational risks remain high.',
    },
  }[assessment?.recommendation || 'EXTEND'];

  const RecIcon = recBadge.icon;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/pilots/${pilot.id}`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to Pilot Execution Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>PILOT MANAGEMENT</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-900">PROCUREMENT ASSESSMENT & DECISION</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{pilot.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRecompute}
              disabled={recomputing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
              {recomputing ? 'Re-evaluating Telemetry...' : 'Refresh AI Assessment'}
            </button>
            <Link
              to={`/pilots/${pilot.id}`}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              View Pilot Telemetry
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Pilot Context Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Executing Startup</span>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-700" />
                {pilot.startup?.company_name || 'N/A'}
              </p>
              <p className="text-xs text-slate-500">DPIIT Reg: {pilot.startup?.dpiit_number || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sponsoring Challenge</span>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-700" />
                {pilot.challenge?.title || 'N/A'}
              </p>
              <p className="text-xs text-slate-500">Dept: {pilot.challenge?.department_name || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Execution Window</span>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                {new Date(pilot.start_date).toLocaleDateString()} — {new Date(pilot.end_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500">Milestone Progress: {pilot.overall_progress_percentage}%</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</span>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  {pilot.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">Health: {pilot.health?.health_label || 'ON_TRACK'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: AI-ASSISTED PILOT ASSESSMENT */}
        {assessment && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">AI Pilot Telemetry Assessment</h2>
                  <p className="text-xs text-slate-500">
                    Provider-independent algorithmic analysis of verified KPI target fulfillment and operational data.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Data Confidence:</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white border border-slate-200 text-slate-800">
                  {assessment.confidence}%
                </span>
              </div>
            </div>

            {/* Score Grid & Recommendation Banner */}
            <div className="p-6 space-y-6">
              {/* Recommendation Callout */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${recBadge.bg}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0 mt-0.5">
                    <RecIcon className="w-6 h-6 text-slate-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wide ${recBadge.pill}`}>
                        {assessment.recommendation}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">{recBadge.label}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{recBadge.desc}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-white px-4 py-2 rounded-lg border border-slate-200 sm:self-center">
                  <span className="text-xs text-slate-500 font-semibold block">Assessment Score</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{assessment.overall_score}</span>
                  <span className="text-xs text-slate-400 font-bold"> / 100</span>
                </div>
              </div>

              {/* 4 Dimension Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">KPI Performance</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">{assessment.kpi_performance}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${assessment.kpi_performance}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Milestone Progress</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">{assessment.milestone_performance}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${assessment.milestone_performance}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Operational Risk Level</span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase ${
                        assessment.risk_level === 'LOW'
                          ? 'bg-emerald-100 text-emerald-800'
                          : assessment.risk_level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {assessment.risk_level} RISK
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-2">Active telemetry audit</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Telemetry Confidence</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900 font-mono">{assessment.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${assessment.confidence}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Supporting Reasons */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Key Decision Rationale
                  </h3>
                  <ul className="space-y-2">
                    {assessment.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Strengths */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Demonstrated Strengths
                  </h3>
                  <ul className="space-y-2">
                    {assessment.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Concerns */}
                {assessment.concerns.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Operational Concerns & Deficits
                    </h3>
                    <ul className="space-y-2">
                      {assessment.concerns.map((c, i) => (
                        <li key={i} className="text-xs text-amber-900 bg-amber-50/50 p-3 rounded-lg border border-amber-200 leading-relaxed">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Information */}
                {assessment.missing_information.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Missing Information & Evidence Gaps
                    </h3>
                    <ul className="space-y-2">
                      {assessment.missing_information.map((m, i) => (
                        <li key={i} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: VERIFIED TELEMETRY EVIDENCE SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KPI Achievement Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-700" /> Verified KPI Achievements
              </h3>
              <span className="text-xs text-slate-500">{pilot.kpis?.length || 0} Targets Configured</span>
            </div>

            <div className="divide-y divide-slate-100">
              {pilot.kpis?.map((kpi) => (
                <div key={kpi.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{kpi.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Target: <span className="font-semibold">{kpi.target_operator} {kpi.target_value} {kpi.unit}</span> | Weight: {kpi.weight}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-extrabold text-slate-900">
                      {kpi.latest_actual_value !== undefined && kpi.latest_actual_value !== null
                        ? `${kpi.latest_actual_value} ${kpi.unit}`
                        : 'No Data'}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        kpi.status === 'ACHIEVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : kpi.status === 'BELOW_TARGET'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {kpi.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Completion */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" /> Milestone Verification
              </h3>
              <span className="text-xs text-slate-500">{pilot.overall_progress_percentage}% Overall</span>
            </div>

            <div className="space-y-3">
              {pilot.milestones?.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.status === 'COMPLETED' ? 'bg-emerald-600' : m.status === 'BLOCKED' ? 'bg-rose-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${m.completion_percentage}%` }}
                    ></div>
                  </div>
                  {m.blocked_reason && (
                    <p className="text-[11px] text-rose-700 font-medium">⚠️ Blocked: {m.blocked_reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: HUMAN OFFICER DECISION ACTIONS */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" /> Government Officer Procurement Determination
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The AI assessment above provides decision support based on actual telemetry. As the authorized government
              officer, execute the binding procurement determination below.
            </p>
          </div>

          {isGovOrAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* SCALE ACTION */}
              <div className="p-5 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 flex flex-col justify-between space-y-4 transition-all hover:shadow-sm">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    🚀
                  </div>
                  <h3 className="text-sm font-extrabold text-emerald-950">SCALE (Public Procurement)</h3>
                  <p className="text-xs text-emerald-800/90 leading-relaxed">
                    Approve solution as successfully verified in pilot testing. Advances startup directly to the Scale-Up
                    / Public Procurement transition board.
                  </p>
                </div>
                <button
                  onClick={() => openDecisionModal('SCALE')}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Approve for Procurement (SCALE)
                </button>
              </div>

              {/* EXTEND ACTION */}
              <div className="p-5 rounded-xl border-2 border-amber-200 hover:border-amber-400 bg-amber-50/40 flex flex-col justify-between space-y-4 transition-all hover:shadow-sm">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                    ⏱️
                  </div>
                  <h3 className="text-sm font-extrabold text-amber-950">EXTEND (Additional Trial)</h3>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    Grant an extension window for additional telemetry collection, resolve open blockers, or verify
                    borderline KPI targets before final tender.
                  </p>
                </div>
                <button
                  onClick={() => openDecisionModal('EXTEND')}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Authorize Extension (EXTEND)
                </button>
              </div>

              {/* REJECT ACTION */}
              <div className="p-5 rounded-xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50/40 flex flex-col justify-between space-y-4 transition-all hover:shadow-sm">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                    ⛔
                  </div>
                  <h3 className="text-sm font-extrabold text-rose-950">REJECT (Close Solution)</h3>
                  <p className="text-xs text-rose-800/90 leading-relaxed">
                    Decline solution from proceeding to government scale-up. Closes pilot program with mandatory written
                    technical and operational justification.
                  </p>
                </div>
                <button
                  onClick={() => openDecisionModal('REJECT')}
                  className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Decline Solution (REJECT)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Only authorized Government Procurement Officers can execute binding final procurement decisions.</span>
            </div>
          )}
        </div>

        {/* SECTION 4: VERSIONED DECISION HISTORY */}
        {decisionHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Official Decision History & Audit Log
            </h2>

            <div className="space-y-3">
              {decisionHistory.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                          item.decision === 'SCALE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.decision === 'EXTEND'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.decision}
                      </span>
                      <span className="text-xs text-slate-500">
                        by <strong className="text-slate-800">{item.decided_by_user?.name || 'Authorized Officer'}</strong>
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.decided_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Official Justification:</strong>
                    {item.justification}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>AI Recommendation at time of decision: <strong className="text-slate-700">{item.ai_recommendation}</strong></span>
                    <span>AI Score: <strong className="text-slate-700 font-mono">{item.ai_score}/100</strong></span>
                    {item.extension_duration && (
                      <span className="text-amber-800 font-semibold">Duration: +{item.extension_duration} days</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION & DECISION MODAL */}
      {selectedDecision && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span
                  className={`text-xs font-extrabold uppercase tracking-wide px-2 py-0.5 rounded ${
                    selectedDecision === 'SCALE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDecision === 'EXTEND'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  CONFIRM {selectedDecision} DECISION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Official Procurement Determination</h3>
              </div>
              <button
                onClick={() => setSelectedDecision(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Comparison Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Selected Determination:</span>
                <span className="font-extrabold text-slate-900">{selectedDecision}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">AI Advisory Recommendation:</span>
                <span className="font-extrabold text-blue-800">
                  {assessment?.recommendation} (Confidence: {assessment?.confidence}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Verified Telemetry Score:</span>
                <span className="font-mono font-bold text-slate-900">{assessment?.overall_score} / 100</span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              {/* Conditional Inputs */}
              {selectedDecision === 'EXTEND' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">Extension Duration (Days) *</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={extensionDuration}
                      onChange={(e) => setExtensionDuration(parseInt(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">Focus / Evaluation Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Monsoon durability test"
                      value={extensionReason}
                      onChange={(e) => setExtensionReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {selectedDecision === 'REJECT' && (
                <div className="space-y-1 p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <label className="text-xs font-bold text-slate-800">Rejection Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Excessive false positive error rates in urban field trials"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Justification Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Official Officer Justification & Decision Narrative *
                </label>
                <textarea
                  rows={4}
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Document the technical, financial, and operational justification for this decision. This statement is logged permanently to the public audit record..."
                  className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                ></textarea>
                <p className="text-[11px] text-slate-500">Minimum 10 characters required. Preserved in immutable audit trail.</p>
              </div>

              {/* Checkbox confirmation */}
              <label className="flex items-start gap-2.5 text-xs text-slate-600 select-none cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  className="mt-0.5 rounded text-blue-700"
                />
                <span>
                  I confirm that I have reviewed the verified pilot telemetry, KPI outcomes, and AI recommendation, and
                  authorize this official procurement determination.
                </span>
              </label>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDecision(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !confirmationChecked}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 ${
                    selectedDecision === 'SCALE'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : selectedDecision === 'EXTEND'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting Official Determination...' : `Confirm & Authorize ${selectedDecision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
