import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Filter,
  Search,
  Award,
  UserCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProposals } from '../../services/proposalService';
import type { Proposal, ProposalStatus } from '../../types/proposal';
import { AssignEvaluatorsModal } from '../../components/proposals/AssignEvaluatorsModal';
import { ShortlistModal } from '../../components/proposals/ShortlistModal';

export const ProposalListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeIdParam = searchParams.get('challenge_id') || undefined;

  const { user } = useAuth();
  const isOfficer = user?.role === 'GOVERNMENT_OFFICER' || user?.role === 'ADMIN';
  const isEvaluator = user?.role === 'EVALUATOR';

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [assignModalProposal, setAssignModalProposal] = useState<Proposal | null>(null);
  const [shortlistModalProposal, setShortlistModalProposal] = useState<Proposal | null>(null);

  const fetchProposalsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProposals({
        challengeId: challengeIdParam,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setProposals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposalsData();
  }, [challengeIdParam, statusFilter]);

  const filteredProposals = proposals.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.startup?.company_name ?? '').toLowerCase().includes(q) ||
      (p.challenge?.title ?? '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'SHORTLISTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shortlisted</span>
          </span>
        );
      case 'NOT_SHORTLISTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span>Not Shortlisted</span>
          </span>
        );
      case 'EVALUATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Evaluated</span>
          </span>
        );
      case 'EVALUATION_IN_PROGRESS':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Under Review</span>
          </span>
        );
      case 'AI_ANALYSIS_READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Ready</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title & Scoped Role Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Proposal Management Workspace</h1>
            <p className="text-sm text-slate-600 mt-1">
              Review confidential startup submissions, AI fact extraction, human evaluation scores, and governance shortlisting.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by proposal or startup..."
              className="w-full text-sm pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-sm p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="EVALUATED">Evaluated</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="NOT_SHORTLISTED">Not Shortlisted</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Proposals List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
            Loading proposals workspace...
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No Proposals Found</h3>
            <p className="text-sm text-slate-500 mt-1">There are no proposals matching your current filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-indigo-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(proposal.status)}
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        ₹{((proposal.estimated_cost ?? 0) / 100000).toFixed(2)} Lakhs
                      </span>
                      <span className="text-xs text-slate-500">
                        Duration: {proposal.implementation_duration_days} days
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/proposals/${proposal.id}`)}
                      className="text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {proposal.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      {proposal.startup && (
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{proposal.startup.company_name}</span>
                          <span className="text-slate-400">({proposal.startup.dpiit_number})</span>
                        </div>
                      )}
                      {proposal.challenge && (
                        <div className="text-slate-500">
                          Challenge: <span className="text-slate-700 font-medium">{proposal.challenge.title}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2">{proposal.executive_summary}</p>
                  </div>

                  {/* Right Score & Actions Panel */}
                  <div className="flex flex-col items-start md:items-end justify-between gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                    {proposal.average_evaluation_score != null && (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Evaluation Score</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {proposal.average_evaluation_score.toFixed(1)} / 100
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Officer Assign Evaluators Action */}
                      {isOfficer && (
                        <button
                          onClick={() => setAssignModalProposal(proposal)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign Evaluators</span>
                        </button>
                      )}

                      {/* Evaluator Score Action */}
                      {(isEvaluator || isOfficer) && (
                        <button
                          onClick={() => navigate(`/proposals/${proposal.id}/evaluate`)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Evaluate Score</span>
                        </button>
                      )}

                      {/* Officer Shortlist Action */}
                      {isOfficer && (
                        <button
                          onClick={() => setShortlistModalProposal(proposal)}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Shortlist</span>
                        </button>
                      )}

                      {/* View Detail Action */}
                      <button
                        onClick={() => navigate(`/proposals/${proposal.id}`)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>View Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {assignModalProposal && (
        <AssignEvaluatorsModal
          proposalId={assignModalProposal.id}
          proposalTitle={assignModalProposal.title}
          currentEvaluatorIds={assignModalProposal.assigned_evaluator_ids}
          isOpen={!!assignModalProposal}
          onClose={() => setAssignModalProposal(null)}
          onSuccess={fetchProposalsData}
        />
      )}

      {shortlistModalProposal && (
        <ShortlistModal
          proposalId={shortlistModalProposal.id}
          proposalTitle={shortlistModalProposal.title}
          startupName={shortlistModalProposal.startup?.company_name || 'Startup'}
          isOpen={!!shortlistModalProposal}
          onClose={() => setShortlistModalProposal(null)}
          onSuccess={fetchProposalsData}
        />
      )}
    </div>
  );
};
