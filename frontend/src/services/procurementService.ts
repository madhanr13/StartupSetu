import { apiRequest } from './api';
import type {
  PilotAssessment,
  ProcurementDecision,
  ProcurementDecisionInput,
  ProcurementScaleUp,
  ProcurementScaleUpUpdateInput,
  ScaleUpStatus,
} from '../types';

export const procurementService = {
  // Fetch AI-assisted pilot assessment telemetry & recommendation
  async getPilotAssessment(pilotId: string): Promise<PilotAssessment> {
    return apiRequest<PilotAssessment>(`/pilots/${pilotId}/assessment`);
  },

  // Force re-evaluation of pilot telemetry
  async recomputePilotAssessment(pilotId: string): Promise<PilotAssessment> {
    return apiRequest<PilotAssessment>(`/pilots/${pilotId}/assessment`, {
      method: 'POST',
    });
  },

  // Submit binding procurement decision (SCALE, EXTEND, REJECT)
  async submitDecision(
    pilotId: string,
    payload: ProcurementDecisionInput
  ): Promise<ProcurementDecision> {
    return apiRequest<ProcurementDecision>(`/pilots/${pilotId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Retrieve versioned decision history
  async getDecisionHistory(pilotId: string): Promise<ProcurementDecision[]> {
    return apiRequest<ProcurementDecision[]>(`/pilots/${pilotId}/decision-history`);
  },

  // List scaled solutions transitioned to public procurement
  async getScaleUpProjects(params?: {
    status_filter?: ScaleUpStatus | 'ALL';
    department_id?: string;
  }): Promise<ProcurementScaleUp[]> {
    const query = new URLSearchParams();
    if (params?.status_filter && params.status_filter !== 'ALL') {
      query.append('status_filter', params.status_filter);
    }
    if (params?.department_id) {
      query.append('department_id', params.department_id);
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<ProcurementScaleUp[]>(`/procurement/scale-up${qStr}`);
  },

  // Get details of a single scale-up procurement project
  async getScaleUpProject(scaleUpId: string): Promise<ProcurementScaleUp> {
    return apiRequest<ProcurementScaleUp>(`/procurement/scale-up/${scaleUpId}`);
  },

  // Update scale-up project status or notes
  async updateScaleUpProject(
    scaleUpId: string,
    payload: ProcurementScaleUpUpdateInput
  ): Promise<ProcurementScaleUp> {
    return apiRequest<ProcurementScaleUp>(`/procurement/scale-up/${scaleUpId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
