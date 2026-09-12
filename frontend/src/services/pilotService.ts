import { apiRequest } from './api';
import type {
  BulkKPIMeasurementsPayload,
  IssueCreatePayload,
  IssueUpdatePayload,
  KPICreatePayload,
  KPIMeasurementPayload,
  KPITargetUpdatePayload,
  MilestoneCreatePayload,
  MilestoneUpdatePayload,
  RiskCreatePayload,
  RiskUpdatePayload,
} from './pilotServiceTypes';
import type {
  KPIMeasurement,
  Pilot,
  PilotCreateInput,
  PilotEvidence,
  PilotIssue,
  PilotKPI,
  PilotMilestone,
  PilotRisk,
  PilotStatus,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const pilotService = {
  // List pilots with optional filters
  async getPilots(params?: {
    status_filter?: PilotStatus;
    search?: string;
    challenge_id?: string;
  }): Promise<Pilot[]> {
    const query = new URLSearchParams();
    if (params?.status_filter && params.status_filter !== 'ALL' as any) {
      query.append('status_filter', params.status_filter);
    }
    if (params?.search) {
      query.append('search', params.search);
    }
    if (params?.challenge_id) {
      query.append('challenge_id', params.challenge_id);
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<Pilot[]>(`/pilots${qStr}`);
  },

  // Get pilot by ID
  async getPilotById(pilotId: string): Promise<Pilot> {
    return apiRequest<Pilot>(`/pilots/${pilotId}`);
  },

  // Create pilot from shortlisted proposal
  async createPilot(payload: PilotCreateInput): Promise<Pilot> {
    return apiRequest<Pilot>('/pilots', {
      method: 'POST',
      body: payload,
    });
  },

  // Update basic pilot metadata / status
  async updatePilot(pilotId: string, payload: Partial<PilotCreateInput> & { status?: PilotStatus }): Promise<Pilot> {
    return apiRequest<Pilot>(`/pilots/${pilotId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  // Add milestone
  async addMilestone(pilotId: string, payload: MilestoneCreatePayload): Promise<PilotMilestone> {
    return apiRequest<PilotMilestone>(`/pilots/${pilotId}/milestones`, {
      method: 'POST',
      body: payload,
    });
  },

  // Update milestone
  async updateMilestone(pilotId: string, milestoneId: string, payload: MilestoneUpdatePayload): Promise<PilotMilestone> {
    return apiRequest<PilotMilestone>(`/pilots/${pilotId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  // Add KPI
  async addKPI(pilotId: string, payload: KPICreatePayload): Promise<PilotKPI> {
    return apiRequest<PilotKPI>(`/pilots/${pilotId}/kpis`, {
      method: 'POST',
      body: payload,
    });
  },

  // Update KPI Target (Mandatory reason)
  async updateKPITarget(pilotId: string, kpiId: string, payload: KPITargetUpdatePayload): Promise<PilotKPI> {
    return apiRequest<PilotKPI>(`/pilots/${pilotId}/kpis/${kpiId}/target`, {
      method: 'PATCH',
      body: payload,
    });
  },

  // Record single measurement
  async recordMeasurement(pilotId: string, kpiId: string, payload: KPIMeasurementPayload): Promise<KPIMeasurement> {
    return apiRequest<KPIMeasurement>(`/pilots/${pilotId}/kpis/${kpiId}/measurements`, {
      method: 'POST',
      body: payload,
    });
  },

  // Record bulk measurements
  async recordBulkMeasurements(pilotId: string, payload: BulkKPIMeasurementsPayload): Promise<KPIMeasurement[]> {
    return apiRequest<KPIMeasurement[]>(`/pilots/${pilotId}/kpis/bulk-measurements`, {
      method: 'POST',
      body: payload,
    });
  },

  // Add risk
  async addRisk(pilotId: string, payload: RiskCreatePayload): Promise<PilotRisk> {
    return apiRequest<PilotRisk>(`/pilots/${pilotId}/risks`, {
      method: 'POST',
      body: payload,
    });
  },

  // Update risk
  async updateRisk(pilotId: string, riskId: string, payload: RiskUpdatePayload): Promise<PilotRisk> {
    return apiRequest<PilotRisk>(`/pilots/${pilotId}/risks/${riskId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  // Add issue
  async addIssue(pilotId: string, payload: IssueCreatePayload): Promise<PilotIssue> {
    return apiRequest<PilotIssue>(`/pilots/${pilotId}/issues`, {
      method: 'POST',
      body: payload,
    });
  },

  // Update issue
  async updateIssue(pilotId: string, issueId: string, payload: IssueUpdatePayload): Promise<PilotIssue> {
    return apiRequest<PilotIssue>(`/pilots/${pilotId}/issues/${issueId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  // Upload evidence document
  async uploadEvidence(pilotId: string, file: File, description: string): Promise<PilotEvidence> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/pilots/${pilotId}/evidence`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload evidence file.');
    }
    return response.json();
  },

  // Validate completion and transition to READY_FOR_ASSESSMENT
  async completePilot(pilotId: string): Promise<Pilot> {
    return apiRequest<Pilot>(`/pilots/${pilotId}/complete`, {
      method: 'POST',
    });
  },

  // Get pilot audit trail
  async getAuditTrail(pilotId: string): Promise<any[]> {
    return apiRequest<any[]>(`/pilots/${pilotId}/audit-trail`);
  },
};
