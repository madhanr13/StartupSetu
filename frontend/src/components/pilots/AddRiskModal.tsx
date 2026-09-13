import React, { useState } from 'react';
import type { RiskCategory, RiskSeverity } from '../../types/pilot';
import { pilotService } from '../../services/pilotService';

interface Props {
  pilotId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRiskModal: React.FC<Props> = ({ pilotId, isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RiskCategory>('TECHNICAL');
  const [severity, setSeverity] = useState<RiskSeverity>('MEDIUM');
  const [probability, setProbability] = useState('Medium');
  const [mitigation, setMitigation] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a risk title.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await pilotService.addRisk(pilotId, {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        probability,
        mitigation: mitigation.trim(),
        owner_name: ownerName.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add risk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Register Pilot Risk</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Risk Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lens smudging during heavy monsoon rainfall"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detailed description of the operational or technical risk..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RiskCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="TECHNICAL">Technical</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="SECURITY">Security</option>
                <option value="FINANCIAL">Financial</option>
                <option value="SCHEDULE">Schedule</option>
                <option value="COMPLIANCE">Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as RiskSeverity)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              >
                <option value="LOW" className="text-slate-600">Low</option>
                <option value="MEDIUM" className="text-amber-600">Medium</option>
                <option value="HIGH" className="text-orange-600">High</option>
                <option value="CRITICAL" className="text-red-600">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Probability
              </label>
              <select
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mitigation Plan
            </label>
            <textarea
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              rows={2}
              placeholder="Detail planned fallback or technical countermeasure..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Risk Owner / Lead
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Priya Sharma (Startup Lead)"
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
              {loading ? 'Registering...' : 'Register Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
