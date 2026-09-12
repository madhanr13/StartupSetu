import React, { useState } from 'react';
import { UserCheck, X, AlertCircle } from 'lucide-react';
import { assignEvaluators } from '../../services/proposalService';

interface Props {
  proposalId: string;
  proposalTitle: string;
  currentEvaluatorIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Available demo evaluators for selection
const DEMO_EVALUATORS = [
  { id: 'user-evaluator-01', name: 'Dr. Anand Mehta', role: 'Domain Technical Evaluator', dept: 'MeitY / AI Specialist' },
  { id: 'user-gov-01', name: 'Rajesh Kumar', role: 'Chief Technical Officer', dept: 'Ministry of Electronics & IT' },
  { id: 'user-auditor-01', name: 'Meena Iyer', role: 'Compliance & Governance Auditor', dept: 'Independent Panel' },
];

export const AssignEvaluatorsModal: React.FC<Props> = ({
  proposalId,
  proposalTitle,
  currentEvaluatorIds = [],
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentEvaluatorIds.length > 0 ? currentEvaluatorIds : ['user-evaluator-01']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) {
        setError('At least one evaluator must be assigned.');
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Please select at least one evaluator.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await assignEvaluators(proposalId, selectedIds);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign evaluators.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Assign Proposal Evaluators</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Proposal</label>
            <p className="text-sm font-medium text-slate-800 line-clamp-1">{proposalTitle}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Qualified Technical Evaluators
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {DEMO_EVALUATORS.map((ev) => {
                const isSelected = selectedIds.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleSelect(ev.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-900">{ev.name}</p>
                      <p className="text-xs text-slate-500">{ev.role} • {ev.dept}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {loading ? 'Assigning...' : `Assign ${selectedIds.length} Evaluator(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
