"""
Pydantic Schemas for Pilot Assessment, Procurement Decisions, and Scale-Up Transitions.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.procurement import DecisionType, ScaleUpStatus


class PilotAssessmentResponse(BaseModel):
    """Structured AI-assisted pilot assessment result."""
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Overall pilot performance score (0-100)")
    kpi_performance: float = Field(..., ge=0.0, le=100.0, description="Weighted KPI achievement score (0-100)")
    milestone_performance: float = Field(..., ge=0.0, le=100.0, description="Milestone completion score (0-100)")
    risk_level: str = Field(..., description="Operational risk level: LOW | MEDIUM | HIGH")
    confidence: float = Field(..., ge=0.0, le=100.0, description="Confidence percentage based on data completeness (0-100)")
    recommendation: DecisionType = Field(..., description="AI Recommendation: SCALE | EXTEND | REJECT")
    reasons: List[str] = Field(default_factory=list, description="Core rationale supporting the recommendation")
    strengths: List[str] = Field(default_factory=list, description="Demonstrated strengths and key milestones met")
    concerns: List[str] = Field(default_factory=list, description="Deficits, open issues, or risks")
    missing_information: List[str] = Field(default_factory=list, description="Missing telemetry or verification documents")


class ProcurementDecisionCreate(BaseModel):
    """Payload submitted by a Government Officer to make the binding procurement decision."""
    decision: DecisionType = Field(..., description="Final decision: SCALE | EXTEND | REJECT")
    justification: str = Field(..., min_length=10, description="Mandatory written justification for official records")
    extension_duration: Optional[int] = Field(None, ge=1, le=365, description="Extension duration in days (mandatory if decision is EXTEND)")
    extension_reason: Optional[str] = Field(None, description="Detailed explanation for extending the pilot")
    rejection_reason: Optional[str] = Field(None, description="Reason for solution rejection (mandatory if decision is REJECT)")

    @field_validator("extension_duration")
    @classmethod
    def validate_extension(cls, v: Optional[int], info) -> Optional[int]:
        decision = info.data.get("decision")
        if decision == DecisionType.EXTEND and (v is None or v <= 0):
            raise ValueError("Extension duration in days is required when decision is EXTEND")
        return v

    @field_validator("rejection_reason")
    @classmethod
    def validate_rejection(cls, v: Optional[str], info) -> Optional[str]:
        decision = info.data.get("decision")
        if decision == DecisionType.REJECT and (not v or len(v.strip()) < 5):
            raise ValueError("A clear rejection reason is required when decision is REJECT")
        return v


class DecidedByUserSummary(BaseModel):
    """Summary of the officer who made the decision."""
    id: str
    name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class ProcurementDecisionResponse(BaseModel):
    """Full decision record with audit metadata."""
    id: str
    pilot_id: str
    challenge_id: str
    startup_id: str
    decision: DecisionType
    ai_recommendation: DecisionType
    ai_score: float
    ai_confidence: float
    justification: str
    decided_by: str
    decided_at: datetime
    extension_duration: Optional[int] = None
    extension_reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    assessment_snapshot: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    decided_by_user: Optional[DecidedByUserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class ScaleUpProjectSummary(BaseModel):
    id: str
    company_name: str
    dpiit_number: Optional[str] = None
    contact_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChallengeSummary(BaseModel):
    id: str
    title: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProcurementScaleUpResponse(BaseModel):
    """Scale-up and public procurement transition entity."""
    id: str
    pilot_id: str
    decision_id: str
    challenge_id: str
    startup_id: str
    department_id: Optional[str] = None
    solution_name: str
    pilot_outcome_summary: str
    approved_kpis: List[Dict[str, Any]] = Field(default_factory=list)
    proposed_scale_scope: str
    status: ScaleUpStatus
    budget_allocation: Optional[float] = None
    target_completion_date: Optional[datetime] = None
    procurement_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    startup: Optional[ScaleUpProjectSummary] = None
    challenge: Optional[ChallengeSummary] = None

    model_config = ConfigDict(from_attributes=True)


class ProcurementScaleUpUpdate(BaseModel):
    """Payload to update procurement/scale-up status."""
    status: Optional[ScaleUpStatus] = None
    budget_allocation: Optional[float] = Field(None, ge=0.0)
    target_completion_date: Optional[datetime] = None
    procurement_notes: Optional[str] = None
