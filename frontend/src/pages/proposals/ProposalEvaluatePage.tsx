import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, AlertCircle, Building, Loader2 } from 'lucide-react';
import { getProposalById, submitEvaluation } from '../../services/proposalService';
import type { Proposal } from '../../types/proposal';
import { apiRequest } from '../../services/api';
import type { Challenge } from '../../types';

export const ProposalEvaluatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  // Scores map: criterion_id -> { score: number, comment: string }
  const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [generalComments, setGeneralComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const pData = await getProposalById(id);
        setProposal(pData);

        if (pData.challenge_id) {
          const cData = await apiRequest<Challenge>(`/challenges/${pData.challenge_id}`);
          setChallenge(cData);

          // Initialize default scores map for each criterion
          const initialMap: Record<string, { score: number; comment: string }> = {};
          (cData.evaluationCriteria || []).forEach((crit, idx) => {
            const critKey = crit.id || `crit-${idx}`;
            initialMap[critKey] = { score: 8, comment: '' };
          });
          setScores(initialMap);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load evaluation workspace.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleScoreChange = (critId: string, scoreVal: number) => {
    setScores((prev) => ({
      ...prev,
      [critId]: { ...prev[critId], score: scoreVal },
    }));
  };

  const handleCommentChange = (critId: string, commentVal: string) => {
    setScores((prev) => ({
      ...prev,
      [critId]: { ...prev[critId], comment: commentVal },
    }));
  };

  // Compute live total weighted score: sum of (score / 10) * weight
  const criteriaList = challenge?.evaluationCriteria || [];
  const totalWeightedScore = criteriaList.reduce((acc, crit, idx) => {
    const critKey = crit.id || `crit-${idx}`;
    const sc = scores[critKey]?.score || 0;
    const w = crit.weight || 50;
    return acc + (sc / 10.0) * w;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;

    setSubmitting(true);
    setError(null);

    try {
      const criterionScoresInput = criteriaList.map((crit, idx) => {
        const critKey = crit.id || `crit-${idx}`;
        return {
          criterion_id: critKey,
          score: scores[critKey]?.score || 5,
          comment: scores[critKey]?.comment || '',
        };
      });

      await submitEvaluation(proposal.id, {
        criterion_scores: criterionScoresInput,
        general_comments: generalComments,
      });

      navigate(`/proposals/${proposal.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Loading evaluation workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-bold">Evaluation Load Error</h3>
          <p className="text-sm mt-1">{error || 'Proposal not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Top */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Proposal Detail
        </button>

        {/* Header Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>{proposal.startup?.company_name || 'Startup Submission'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{proposal.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Challenge: <span className="text-slate-800 font-medium">{proposal.challenge?.title}</span>
            </p>
          </div>

          <div className="text-right bg-emerald-50 border border-emerald-200 p-4 rounded-xl shrink-0">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Live Score</span>
            <span className="text-2xl font-bold text-emerald-700">{totalWeightedScore.toFixed(1)} / 100</span>
          </div>
        </div>

        {/* Evaluation Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Score Against Challenge Rubrics</h2>
            <p className="text-sm text-slate-500">
              Rate each mandatory evaluation criterion from 1 to 10. The backend automatically computes weighted scoring based on challenge requirements.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {criteriaList.map((crit, idx) => {
              const critKey = crit.id || `crit-${idx}`;
              const currentScore = scores[critKey]?.score || 8;
              const currentComment = scores[critKey]?.comment || '';
              const weightVal = crit.weight || 50;

              return (
                <div key={critKey} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{crit.criterionName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{crit.description || 'Evaluation criterion defined by officer'}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md">
                      Weight: {weightVal}%
                    </span>
                  </div>

                  {/* Rating Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Rating (1 - 10)</span>
                      <span className="text-indigo-700 text-sm font-bold">{currentScore} / 10</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleScoreChange(critKey, num)}
                          className={`w-9 h-9 rounded-lg font-bold text-sm transition-all shrink-0 ${
                            currentScore === num
                              ? 'bg-indigo-600 text-white shadow-md scale-105'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <input
                      type="text"
                      value={currentComment}
                      onChange={(e) => handleCommentChange(critKey, e.target.value)}
                      placeholder="Add specific comments or observations for this criterion..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    />
                  </div>
                </div>
              );
            })}

            {/* General Comments */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">General Evaluator Feedback</label>
              <textarea
                rows={3}
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                placeholder="Overall summary notes regarding suitability, feasibility, or deployment readiness..."
                className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Score...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Evaluation Score</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
