import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
  Calendar,
  IndianRupee,
  Users,
  Shield,
  Activity,
  ArrowLeft,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getProposalById,
  getProposalAuditTrail,
  getDocumentDownloadUrl,
} from '../../services/proposalService';
import type { Proposal, AuditEventItem } from '../../types/proposal';
import { AssignEvaluatorsModal } from '../../components/proposals/AssignEvaluatorsModal';
import { ShortlistModal } from '../../components/proposals/ShortlistModal';

export const ProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOfficer = user?.role === 'GOVERNMENT_OFFICER' || user?.role === 'ADMIN';
  const isEvaluator = user?.role === 'EVALUATOR';

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ai_facts' | 'evaluations' | 'audit'>('ai_facts');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getProposalById(id);
      setProposal(data);

      const history = await getProposalAuditTrail(id).catch(() => []);
      setAuditTrail(history);
    } catch (err: any) {
      setError(err.message || 'Failed to load proposal details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-slate-600 font-medium">Loading proposal details...</div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-bold">Proposal Load Error</h3>
          <p className="text-sm mt-1">{error || 'Proposal not found.'}</p>
          <button
            onClick={() => navigate('/proposals')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  const analysis = proposal.analysis;
  const evaluations = proposal.evaluations || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/proposals')}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Proposals List
          </button>

          {/* Quick Officer Actions */}
          <div className="flex items-center gap-2">
            {isOfficer && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Assign Evaluators</span>
                </button>

                <button
                  onClick={() => setShowShortlistModal(true)}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>Officer Shortlist Decision</span>
                </button>

                <button
                  onClick={() => navigate(`/proposals/${proposal.id}/create-pilot`)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>🚀 Launch Pilot Project</span>
                </button>
              </>
            )}
            {(isEvaluator || isOfficer) && (
              <button
                onClick={() => navigate(`/proposals/${proposal.id}/evaluate`)}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Evaluate Proposal</span>
              </button>
            )}
          </div>
        </div>

        {/* Proposal Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white">
                  Status: {proposal.status}
                </span>
                {proposal.average_evaluation_score != null && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Score: {proposal.average_evaluation_score.toFixed(1)} / 100
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{proposal.title}</h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                {proposal.startup && (
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>{proposal.startup.company_name}</span>
                    <span className="text-xs text-slate-400">({proposal.startup.dpiit_number})</span>
                  </div>
                )}
                {proposal.challenge && (
                  <div className="text-slate-600">
                    Challenge: <span className="font-semibold text-slate-800">{proposal.challenge.title}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 max-w-4xl">{proposal.executive_summary}</p>
            </div>

            {/* Cost Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shrink-0 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financial & Timeline</div>
              <div className="text-2xl font-bold text-slate-900 flex items-center">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <span>{((proposal.estimated_cost ?? 0) / 100000).toFixed(2)} Lakhs</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{proposal.implementation_duration_days} Days Execution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Bar */}
        {proposal.document && (
          <div className="bg-indigo-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-800 flex items-center justify-center text-indigo-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{proposal.document.file_name}</p>
                <p className="text-xs text-indigo-200">
                  {(proposal.document.file_size / (1024 * 1024)).toFixed(2)} MB • Checksum (SHA-256):{' '}
                  <code className="font-mono bg-indigo-950 px-1 py-0.5 rounded text-indigo-300">
                    {proposal.document.checksum.substring(0, 12)}...
                  </code>
                </p>
              </div>
            </div>

            <a
              href={getDocumentDownloadUrl(proposal.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('ai_facts')}
              className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'ai_facts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Extracted Facts & Traceability</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluations')}
              className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'evaluations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Human Evaluation Workspace ({evaluations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Governance Audit Trail ({auditTrail.length})</span>
            </button>
          </nav>
        </div>

        {/* Tab 1: AI Extracted Facts */}
        {activeTab === 'ai_facts' && (
          <div className="space-y-6">
            {!analysis || analysis.analysis_status !== 'ANALYSIS_READY' ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                AI Document Fact Extraction is being processed...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Technical Solution Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Technical Solution Summary</span>
                    </div>
                    {analysis.source_traceability.solution_summary && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Source: {analysis.source_traceability.solution_summary}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.solution_summary}</p>
                </div>

                {/* Tech Stack */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Core Tech Stack</span>
                    </div>
                    {analysis.source_traceability.technologies && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Source: {analysis.source_traceability.technologies}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.technologies.map((t, idx) => (
                      <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Architecture */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span>System Architecture</span>
                    </div>
                    {analysis.source_traceability.architecture_summary && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Source: {analysis.source_traceability.architecture_summary}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.architecture_summary}</p>
                </div>

                {/* Budget Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <span>Financial & Budget Breakdown</span>
                    </div>
                    {analysis.source_traceability.budget_summary && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Source: {analysis.source_traceability.budget_summary}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.budget_summary}</p>
                </div>

                {/* Security & Compliance */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Lock className="w-4 h-4 text-slate-700" />
                      <span>Data Privacy & Security</span>
                    </div>
                    {analysis.source_traceability.security_measures && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        Source: {analysis.source_traceability.security_measures}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.security_measures}</p>
                </div>

                {/* Past Deployments & Team */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Previous Deployments & Team</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.previous_deployments}</p>
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">{analysis.team_summary}</p>
                </div>

                {/* Risks & Mitigation */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Identified Technical Risks & Mitigation Measures</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {analysis.risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Human Evaluation Workspace */}
        {activeTab === 'evaluations' && (
          <div className="space-y-6">
            {evaluations.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                No human evaluations have been submitted yet.
              </div>
            ) : (
              evaluations.map((ev) => (
                <div key={ev.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{ev.evaluator_name}</h3>
                      <p className="text-xs text-slate-500">Submitted: {new Date(ev.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Weighted Total</span>
                      <span className="text-2xl font-bold text-emerald-600">{(ev.total_weighted_score ?? 0).toFixed(1)} / 100</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Criteria Breakdown</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {ev.criterion_scores.map((sc, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{sc.criterion_name}</p>
                            {sc.comment && <p className="text-xs text-slate-600 mt-0.5">{sc.comment}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-slate-900">{sc.score} / {sc.max_score}</span>
                            <span className="text-xs text-slate-500 block">Weight: {sc.weight}% → {sc.weighted_score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ev.general_comments && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">General Evaluator Feedback</p>
                      <p className="text-sm text-slate-700 italic">"{ev.general_comments}"</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Governance Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Governance & Workflow Audit Log</h3>
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {auditTrail.map((ev) => (
                <div key={ev.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white" />
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-900">{ev.actor_name} ({ev.actor_role})</span>
                    <span>{new Date(ev.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{ev.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignEvaluatorsModal
          proposalId={proposal.id}
          proposalTitle={proposal.title}
          currentEvaluatorIds={proposal.assigned_evaluator_ids}
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={loadData}
        />
      )}

      {showShortlistModal && (
        <ShortlistModal
          proposalId={proposal.id}
          proposalTitle={proposal.title}
          startupName={proposal.startup?.company_name || 'Startup'}
          isOpen={showShortlistModal}
          onClose={() => setShowShortlistModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
