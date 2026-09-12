"""
Pydantic Schemas for Pilot Management, Milestones, KPIs, Measurements, Risks, Issues, and Evidence.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.pilot import (
    IssueStatus,
    KPIStatus,
    MilestoneStatus,
    PilotStatus,
    RiskCategory,
    RiskSeverity,
    RiskStatus,
    TargetOperator,
)


class PilotMilestoneCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = ""
    planned_start: datetime
    planned_end: datetime


class PilotMilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    status: Optional[MilestoneStatus] = None
    completion_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    blocked_reason: Optional[str] = None


class PilotMilestoneResponse(BaseModel):
    id: str
    pilot_id: str
    name: str
    description: str
    planned_start: datetime
    planned_end: datetime
    status: MilestoneStatus
    completion_percentage: float
    blocked_reason: Optional[str] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KPIMeasurementCreate(BaseModel):
    actual_value: float
    measurement_date: Optional[datetime] = None
    notes: Optional[str] = None


class KPIMeasurementResponse(BaseModel):
    id: str
    pilot_kpi_id: str
    measurement_date: datetime
    actual_value: float
    notes: Optional[str] = None
    recorded_by_id: str
    recorded_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class PilotKPICreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = ""
    target_value: float
    target_operator: TargetOperator = TargetOperator.GREATER_EQUAL
    unit: str = ""
    measurement_method: Optional[str] = ""
    frequency: str = "Weekly"
    weight: float = 1.0


class PilotKPIUpdateTarget(BaseModel):
    new_target_value: float
    reason: str = Field(..., min_length=10, description="Mandatory official justification for target modification")


class SingleKPIBulkItem(BaseModel):
    kpi_id: str
    actual_value: float
    notes: Optional[str] = None


class BulkKPIMeasurementsInput(BaseModel):
    measurement_date: Optional[datetime] = None
    measurements: List[SingleKPIBulkItem] = Field(..., min_length=1)


class PilotKPIResponse(BaseModel):
    id: str
    pilot_id: str
    name: str
    description: str
    target_value: float
    target_operator: TargetOperator
    unit: str
    measurement_method: str
    frequency: str
    weight: float
    status: KPIStatus
    target_change_history: List[Dict[str, Any]] = []
    latest_actual_value: Optional[float] = None
    latest_measurement_date: Optional[datetime] = None
    measurements: List[KPIMeasurementResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PilotRiskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = ""
    category: RiskCategory = RiskCategory.TECHNICAL
    severity: RiskSeverity = RiskSeverity.MEDIUM
    probability: str = "Medium"
    mitigation: Optional[str] = ""
    owner_name: Optional[str] = "Government Owner"


class PilotRiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[RiskCategory] = None
    severity: Optional[RiskSeverity] = None
    probability: Optional[str] = None
    mitigation: Optional[str] = None
    owner_name: Optional[str] = None
    status: Optional[RiskStatus] = None


class PilotRiskResponse(BaseModel):
    id: str
    pilot_id: str
    title: str
    description: str
    category: RiskCategory
    severity: RiskSeverity
    probability: str
    mitigation: str
    owner_name: str
    status: RiskStatus
    created_at: datetime

    class Config:
        from_attributes = True


class PilotIssueCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = ""
    severity: RiskSeverity = RiskSeverity.MEDIUM
    assigned_to_name: Optional[str] = "Unassigned"


class PilotIssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[RiskSeverity] = None
    assigned_to_name: Optional[str] = None
    status: Optional[IssueStatus] = None
    resolution: Optional[str] = None


class PilotIssueResponse(BaseModel):
    id: str
    pilot_id: str
    title: str
    description: str
    severity: RiskSeverity
    reported_date: datetime
    assigned_to_name: str
    status: IssueStatus
    resolution: Optional[str] = None

    class Config:
        from_attributes = True


class PilotEvidenceResponse(BaseModel):
    id: str
    pilot_id: str
    file_name: str
    storage_key: str
    file_type: str
    file_size: int
    description: str
    uploaded_by_id: str
    uploaded_by_name: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PilotCreateInput(BaseModel):
    proposal_id: str
    name: str = Field(..., min_length=5, max_length=500)
    objective: str = Field(..., min_length=15)
    scope: str = Field(..., min_length=15)
    success_criteria: Optional[str] = ""
    start_date: datetime
    end_date: datetime
    government_owner_id: Optional[str] = None
    government_team_notes: Optional[str] = None
    startup_team_notes: Optional[str] = None
    evaluator_notes: Optional[str] = None
    data_access_notes: Optional[str] = None
    security_requirements: Optional[str] = None
    ip_notes: Optional[str] = None
    
    # Optional initial milestones & KPIs
    initial_milestones: Optional[List[PilotMilestoneCreate]] = None
    initial_kpis: Optional[List[PilotKPICreate]] = None
    initial_risks: Optional[List[PilotRiskCreate]] = None


class PilotUpdateInput(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    scope: Optional[str] = None
    success_criteria: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[PilotStatus] = None
    government_team_notes: Optional[str] = None
    startup_team_notes: Optional[str] = None
    evaluator_notes: Optional[str] = None
    data_access_notes: Optional[str] = None
    security_requirements: Optional[str] = None
    ip_notes: Optional[str] = None


class PilotHealthSummary(BaseModel):
    health_label: str  # "ON_TRACK" | "NEEDS_ATTENTION" | "AT_RISK"
    kpis_total: int
    kpis_achieved: int
    kpis_below_target: int
    kpis_pending: int
    milestones_total: int
    milestones_completed: int
    milestones_blocked: int
    risks_critical_open: int
    risks_high_open: int
    issues_unresolved: int
    rules_applied: List[str]


class ChallengeSimpleInfo(BaseModel):
    id: str
    title: str
    department_id: str
    department_name: Optional[str] = None

    class Config:
        from_attributes = True


class StartupSimpleInfo(BaseModel):
    id: str
    company_name: str
    dpiit_number: str
    contact_email: Optional[str] = None

    class Config:
        from_attributes = True


class UserSimpleInfo(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True


class PilotResponse(BaseModel):
    id: str
    proposal_id: str
    challenge_id: str
    startup_id: str
    name: str
    objective: str
    scope: str
    success_criteria: str
    government_owner_id: str
    government_team_notes: Optional[str] = None
    startup_team_notes: Optional[str] = None
    evaluator_notes: Optional[str] = None
    data_access_notes: Optional[str] = None
    security_requirements: Optional[str] = None
    ip_notes: Optional[str] = None
    start_date: datetime
    end_date: datetime
    status: PilotStatus
    overall_progress_percentage: float
    completed_at: Optional[datetime] = None
    ready_for_assessment_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Nested & Calculated
    challenge: Optional[ChallengeSimpleInfo] = None
    startup: Optional[StartupSimpleInfo] = None
    government_owner: Optional[UserSimpleInfo] = None
    health: Optional[PilotHealthSummary] = None

    milestones: List[PilotMilestoneResponse] = []
    kpis: List[PilotKPIResponse] = []
    risks: List[PilotRiskResponse] = []
    issues: List[PilotIssueResponse] = []
    evidence_files: List[PilotEvidenceResponse] = []

    class Config:
        from_attributes = True
