/**
 * Proposal API Service — Client methods for Proposal creation, PDF upload, Evaluation, and Shortlisting.
 */

import { apiRequest } from "./api";
import type {
  AuditEventItem,
  EvaluationCreateInput,
  Proposal,
  ProposalCreateInput,
  ProposalEvaluation,
  ProposalShortlistInput,
} from "../types/proposal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function createProposal(
  challengeId: string,
  data: ProposalCreateInput
): Promise<Proposal> {
  return apiRequest<Proposal>(`/proposals?challenge_id=${encodeURIComponent(challengeId)}`, {
    method: "POST",
    body: data,
  });
}

export async function uploadProposalDocument(
  proposalId: string,
  file: File
): Promise<Proposal> {
  const token = localStorage.getItem("auth_token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/document`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function submitProposal(proposalId: string): Promise<Proposal> {
  return apiRequest<Proposal>(`/proposals/${proposalId}/submit`, {
    method: "POST",
  });
}

export async function assignEvaluators(
  proposalId: string,
  evaluatorIds: string[]
): Promise<Proposal> {
  return apiRequest<Proposal>(`/proposals/${proposalId}/assign-evaluators`, {
    method: "POST",
    body: { evaluator_ids: evaluatorIds },
  });
}

export async function submitEvaluation(
  proposalId: string,
  data: EvaluationCreateInput
): Promise<ProposalEvaluation> {
  return apiRequest<ProposalEvaluation>(`/proposals/${proposalId}/evaluate`, {
    method: "POST",
    body: data,
  });
}

export async function shortlistProposal(
  proposalId: string,
  data: ProposalShortlistInput
): Promise<Proposal> {
  return apiRequest<Proposal>(`/proposals/${proposalId}/shortlist`, {
    method: "POST",
    body: data,
  });
}

export async function getProposals(params?: {
  challengeId?: string;
  status?: string;
}): Promise<Proposal[]> {
  const search = new URLSearchParams();
  if (params?.challengeId) search.set("challenge_id", params.challengeId);
  if (params?.status) search.set("status", params.status);

  const queryStr = search.toString() ? `?${search.toString()}` : "";
  return apiRequest<Proposal[]>(`/proposals${queryStr}`);
}

export async function getProposalById(proposalId: string): Promise<Proposal> {
  return apiRequest<Proposal>(`/proposals/${proposalId}`);
}

export async function getProposalAuditTrail(
  proposalId: string
): Promise<AuditEventItem[]> {
  return apiRequest<AuditEventItem[]>(`/proposals/${proposalId}/audit-trail`);
}

export function getDocumentDownloadUrl(proposalId: string): string {
  return `${API_BASE_URL}/proposals/${proposalId}/document`;
}
