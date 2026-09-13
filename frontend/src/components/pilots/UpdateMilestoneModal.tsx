import React, { useState } from 'react';
import type { MilestoneStatus, PilotMilestone } from '../../types/pilot';
import { pilotService } from '../../services/pilotService';

interface Props {
  pilotId: string;
  milestone: PilotMilestone;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpdateMilestoneModal: React.FC<Props> = ({
  pilotId,
  milestone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status);
  const [completionPercentage, setCompletionPercentage] = useState<string>(
    milestone.completion_percentage.toString()
  );
  const [blockedReason, setBlockedReason] = useState<string>(milestone.blocked_reason || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'BLOCKED' && !blockedReason.trim()) {
      setError('Setting a milestone to BLOCKED demands a mandatory written blocked reason.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await pilotService.updateMilestone(pilotId, milestone.id, {
        status,
        completion_percentage: Number(completionPercentage),
        blocked_reason: status === 'BLOCKED' ? blockedReason.trim() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update milestone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Update Milestone Progress</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Milestone Name
            </label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800">
              {milestone.name}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                const nextStatus = e.target.value as MilestoneStatus;
                setStatus(nextStatus);
                if (nextStatus === 'COMPLETED') setCompletionPercentage('100');
                else if (nextStatus === 'NOT_STARTED') setCompletionPercentage('0');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed (100%)</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Completion Percentage ({completionPercentage}%)
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={completionPercentage}
              onChange={(e) => {
                setCompletionPercentage(e.target.value);
                if (Number(e.target.value) === 100) setStatus('COMPLETED');
                else if (Number(e.target.value) > 0 && status === 'NOT_STARTED') setStatus('IN_PROGRESS');
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {status === 'BLOCKED' && (
            <div>
              <label className="block text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                Blocked Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                rows={3}
                required
                placeholder="Detail the technical or dependency block preventing milestone completion..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-red-50/50"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (status === 'BLOCKED' && !blockedReason.trim())}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : 'Update Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
