import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { procurementService } from '@/services/procurementService';
import type {
  ProcurementScaleUp,
  ProcurementScaleUpUpdateInput,
  ScaleUpStatus,
} from '@/types';
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  Building,
  Search,
  Filter,
  ArrowUpRight,
  RotateCw,
  DollarSign,
  FileCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function ProcurementScaleUpPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProcurementScaleUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ScaleUpStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Update Status Modal
  const [activeProject, setActiveProject] = useState<ProcurementScaleUp | null>(null);
  const [newStatus, setNewStatus] = useState<ScaleUpStatus>('READY_FOR_PROCUREMENT');
  const [budgetAllocation, setBudgetAllocation] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [procurementNotes, setProcurementNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const isGovOrAdmin = user?.role === 'GOVERNMENT_OFFICER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await procurementService.getScaleUpProjects({
        status_filter: statusFilter,
      });
      setProjects(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load procurement scale-up projects.');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (project: ProcurementScaleUp) => {
    setActiveProject(project);
    setNewStatus(project.status);
    setBudgetAllocation(project.budget_allocation ? String(project.budget_allocation) : '');
    setTargetDate(
      project.target_completion_date
        ? new Date(project.target_completion_date).toISOString().split('T')[0]
        : ''
    );
    setProcurementNotes(project.procurement_notes || '');
    setUpdateError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    try {
      setUpdating(true);
      setUpdateError(null);

      const payload: ProcurementScaleUpUpdateInput = {
        status: newStatus,
        budget_allocation: budgetAllocation ? parseFloat(budgetAllocation) : null,
        target_completion_date: targetDate ? new Date(targetDate).toISOString() : null,
        procurement_notes: procurementNotes.trim() || null,
      };

      await procurementService.updateScaleUpProject(activeProject.id, payload);
      await loadProjects();
      setActiveProject(null);
    } catch (err: any) {
      setUpdateError(err?.message || 'Failed to update scale-up project.');
    } finally {
      setUpdating(false);
    }
  };

  // Filtered by search
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.solution_name.toLowerCase().includes(q) ||
      (p.startup?.company_name || '').toLowerCase().includes(q) ||
      (p.challenge?.title || '').toLowerCase().includes(q)
    );
  });

  // Metrics
  const totalCount = projects.length;
  const readyCount = projects.filter((p) => p.status === 'READY_FOR_PROCUREMENT').length;
  const inProgressCount = projects.filter((p) => p.status === 'PROCUREMENT_IN_PROGRESS').length;
  const scaledCount = projects.filter((p) => p.status === 'SCALED').length;

  const statusBadge = (st: ScaleUpStatus) => {
    switch (st) {
      case 'READY_FOR_PROCUREMENT':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          label: 'Ready for Procurement',
          icon: Clock,
        };
      case 'PROCUREMENT_IN_PROGRESS':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Procurement In Progress',
          icon: TrendingUp,
        };
      case 'SCALED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Scaled & Procured',
          icon: CheckCircle2,
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          label: st,
          icon: FileCheck,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-300" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  Public Procurement & Scale-Up Management
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Transition board for successfully validated innovation pilots moving into public procurement.
              </p>
            </div>

            <button
              onClick={loadProjects}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Total Scale-Up Solutions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{totalCount}</span>
              <span className="text-xs text-slate-400">active</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Ready for Procurement</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 font-mono">{readyCount}</span>
              <span className="text-xs text-blue-500">pending tender</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 block mb-1">In Progress</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700 font-mono">{inProgressCount}</span>
              <span className="text-xs text-amber-600">tendering</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Scaled & Procured</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">{scaledCount}</span>
              <span className="text-xs text-emerald-600">completed</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search solutions, startups, or challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY_FOR_PROCUREMENT">Ready for Procurement</option>
              <option value="PROCUREMENT_IN_PROGRESS">Procurement In Progress</option>
              <option value="SCALED">Scaled & Procured</option>
            </select>
          </div>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-800 mb-2" />
            Loading scale-up solutions...
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-xl border border-red-200 text-center text-xs text-red-600 space-y-2">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Scaled Solutions Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a completed pilot is evaluated and approved for <strong className="text-slate-700">SCALE</strong> by
              the government officer, it will appear here for public procurement and scale-up tracking.
            </p>
            <Link
              to="/gov/pilots"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Go to Pilots
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const badge = statusBadge(project.status);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base font-extrabold text-slate-900">{project.solution_name}</h2>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sponsoring Challenge: <span className="font-bold text-slate-700">{project.challenge?.title}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isGovOrAdmin && (
                        <button
                          onClick={() => openUpdateModal(project)}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          Update Status
                        </button>
                      )}
                      <Link
                        to={`/pilots/${project.pilot_id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        View Pilot <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Startup & Outcome Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Selected Startup
                      </span>
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-blue-700" />
                        {project.startup?.company_name}
                      </p>
                      <p className="text-slate-500 text-[11px]">DPIIT: {project.startup?.dpiit_number || 'N/A'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Budget Allocation & Timeline
                      </span>
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                        {project.budget_allocation ? `₹ ${project.budget_allocation.toLocaleString()}` : 'Pending Allocation'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Target Date:{' '}
                        {project.target_completion_date
                          ? new Date(project.target_completion_date).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Approved Scale Scope
                      </span>
                      <p className="text-slate-700 font-medium line-clamp-2">{project.proposed_scale_scope}</p>
                    </div>
                  </div>

                  {/* Approved KPIs Badges */}
                  {project.approved_kpis?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                        Approved Pilot KPI Benchmarks
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {project.approved_kpis.map((kpi, idx) => (
                          <div
                            key={idx}
                            className="px-2.5 py-1 bg-slate-50 rounded-md border border-slate-200 text-xs flex items-center gap-1.5"
                          >
                            <span className="font-bold text-slate-800">{kpi.name}:</span>
                            <span className="font-mono text-emerald-700 font-bold">{kpi.achieved}</span>
                            <span className="text-slate-400 text-[11px]">({kpi.target})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Procurement Notes if any */}
                  {project.procurement_notes && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900">Procurement Notes: </strong>
                      {project.procurement_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {activeProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase">Scale-Up Stage Transition</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeProject.solution_name}</h3>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {updateError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠️ {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Procurement Stage Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="READY_FOR_PROCUREMENT">Ready for Procurement (Tender Drafting)</option>
                  <option value="PROCUREMENT_IN_PROGRESS">Procurement In Progress (GeM Bid Published)</option>
                  <option value="SCALED">Scaled & Procured (Contract Awarded)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Allocated Budget (₹)</label>
                  <input
                    type="number"
                    step="10000"
                    placeholder="e.g. 7500000"
                    value={budgetAllocation}
                    onChange={(e) => setBudgetAllocation(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Target Rollout Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Procurement Stage Notes / GeM Reference</label>
                <textarea
                  rows={3}
                  placeholder="Record tender reference number, GeM bid ID, or committee review notes..."
                  value={procurementNotes}
                  onChange={(e) => setProcurementNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-sm"
                >
                  {updating ? 'Saving...' : 'Update Procurement Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
