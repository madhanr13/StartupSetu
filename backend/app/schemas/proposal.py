"""
Pydantic Schemas for Proposal Submission, Document, AI Analysis, Evaluation, and Governance.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr

from app.models.proposal import AnalysisStatus, EvaluationStatus, ProposalStatus


class ProposalDocumentResponse(BaseModel):
    id: str
    file_name: str
    file_size: int
    mime_type: str
    checksum: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ProposalAnalysisResponse(BaseModel):
    id: str
    analysis_status: AnalysisStatus
    solution_summary: str
    technologies: List[str]
    architecture_summary: str
    implementation_plan: str
    timeline_summary: str
    budget_summary: str
    team_summary: str
    previous_deployments: str
    infrastructure_requirements: str
    security_measures: str
    data_requirements: str
    scalability_assessment: str
    risks: List[str]
    expected_outcomes: List[str]
    key_assumptions: List[str]
    source_traceability: Dict[str, Any]
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CriterionScoreInput(BaseModel):
    criterion_id: str
    score: float = Field(..., ge=1.0, le=10.0, description="Score from 1 to 10")
    comment: Optional[str] = None


class CriterionScoreOutput(BaseModel):
    criterion_id: str
    criterion_name: str
    score: float
    max_score: float = 10.0
    weight: float
    weighted_score: float
    comment: Optional[str] = None


class EvaluationCreate(BaseModel):
    criterion_scores: List[CriterionScoreInput]
    general_comments: Optional[str] = None


class ProposalEvaluationResponse(BaseModel):
    id: str
    proposal_id: str
    evaluator_id: str
    evaluator_name: str
    status: EvaluationStatus
    criterion_scores: List[CriterionScoreOutput]
    total_weighted_score: float
    general_comments: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProposalCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    executive_summary: str = Field(..., min_length=20)
    estimated_cost: float = Field(..., ge=0.0)
    implementation_duration_days: int = Field(..., ge=1, le=1095)
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    executive_summary: Optional[str] = None
    estimated_cost: Optional[float] = None
    implementation_duration_days: Optional[int] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class AssignEvaluatorsRequest(BaseModel):
    evaluator_ids: List[str] = Field(..., min_items=1)


class ProposalShortlistRequest(BaseModel):
    decision: ProposalStatus = Field(..., description="SHORTLISTED or NOT_SHORTLISTED")
    reason: str = Field(..., min_length=10, description="Mandatory official justification for decision")


class ChallengeSimpleResponse(BaseModel):
    id: str
    title: str
    problem_statement: str
    department_id: str
    department_name: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class StartupSimpleResponse(BaseModel):
    id: str
    company_name: str
    dpiit_number: str
    sector: Optional[str] = None
    stage: Optional[str] = None

    class Config:
        from_attributes = True


class ProposalResponse(BaseModel):
    id: str
    challenge_id: str
    startup_id: str
    title: str
    executive_summary: str
    estimated_cost: float
    implementation_duration_days: int
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: ProposalStatus
    assigned_evaluator_ids: List[str] = []
    shortlist_reason: Optional[str] = None
    shortlisted_at: Optional[datetime] = None
    shortlisted_by: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested Objects
    challenge: Optional[ChallengeSimpleResponse] = None
    startup: Optional[StartupSimpleResponse] = None
    document: Optional[ProposalDocumentResponse] = None
    analysis: Optional[ProposalAnalysisResponse] = None
    evaluations: List[ProposalEvaluationResponse] = []
    average_evaluation_score: Optional[float] = None

    class Config:
        from_attributes = True
