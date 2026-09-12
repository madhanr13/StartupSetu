import React, { useState } from 'react';
import type { PilotKPI } from '../../types/pilot';
import { pilotService } from '../../services/pilotService';

interface Props {
  pilotId: string;
  kpi: PilotKPI;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditKPITargetModal: React.FC<Props> = ({
  pilotId,
  kpi,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newTarget, setNewTarget] = useState<string>(kpi.target_value.toString());
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget || isNaN(Number(newTarget))) {
      setError('Please enter a valid target number.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Target modification requires a detailed official justification (minimum 10 characters).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await pilotService.updateKPITarget(pilotId, kpi.id, {
        new_target_value: Number(newTarget),
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update target value.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span>⚠️ Modify Official Target: {kpi.name}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Target Immutability & Auditability:</strong> Modifying an official target demands a mandatory written justification. This action is permanently logged into the public audit trail.
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Current Target
            </label>
            <div className="p-2 bg-slate-100 rounded text-sm font-mono text-slate-700">
              {kpi.target_operator} {kpi.target_value} {kpi.unit}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Target Value ({kpi.unit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Official Written Justification / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              minLength={10}
              placeholder="Provide clear technical or administrative justification for altering target baseline..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Minimum 10 characters required. Current: {reason.trim().length} chars.
            </span>
          </div>

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
              disabled={loading || reason.trim().length < 10}
              className="px-5 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : 'Update & Audit Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
