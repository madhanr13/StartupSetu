import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createProposal, uploadProposalDocument, submitProposal } from '../../services/proposalService';
import { apiRequest } from '../../services/api';
import type { Challenge } from '../../types';

export const ProposalSubmitPage: React.FC = () => {
  const { challengeId: paramChallengeId } = useParams();
  const [searchParams] = useSearchParams();
  const challengeId = paramChallengeId || searchParams.get('challenge_id') || 'ch-road-01';

  const navigate = useNavigate();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(2500000);
  const [durationDays, setDurationDays] = useState<number>(90);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');

  // File Upload & AI status
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        setLoadingChallenge(true);
        const data = await apiRequest<Challenge>(`/challenges/${challengeId}`);
        setChallenge(data);
        if (data.title) {
          setTitle(`Proposal for ${data.title}`);
        }
      } catch (err: any) {
        setError('Failed to load challenge details.');
      } finally {
        setLoadingChallenge(false);
      }
    }
    if (challengeId) fetchChallenge();
  }, [challengeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF documents (.pdf) are permitted.');
        setPdfFile(null);
        return;
      }
      if (selected.size > 25 * 1024 * 1024) {
        setError('File size must not exceed 25MB.');
        setPdfFile(null);
        return;
      }
      setPdfFile(selected);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      setError('Please select a proposal PDF document to upload.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create Proposal Draft
      setUploadProgress('1/3: Creating proposal record...');
      const created = await createProposal(challengeId, {
        title,
        executive_summary: executiveSummary,
        estimated_cost: Number(estimatedCost),
        implementation_duration_days: Number(durationDays),
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      });

      // Step 2: Upload Document & Trigger AI Fact Extraction
      setUploadProgress('2/3: Uploading PDF & extracting AI facts with page citations...');
      const uploaded = await uploadProposalDocument(created.id, pdfFile);

      // Step 3: Finalize Submission
      setUploadProgress('3/3: Submitting proposal to government officer workspace...');
      const final = await submitProposal(uploaded.id);

      navigate(`/proposals/${final.id}`);
    } catch (err: any) {
      setError(err.message || 'Proposal submission failed.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (loadingChallenge) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Loading challenge details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Challenge
          </button>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Document Parsing Enabled</span>
          </div>
        </div>

        {/* Challenge Summary Banner */}
        {challenge && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{challenge.departmentName || 'Government Department'}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">{challenge.title}</h1>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{challenge.problemStatement}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Submit Solution Proposal</h2>
            <p className="text-sm text-slate-500">
              Provide basic metadata and upload your confidential technical proposal PDF. Our system extracts structured facts and citations automatically.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Proposal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI-Powered Autonomous Camera System"
                className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                required
              />
            </div>

            {/* Executive Summary */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Executive Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                placeholder="Summarize your technical approach, core innovation, and target impact..."
                className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                required
              />
            </div>

            {/* Cost & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Estimated Total Cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Implementation Duration (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1095"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Proposal PDF Document <span className="text-red-500">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-10 h-10 text-indigo-600 mb-2" />
                  <span className="text-sm font-semibold text-slate-900">
                    Click to select Proposal PDF
                  </span>
                  <span className="text-xs text-slate-500 mt-1">PDF documents only (max 25MB)</span>
                </label>

                {pdfFile && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-800 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{pdfFile.name}</span>
                    <span className="text-xs text-indigo-500">({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Notification */}
            {uploadProgress && (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl text-sm font-medium animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            {/* Submit Actions */}
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
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Proposal</span>
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
