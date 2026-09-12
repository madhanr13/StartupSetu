import React, { useState } from 'react';
import { Award, XCircle, X, AlertCircle } from 'lucide-react';
import { shortlistProposal } from '../../services/proposalService';

interface Props {
  proposalId: string;
  proposalTitle: string;
  startupName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShortlistModal: React.FC<Props> = ({
  proposalId,
  proposalTitle,
  startupName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'SHORTLISTED' | 'NOT_SHORTLISTED'>('SHORTLISTED');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 10) {
      setError('A detailed officer rationale (minimum 10 characters) is mandatory.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await shortlistProposal(proposalId, {
        decision: decision,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record shortlist decision.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Officer Shortlist Decision</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proposal</p>
            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{proposalTitle}</p>
            <p className="text-xs text-slate-600 mt-1">Submitted by: <span className="font-medium text-slate-800">{startupName}</span></p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Decision Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('SHORTLISTED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  decision === 'SHORTLISTED'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Shortlist Proposal</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('NOT_SHORTLISTED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  decision === 'NOT_SHORTLISTED'
                    ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Do Not Shortlist</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Officer Justification & Evaluation Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide clear technical, financial, or evaluation rationale for this decision..."
              className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              required
            />
            <p className="text-xs text-slate-500 mt-1">This official reasoning will be recorded permanently in the governance audit trail.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${
                decision === 'SHORTLISTED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Recording...' : decision === 'SHORTLISTED' ? 'Confirm Shortlist' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
