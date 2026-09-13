import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Zap,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Building,
  Rocket,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { pilotService } from '../../services/pilotService';
import type { Pilot } from '../../types/pilot';
import { useAuth } from '../../context/AuthContext';

export const PilotListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isGovOrAdmin = user?.role === 'GOVERNMENT_OFFICER' || user?.role === 'ADMIN';

  const fetchPilots = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status_filter = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await pilotService.getPilots(params);
      setPilots(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pilot projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPilots();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPilots();
  };

  // Stats calculation
  const totalPilots = pilots.length;
  const activePilots = pilots.filter((p) => p.status === 'ACTIVE').length;
  const onTrackPilots = pilots.filter((p) => p.health?.health_label === 'ON_TRACK').length;
  const atRiskPilots = pilots.filter((p) => p.health?.health_label === 'AT_RISK').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-blue-700" />
              <span>Pilot Project Management & Analytics</span>
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Track live pilot milestones, deterministic KPI metrics, operational risks, and performance health across government challenges.
            </p>
          </div>

          {isGovOrAdmin && (
            <button
              onClick={() => navigate('/proposals')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <span>+ Initiate Pilot from Proposal</span>
            </button>
          )}
        </div>

        {/* Operational Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pilots</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalPilots}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-700" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Execution</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{activePilots}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-700" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">On Track</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{onTrackPilots}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-700" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">At Risk / Needs Attention</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{atRiskPilots}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search pilot by title, objective, or scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Status Filter:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="READY_FOR_ASSESSMENT">Ready for Assessment</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
          </div>
        ) : pilots.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-4">
            <p className="text-slate-500 text-lg">No pilot projects found matching your criteria.</p>
            {isGovOrAdmin && (
              <button
                onClick={() => navigate('/proposals')}
                className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
              >
                Go to Proposals & Shortlist a Startup
              </button>
            )}
          </div>
        ) : (
          /* Pilot Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pilots.map((pilot) => {
              const healthLabel = pilot.health?.health_label || 'ON_TRACK';
              let healthBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              let healthDot = 'bg-emerald-500';
              if (healthLabel === 'NEEDS_ATTENTION') {
                healthBg = 'bg-amber-50 text-amber-800 border-amber-200';
                healthDot = 'bg-amber-500';
              } else if (healthLabel === 'AT_RISK') {
                healthBg = 'bg-red-50 text-red-700 border-red-200';
                healthDot = 'bg-red-500';
              }

              return (
                <div
                  key={pilot.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${healthBg}`}>
                        <span className={`w-2 h-2 rounded-full ${healthDot}`}></span>
                        {healthLabel.replace('_', ' ')}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {pilot.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Title & Department */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-blue-700 transition-colors">
                        <Link to={`/pilots/${pilot.id}`}>{pilot.name}</Link>
                      </h3>
                      {pilot.challenge && (
                        <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {pilot.challenge.department_name || 'Government Department'}
                        </p>
                      )}
                      {pilot.startup && (
                        <p className="text-xs text-blue-700 font-semibold mt-0.5 flex items-center gap-1">
                          <Rocket className="w-3 h-3" />
                          Startup: {pilot.startup.company_name} (DPIIT: {pilot.startup.dpiit_number})
                        </p>
                      )}
                    </div>

                    {/* Overall Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-medium">
                        <span>Milestone Progress</span>
                        <span className="font-mono font-bold text-slate-900">
                          {pilot.overall_progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, pilot.overall_progress_percentage))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Key Metrics Quick Pill Summary */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">KPIs</span>
                        <span className="text-xs font-bold text-slate-800">
                          {pilot.health?.kpis_achieved}/{pilot.health?.kpis_total} Achieved
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Milestones</span>
                        <span className="text-xs font-bold text-slate-800">
                          {pilot.health?.milestones_completed}/{pilot.health?.milestones_total} Done
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Risks</span>
                        <span className={`text-xs font-bold ${pilot.health?.risks_critical_open ? 'text-red-600' : 'text-slate-800'}`}>
                          {pilot.health?.risks_critical_open || 0} Critical
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-slate-400" />
                      {new Date(pilot.start_date).toLocaleDateString()} - {new Date(pilot.end_date).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/pilots/${pilot.id}`}
                      className="text-blue-700 font-semibold hover:text-blue-900 transition-colors flex items-center gap-1"
                    >
                      View Dashboard <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
