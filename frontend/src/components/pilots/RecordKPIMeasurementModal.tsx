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

export const RecordKPIMeasurementModal: React.FC<Props> = ({
  pilotId,
  kpi,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [actualValue, setActualValue] = useState<string>('');
  const [measurementDate, setMeasurementDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualValue || isNaN(Number(actualValue))) {
      setError('Please enter a valid numerical value.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await pilotService.recordMeasurement(pilotId, kpi.id, {
        actual_value: Number(actualValue),
        measurement_date: measurementDate ? new Date(measurementDate).toISOString() : undefined,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record measurement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Record KPI Measurement</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
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
              KPI Target Reference
            </label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
              <span className="font-medium text-slate-900">{kpi.name}</span>
              <span className="ml-2 text-slate-500 font-mono text-xs">
                (Target: {kpi.target_operator} {kpi.target_value} {kpi.unit})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Actual Measured Value ({kpi.unit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              placeholder={`e.g. ${kpi.target_value}`}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Measurement Date
            </label>
            <input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Measurement Notes / Audit Verification
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Field sample audit verified by PWD engineering team."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
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
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : 'Record Measurement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
