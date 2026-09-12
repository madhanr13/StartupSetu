import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProposalById } from '../../services/proposalService';
import { pilotService } from '../../services/pilotService';
import type { Proposal } from '../../types/proposal';
import type { TargetOperator } from '../../types/pilot';

export const PilotCreatePage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [scope, setScope] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [governmentTeamNotes, _setGovernmentTeamNotes] = useState('');
  const [startupTeamNotes, _setStartupTeamNotes] = useState('');
  const [dataAccessNotes, setDataAccessNotes] = useState('');
  const [securityRequirements, setSecurityRequirements] = useState('');

  // Initial Milestones & KPIs
  const [initialMilestones, setInitialMilestones] = useState<
    { name: string; description: string; planned_start: string; planned_end: string }[]
  >([
    {
      name: 'Phase 1 Hardware & Software Onboarding',
      description: 'Setup initial deployment environment and test system connectivity.',
      planned_start: new Date().toISOString().split('T')[0],
      planned_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      name: 'Phase 2 Field Testing & Telemetry Audit',
      description: 'Run live operational field tests and measure initial baseline metrics.',
      planned_start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      planned_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ]);

  const [initialKPIs, setInitialKPIs] = useState<
    {
      name: string;
      description: string;
      target_value: number;
      target_operator: TargetOperator;
      unit: string;
      measurement_method: string;
      frequency: string;
      weight: number;
    }[]
  >([
    {
      name: 'Operational Accuracy Rate',
      description: 'Target accuracy percentage verified during field audit.',
      target_value: 90.0,
      target_operator: '>=',
      unit: '%',
      measurement_method: 'Weekly random audit sample by government engineering lead.',
      frequency: 'Weekly',
      weight: 0.5,
    },
  ]);

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetail();
    }
  }, [proposalId]);

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProposalById(proposalId!);
      setProposal(data);

      // Auto pre-fill
      setName(`${data.startup?.company_name || 'Startup'} Pilot — ${data.challenge?.title || 'Challenge'}`);
      setObjective(data.executive_summary || '');
      setScope(`90-Day field pilot for ${data.title}`);
      if (data.analysis?.expected_outcomes) {
        setSuccessCriteria(data.analysis.expected_outcomes.join('; '));
      }
      if (data.analysis?.security_measures) {
        setSecurityRequirements(data.analysis.security_measures);
      }
      if (data.analysis?.data_requirements) {
        setDataAccessNotes(data.analysis.data_requirements);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load proposal detail.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestoneRow = () => {
    setInitialMilestones([
      ...initialMilestones,
      {
        name: '',
        description: '',
        planned_start: new Date().toISOString().split('T')[0],
        planned_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]);
  };

  const handleAddKPIRow = () => {
    setInitialKPIs([
      ...initialKPIs,
      {
        name: '',
        description: '',
        target_value: 100,
        target_operator: '>=',
        unit: '%',
        measurement_method: 'Weekly audit',
        frequency: 'Weekly',
        weight: 1.0,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId) return;

    try {
      setSubmitting(true);
      setError(null);

      const pilot = await pilotService.createPilot({
        proposal_id: proposalId,
        name: name.trim(),
        objective: objective.trim(),
        scope: scope.trim(),
        success_criteria: successCriteria.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        government_team_notes: governmentTeamNotes.trim(),
        startup_team_notes: startupTeamNotes.trim(),
        data_access_notes: dataAccessNotes.trim(),
        security_requirements: securityRequirements.trim(),
        initial_milestones: initialMilestones
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            description: m.description.trim(),
            planned_start: new Date(m.planned_start).toISOString(),
            planned_end: new Date(m.planned_end).toISOString(),
          })),
        initial_kpis: initialKPIs
          .filter((k) => k.name.trim())
          .map((k) => ({
            name: k.name.trim(),
            description: k.description.trim(),
            target_value: k.target_value,
            target_operator: k.target_operator,
            unit: k.unit.trim(),
            measurement_method: k.measurement_method.trim(),
            frequency: k.frequency,
            weight: k.weight,
          })),
      });

      navigate(`/pilots/${pilot.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initiate pilot project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">🚀 Initiate New Pilot Project</h1>
            {proposal && (
              <p className="text-slate-600 text-sm mt-1">
                Linked to Proposal: <span className="font-semibold text-slate-800">{proposal.title}</span> (Startup: {proposal.startup?.company_name})
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Basic Pilot Governance & Scope
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pilot Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pilot Objective <span className="text-red-500">*</span>
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Field Scope & Boundaries <span className="text-red-500">*</span>
              </label>
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                rows={2}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Success Criteria
              </label>
              <textarea
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Initial Milestones */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                2. Initial Milestone Roadmap
              </h2>
              <button
                type="button"
                onClick={handleAddMilestoneRow}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                + Add Milestone
              </button>
            </div>

            {initialMilestones.map((m, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Milestone #{idx + 1}</span>
                  {initialMilestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInitialMilestones(initialMilestones.filter((_, i) => i !== idx))}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Milestone title..."
                  value={m.name}
                  onChange={(e) => {
                    const copy = [...initialMilestones];
                    copy[idx].name = e.target.value;
                    setInitialMilestones(copy);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={m.planned_start}
                    onChange={(e) => {
                      const copy = [...initialMilestones];
                      copy[idx].planned_start = e.target.value;
                      setInitialMilestones(copy);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none"
                  />
                  <input
                    type="date"
                    value={m.planned_end}
                    onChange={(e) => {
                      const copy = [...initialMilestones];
                      copy[idx].planned_end = e.target.value;
                      setInitialMilestones(copy);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Initial KPIs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                3. Deterministic Performance KPIs
              </h2>
              <button
                type="button"
                onClick={handleAddKPIRow}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                + Add KPI
              </button>
            </div>

            {initialKPIs.map((k, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">KPI #{idx + 1}</span>
                  {initialKPIs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInitialKPIs(initialKPIs.filter((_, i) => i !== idx))}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="KPI name..."
                    value={k.name}
                    onChange={(e) => {
                      const copy = [...initialKPIs];
                      copy[idx].name = e.target.value;
                      setInitialKPIs(copy);
                    }}
                    className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none"
                  />
                  <select
                    value={k.target_operator}
                    onChange={(e) => {
                      const copy = [...initialKPIs];
                      copy[idx].target_operator = e.target.value as TargetOperator;
                      setInitialKPIs(copy);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  >
                    <option value=">=">&gt;= (Greater or Equal)</option>
                    <option value="<=">&lt;= (Less or Equal)</option>
                    <option value="=">= (Equal)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder="Target value..."
                    value={k.target_value}
                    onChange={(e) => {
                      const copy = [...initialKPIs];
                      copy[idx].target_value = Number(e.target.value);
                      setInitialKPIs(copy);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. %, s)..."
                    value={k.unit}
                    onChange={(e) => {
                      const copy = [...initialKPIs];
                      copy[idx].unit = e.target.value;
                      setInitialKPIs(copy);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <select
                    value={k.frequency}
                    onChange={(e) => {
                      const copy = [...initialKPIs];
                      copy[idx].frequency = e.target.value;
                      setInitialKPIs(copy);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating Pilot Project...' : 'Launch Pilot Project 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
