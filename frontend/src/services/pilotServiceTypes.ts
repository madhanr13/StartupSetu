import type { TargetOperator } from '../types';

export interface MilestoneCreatePayload {
  name: string;
  description?: string;
  planned_start: string;
  planned_end: string;
}

export interface MilestoneUpdatePayload {
  name?: string;
  description?: string;
  planned_start?: string;
  planned_end?: string;
  status?: string;
  completion_percentage?: number;
  blocked_reason?: string;
}

export interface KPICreatePayload {
  name: string;
  description?: string;
  target_value: number;
  target_operator?: TargetOperator;
  unit?: string;
  measurement_method?: string;
  frequency?: string;
  weight?: number;
}

export interface KPITargetUpdatePayload {
  new_target_value: number;
  reason: string;
}

export interface KPIMeasurementPayload {
  actual_value: number;
  measurement_date?: string;
  notes?: string;
}

export interface BulkKPIMeasurementsPayload {
  measurement_date?: string;
  measurements: {
    kpi_id: string;
    actual_value: number;
    notes?: string;
  }[];
}

export interface RiskCreatePayload {
  title: string;
  description?: string;
  category?: string;
  severity?: string;
  probability?: string;
  mitigation?: string;
  owner_name?: string;
}

export interface RiskUpdatePayload {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  probability?: string;
  mitigation?: string;
  owner_name?: string;
  status?: string;
}

export interface IssueCreatePayload {
  title: string;
  description?: string;
  severity?: string;
  assigned_to_name?: string;
}

export interface IssueUpdatePayload {
  title?: string;
  description?: string;
  severity?: string;
  assigned_to_name?: string;
  status?: string;
  resolution?: string;
}
