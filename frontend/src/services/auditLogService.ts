/**
 * Audit Log API Service
 *
 * Provides query interface to the immutable system audit trail.
 */

import { apiRequest } from "./api";

export interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  summary: string;
  details: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditLogFilters {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
  actor_id?: string;
  actor_role?: string;
  action?: string;
  entity_type?: string;
  search?: string;
}

export const auditLogService = {
  /**
   * Fetch paginated audit logs with optional filters
   */
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.page_size) params.append("page_size", String(filters.page_size));
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    if (filters.actor_id) params.append("actor_id", filters.actor_id);
    if (filters.actor_role) params.append("actor_role", filters.actor_role);
    if (filters.action) params.append("action", filters.action);
    if (filters.entity_type) params.append("entity_type", filters.entity_type);
    if (filters.search) params.append("search", filters.search);

    const qs = params.toString();
    return apiRequest<AuditLogListResponse>(`/audit-logs${qs ? `?${qs}` : ""}`);
  },

  /**
   * Fetch distinct actions present in audit log
   */
  async getDistinctActions(): Promise<string[]> {
    return apiRequest<string[]>("/audit-logs/actions");
  },

  /**
   * Fetch distinct entity types present in audit log
   */
  async getDistinctEntityTypes(): Promise<string[]> {
    return apiRequest<string[]>("/audit-logs/entity-types");
  },

  /**
   * Fetch single audit log entry by ID
   */
  async getAuditLogById(id: string): Promise<AuditLogItem> {
    return apiRequest<AuditLogItem>(`/audit-logs/${id}`);
  },
};
