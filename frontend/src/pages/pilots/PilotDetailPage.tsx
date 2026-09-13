import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import {
  Building,
  Rocket,
  Paperclip,
  BarChart3,
  Scale,
  ArrowUpRight,
  Clock,
  GraduationCap,
  Info,
  Pencil,
  History,
  TrendingUp,
  Calendar,
  ScrollText,
  FileCheck,
} from 'lucide-react';
import { pilotService } from '../../services/pilotService';
import type { Pilot, PilotKPI, PilotMilestone } from '../../types/pilot';
import { useAuth } from '../../context/AuthContext';
import { RecordKPIMeasurementModal } from '../../components/pilots/RecordKPIMeasurementModal';
import { EditKPITargetModal } from '../../components/pilots/EditKPITargetModal';
import { AddKPIModal } from '../../components/pilots/AddKPIModal';
import { UpdateMilestoneModal } from '../../components/pilots/UpdateMilestoneModal';
import { AddMilestoneModal } from '../../components/pilots/AddMilestoneModal';
import { AddRiskModal } from '../../components/pilots/AddRiskModal';
import { AddIssueModal } from '../../components/pilots/AddIssueModal';
import { UploadEvidenceModal } from '../../components/pilots/UploadEvidenceModal';

export const PilotDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'milestones' | 'risks' | 'evidence' | 'audit'>('kpis');

  // Modals state
  const [activeKpiForMeasurement, setActiveKpiForMeasurement] = useState<PilotKPI | null>(null);
  const [activeKpiForEditTarget, setActiveKpiForEditTarget] = useState<PilotKPI | null>(null);
  const [activeMilestoneForUpdate, setActiveMilestoneForUpdate] = useState<PilotMilestone | null>(null);
  const [showAddKpiModal, setShowAddKpiModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showUploadEvidenceModal, setShowUploadEvidenceModal] = useState(false);
  const [selectedKpiForChart, setSelectedKpiForChart] = useState<string | 'ALL'>('ALL');
  const [viewHistoryKpi, setViewHistoryKpi] = useState<PilotKPI | null>(null);

  const isGovOrAdmin = user?.role === 'GOVERNMENT_OFFICER' || user?.role === 'ADMIN';

  const fetchPilot = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await pilotService.getPilotById(id);
      setPilot(data);
      const trail = await pilotService.getAuditTrail(id);
      setAuditTrail(trail);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pilot details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPilot();
  }, [id]);

  const handleCompletePilot = async () => {
    if (!pilot) return;
    if (
      !window.confirm(
        'Are you sure you want to complete this pilot? This will validate all completion criteria and transition status to READY FOR ASSESSMENT.'
      )
    ) {
      return;
    }

    try {
      setError(null);
      await pilotService.completePilot(pilot.id);
      fetchPilot();
      alert('Pilot project successfully completed and marked READY FOR ASSESSMENT.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Completion validation failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 text-center">
        <p className="text-red-600 font-semibold">Pilot project not found.</p>
        <button onClick={() => navigate('/pilots')} className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm">
          Return to Pilots List
        </button>
      </div>
    );
  }

  // Health Pill styling
  const healthLabel = pilot.health?.health_label || 'ON_TRACK';
  let healthBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let healthDot = 'bg-emerald-500';
  if (healthLabel === 'NEEDS_ATTENTION') {
    healthBg = 'bg-amber-50 text-amber-900 border-amber-300';
    healthDot = 'bg-amber-500';
  } else if (healthLabel === 'AT_RISK') {
    healthBg = 'bg-red-50 text-red-800 border-red-300';
    healthDot = 'bg-red-500';
  }

  // Build Recharts data series across measurements
  const chartDataMap: { [dateStr: string]: any } = {};

  pilot.kpis.forEach((kpi) => {
    (kpi.measurements || []).forEach((m) => {
      const dStr = new Date(m.measurement_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!chartDataMap[dStr]) {
        chartDataMap[dStr] = { date: dStr };
      }
      chartDataMap[dStr][kpi.name] = m.actual_value;
      chartDataMap[dStr][`${kpi.name}_Target`] = kpi.target_value;
    });
  });

  const chartData = Object.values(chartDataMap);

  const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea'];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/pilots')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Pilots Workspace
          </button>

          <span className="text-xs text-slate-400 font-mono">Pilot ID: {pilot.id}</span>
        </div>

        {/* Header Dashboard Banner */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900">{pilot.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${healthBg}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${healthDot} animate-pulse`}></span>
                  HEALTH: {healthLabel.replace(/_/g, ' ')}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  STATUS: {pilot.status.replace(/_/g, ' ')}
                </span>
              </div>

              {pilot.challenge && (
                <p className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  Department: <span className="text-slate-900 font-bold">{pilot.challenge.department_name}</span> | Challenge:{' '}
                  <span className="text-blue-700 font-semibold">{pilot.challenge.title}</span>
                </p>
              )}
              {pilot.startup && (
                <p className="text-sm text-blue-700 font-semibold flex items-center gap-1.5">
                  <Rocket className="w-4 h-4" />
                  Executing Startup: <span className="font-bold">{pilot.startup.company_name}</span> (DPIIT Reg: {pilot.startup.dpiit_number})
                </p>
              )}
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowUploadEvidenceModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" /> Upload Evidence
              </button>

              {pilot.kpis.length > 0 && (
                <button
                  onClick={() => setActiveKpiForMeasurement(pilot.kpis[0])}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Record KPI Measurement
                </button>
              )}

              {isGovOrAdmin && (pilot.status === 'READY_FOR_ASSESSMENT' || pilot.status === 'COMPLETED') && (
                <Link
                  to={`/pilots/${pilot.id}/decision`}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" /> Pilot Assessment & Decision
                </Link>
              )}

              {pilot.status === 'SCALED' && (
                <>
                  <Link
                    to="/gov/procurement"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> View Procurement Scale-Up
                  </Link>
                  <Link
                    to={`/pilots/${pilot.id}/decision`}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
                  >
                    Decision History
                  </Link>
                </>
              )}

              {pilot.status === 'EXTENDED' && (
                <Link
                  to={`/pilots/${pilot.id}/decision`}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" /> Extended Trial & Decisions
                </Link>
              )}

              {pilot.status === 'CLOSED' && (
                <Link
                  to={`/pilots/${pilot.id}/decision`}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
                >
                  View Decision Log
                </Link>
              )}

              {isGovOrAdmin && pilot.status !== 'READY_FOR_ASSESSMENT' && pilot.status !== 'COMPLETED' && pilot.status !== 'SCALED' && pilot.status !== 'CLOSED' && (
                <button
                  onClick={handleCompletePilot}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Validate & Complete Pilot
                </button>
              )}
            </div>
          </div>


          {/* Operational Health Rule Explanation Banner */}
          {pilot.health?.rules_applied && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Operational Health Rule Diagnostic: </span>
                <span className="text-slate-600">{pilot.health.rules_applied.join(' | ')}</span>
              </div>
            </div>
          )}

          {/* Overall Milestone Progress & Key Metrics Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mb-1">
                <span>Overall Milestone Completion</span>
                <span className="text-slate-900 font-mono font-bold">{pilot.overall_progress_percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, pilot.overall_progress_percentage))}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Measured KPIs</span>
                <span className="text-lg font-bold text-slate-900">
                  {pilot.health?.kpis_achieved}/{pilot.health?.kpis_total} Achieved
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                {pilot.health?.kpis_below_target ? `${pilot.health.kpis_below_target} Below` : '100% Target'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Milestones Status</span>
                <span className="text-lg font-bold text-slate-900">
                  {pilot.health?.milestones_completed}/{pilot.health?.milestones_total} Completed
                </span>
              </div>
              {pilot.health?.milestones_blocked ? (
                <span className="text-xs font-mono font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {pilot.health.milestones_blocked} Blocked
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  On Schedule
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Active Risks & Issues</span>
                <span className="text-lg font-bold text-slate-900">
                  {pilot.risks.length} Risks / {pilot.issues.length} Issues
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                {pilot.health?.risks_critical_open ? `${pilot.health.risks_critical_open} Critical` : 'Monitored'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex space-x-8 bg-white px-6 rounded-xl border shadow-sm overflow-x-auto">
          {[
            { id: 'kpis', label: 'KPI Analytics & Trends', count: pilot.kpis.length },
            { id: 'milestones', label: 'Milestone Timeline', count: pilot.milestones.length },
            { id: 'risks', label: 'Risks & Issues', count: pilot.risks.length + pilot.issues.length },
            { id: 'evidence', label: 'Evidence Gallery', count: pilot.evidence_files.length },
            { id: 'overview', label: 'Governance & Scope' },
            { id: 'audit', label: 'Audit Trail', count: auditTrail.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: KPI MONITORING & ANALYTICS */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Deterministic Numerical KPI Monitor</h2>
              {isGovOrAdmin && (
                <button
                  onClick={() => setShowAddKpiModal(true)}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  + Add KPI Baseline
                </button>
              )}
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pilot.kpis.map((kpi) => {
                const isAchieved = kpi.status === 'ACHIEVED';
                const isPending = kpi.status === 'PENDING_MEASUREMENT';

                let cardBorder = 'border-slate-200';
                let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';

                if (isAchieved) {
                  cardBorder = 'border-emerald-200 bg-emerald-50/20';
                  statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                } else if (!isPending) {
                  cardBorder = 'border-red-200 bg-red-50/20';
                  statusBadge = 'bg-red-100 text-red-800 border-red-200';
                }

                return (
                  <div key={kpi.id} className={`bg-white p-5 rounded-xl border ${cardBorder} shadow-sm space-y-3 flex flex-col justify-between`}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm">{kpi.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusBadge}`}>
                          {kpi.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2">{kpi.description}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Target:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {kpi.target_operator} {kpi.target_value} {kpi.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Latest Measurement:</span>
                          <span className={`font-mono font-bold ${isAchieved ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {kpi.latest_actual_value !== undefined && kpi.latest_actual_value !== null
                              ? `${kpi.latest_actual_value} ${kpi.unit}`
                              : 'None recorded'}
                          </span>
                        </div>
                        {kpi.latest_measurement_date && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Measured: {new Date(kpi.latest_measurement_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveKpiForMeasurement(kpi)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded border border-blue-200 transition-colors"
                      >
                        + Record
                      </button>

                      {isGovOrAdmin && (
                        <button
                          onClick={() => setActiveKpiForEditTarget(kpi)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded border border-amber-200 transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Edit Target
                        </button>
                      )}

                      {kpi.target_change_history && kpi.target_change_history.length > 0 && (
                        <button
                          onClick={() => setViewHistoryKpi(kpi)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-200"
                        >
                          <History className="w-3 h-3" /> History ({kpi.target_change_history.length})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recharts Analytics Trend Line Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> Historical Metric Trends Analytics</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Deterministic time-series comparison of recorded measurements against target baseline.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Filter KPI:</label>
                  <select
                    value={selectedKpiForChart}
                    onChange={(e) => setSelectedKpiForChart(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="ALL">All KPIs</option>
                    {pilot.kpis.map((k) => (
                      <option key={k.id} value={k.name}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No historical measurement data points recorded yet. Use "+ Record" to add measurements.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      {pilot.kpis
                        .filter((k) => selectedKpiForChart === 'ALL' || selectedKpiForChart === k.name)
                        .map((kpi, idx) => (
                          <React.Fragment key={kpi.id}>
                            <Line
                              type="monotone"
                              dataKey={kpi.name}
                              stroke={colors[idx % colors.length]}
                              strokeWidth={3}
                              dot={{ r: 5 }}
                              name={`${kpi.name} (Actual)`}
                            />
                            <Line
                              type="stepAfter"
                              dataKey={`${kpi.name}_Target`}
                              stroke={colors[idx % colors.length]}
                              strokeDasharray="5 5"
                              strokeWidth={1.5}
                              dot={false}
                              name={`${kpi.name} (Target ${kpi.target_operator} ${kpi.target_value})`}
                            />
                          </React.Fragment>
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MILESTONE TIMELINE */}
        {activeTab === 'milestones' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Roadmap & Milestone Progression</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track planned start/end dates, execution percentage, and mandatory blocked reasons.
                </p>
              </div>

              {isGovOrAdmin && (
                <button
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  + Add Milestone Phase
                </button>
              )}
            </div>

            <div className="space-y-4">
              {pilot.milestones.map((m, idx) => {
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                if (m.status === 'COMPLETED') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                else if (m.status === 'IN_PROGRESS') badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                else if (m.status === 'BLOCKED') badgeClass = 'bg-red-100 text-red-800 border-red-200';

                return (
                  <div key={m.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">{m.name}</h3>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                          {m.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveMilestoneForUpdate(m)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto"
                      >
                        <Pencil className="w-3 h-3" /> Update Status / Progress
                      </button>
                    </div>

                    {m.description && <p className="text-xs text-slate-600 pl-10">{m.description}</p>}

                    <div className="pl-10 space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                        <span>
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          Planned: {new Date(m.planned_start).toLocaleDateString()} to{' '}
                          {new Date(m.planned_end).toLocaleDateString()}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{m.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, m.completion_percentage))}%` }}
                        ></div>
                      </div>

                      {m.blocked_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium mt-2">
                          <strong>Blocked Reason:</strong> {m.blocked_reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RISKS & ISSUES */}
        {activeTab === 'risks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Matrix */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Operational Risk Matrix</h2>
                <button
                  onClick={() => setShowAddRiskModal(true)}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  + Register Risk
                </button>
              </div>

              {pilot.risks.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No active risks registered.</p>
              ) : (
                <div className="space-y-3">
                  {pilot.risks.map((risk) => (
                    <div key={risk.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{risk.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                          {risk.severity} ({risk.category})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{risk.description}</p>
                      {risk.mitigation && (
                        <div className="p-2 bg-white rounded border border-slate-200 text-xs text-slate-700">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                        <span>Owner: {risk.owner_name}</span>
                        <span>Status: {risk.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Issue Tracker */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Operational Issue Log</h2>
                <button
                  onClick={() => setShowAddIssueModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  + Report Issue
                </button>
              </div>

              {pilot.issues.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No open operational issues.</p>
              ) : (
                <div className="space-y-3">
                  {pilot.issues.map((issue) => (
                    <div key={issue.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{issue.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{issue.description}</p>
                      <div className="text-[10px] text-slate-400 font-medium flex justify-between">
                        <span>Assigned to: {issue.assigned_to_name}</span>
                        <span>Reported: {new Date(issue.reported_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EVIDENCE GALLERY */}
        {activeTab === 'evidence' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pilot Test Artifacts & Verification Documents</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded audit reports, test certificates, and telemetry data files.
                </p>
              </div>

              <button
                onClick={() => setShowUploadEvidenceModal(true)}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                + Upload Evidence Document
              </button>
            </div>

            {pilot.evidence_files.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No evidence files uploaded yet. Upload calibration certificates or test reports.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pilot.evidence_files.map((ev) => (
                  <div key={ev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                        <FileCheck className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{ev.file_name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(ev.file_size / 1024).toFixed(1)} KB | {ev.file_type}
                        </span>
                      </div>
                    </div>

                    {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Uploaded by {ev.uploaded_by_name}</span>
                      <span className="font-mono">{new Date(ev.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GOVERNANCE & SCOPE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Detailed Scope & Objectives
              </h2>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objective</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {pilot.objective}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Field Scope</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {pilot.scope}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Success Criteria</h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {pilot.success_criteria || 'None specified.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Team & Compliance Notes
              </h2>

              {pilot.government_team_notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Government Team Notes
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {pilot.government_team_notes}
                  </p>
                </div>
              )}

              {pilot.security_requirements && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Security Requirements
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {pilot.security_requirements}
                  </p>
                </div>
              )}

              {pilot.ip_notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">IP & Ownership</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {pilot.ip_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2"><ScrollText className="w-5 h-5 text-blue-600" /> Governance Audit Trail</span>
            </h2>

            <div className="space-y-3">
              {auditTrail.map((ev, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-700">{ev.action}</span>
                    <p className="text-slate-800 mt-0.5">{ev.summary}</p>
                    <span className="text-[10px] text-slate-400 font-medium">Actor: {ev.actor_name} ({ev.actor_role})</span>
                  </div>
                  <span className="font-mono text-slate-400">{new Date(ev.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target History Modal */}
        {viewHistoryKpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Target Modification Audit History</h3>
                <button onClick={() => setViewHistoryKpi(null)} className="text-slate-400 hover:text-slate-900 font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(viewHistoryKpi.target_change_history || []).map((h, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Changed Target: {h.previous_target} → {h.new_target}</span>
                      <span className="font-mono text-[10px] text-amber-700">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-amber-800 font-medium">Justification: "{h.reason}"</p>
                    <span className="text-[10px] text-amber-600 block">Modified by: {h.modified_by_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {activeKpiForMeasurement && (
          <RecordKPIMeasurementModal
            pilotId={pilot.id}
            kpi={activeKpiForMeasurement}
            isOpen={!!activeKpiForMeasurement}
            onClose={() => setActiveKpiForMeasurement(null)}
            onSuccess={fetchPilot}
          />
        )}

        {activeKpiForEditTarget && (
          <EditKPITargetModal
            pilotId={pilot.id}
            kpi={activeKpiForEditTarget}
            isOpen={!!activeKpiForEditTarget}
            onClose={() => setActiveKpiForEditTarget(null)}
            onSuccess={fetchPilot}
          />
        )}

        {showAddKpiModal && (
          <AddKPIModal
            pilotId={pilot.id}
            isOpen={showAddKpiModal}
            onClose={() => setShowAddKpiModal(false)}
            onSuccess={fetchPilot}
          />
        )}

        {activeMilestoneForUpdate && (
          <UpdateMilestoneModal
            pilotId={pilot.id}
            milestone={activeMilestoneForUpdate}
            isOpen={!!activeMilestoneForUpdate}
            onClose={() => setActiveMilestoneForUpdate(null)}
            onSuccess={fetchPilot}
          />
        )}

        {showAddMilestoneModal && (
          <AddMilestoneModal
            pilotId={pilot.id}
            isOpen={showAddMilestoneModal}
            onClose={() => setShowAddMilestoneModal(false)}
            onSuccess={fetchPilot}
          />
        )}

        {showAddRiskModal && (
          <AddRiskModal
            pilotId={pilot.id}
            isOpen={showAddRiskModal}
            onClose={() => setShowAddRiskModal(false)}
            onSuccess={fetchPilot}
          />
        )}

        {showAddIssueModal && (
          <AddIssueModal
            pilotId={pilot.id}
            isOpen={showAddIssueModal}
            onClose={() => setShowAddIssueModal(false)}
            onSuccess={fetchPilot}
          />
        )}

        {showUploadEvidenceModal && (
          <UploadEvidenceModal
            pilotId={pilot.id}
            isOpen={showUploadEvidenceModal}
            onClose={() => setShowUploadEvidenceModal(false)}
            onSuccess={fetchPilot}
          />
        )}
      </div>
    </div>
  );
};
