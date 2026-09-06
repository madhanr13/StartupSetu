"""
Challenge-related Pydantic schemas for API validation and serialization.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ── Nested Item Schemas ──────────────────────────────────────────────────────


class RequirementBase(BaseModel):
    """Shared fields for a challenge requirement."""
    description: str
    is_mandatory: bool = True
    order: int = 0


class RequirementCreate(RequirementBase):
    """Create payload for a requirement (no id)."""
    pass


class RequirementResponse(RequirementBase):
    """Response schema for a requirement."""
    id: str
    model_config = {"from_attributes": True}


class KPIBase(BaseModel):
    """Shared fields for a challenge KPI."""
    name: str
    description: str = ""
    target_value: float = 0
    unit: str = ""
    weight: float = 1.0


class KPICreate(KPIBase):
    """Create payload for a KPI (no id)."""
    pass


class KPIResponse(KPIBase):
    """Response schema for a KPI."""
    id: str
    model_config = {"from_attributes": True}


class EvalCriterionBase(BaseModel):
    """Shared fields for an evaluation criterion."""
    name: str
    description: str = ""
    weight: float = 1.0
    max_score: int = 10


class EvalCriterionCreate(EvalCriterionBase):
    """Create payload for an evaluation criterion (no id)."""
    pass


class EvalCriterionResponse(EvalCriterionBase):
    """Response schema for an evaluation criterion."""
    id: str
    model_config = {"from_attributes": True}


# ── Challenge CRUD Schemas ───────────────────────────────────────────────────


class ChallengeCreate(BaseModel):
    """Full create payload for a new challenge."""
    title: str = Field(..., min_length=1, max_length=500)
    description: str = ""
    problem_statement: str = ""
    domain: str = ""
    budget_min: float | None = None
    budget_max: float | None = None
    pilot_duration_weeks: int | None = None
    deadline: datetime | None = None
    requirements: list[RequirementCreate] = []
    kpis: list[KPICreate] = []
    evaluation_criteria: list[EvalCriterionCreate] = []


class ChallengeUpdate(BaseModel):
    """Partial update payload for an existing challenge."""
    title: str | None = None
    description: str | None = None
    problem_statement: str | None = None
    domain: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    pilot_duration_weeks: int | None = None
    deadline: datetime | None = None
    requirements: list[RequirementCreate] | None = None
    kpis: list[KPICreate] | None = None
    evaluation_criteria: list[EvalCriterionCreate] | None = None


class ChallengeResponse(BaseModel):
    """Full challenge response with nested children."""
    id: str
    title: str
    description: str
    problem_statement: str
    domain: str
    status: str
    budget_min: float | None = None
    budget_max: float | None = None
    pilot_duration_weeks: int | None = None
    deadline: datetime | None = None
    department_id: str | None = None
    department_name: str | None = None
    created_by: str
    creator_name: str | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    requirements: list[RequirementResponse] = []
    kpis: list[KPIResponse] = []
    evaluation_criteria: list[EvalCriterionResponse] = []
    proposal_count: int = 0

    model_config = {"from_attributes": True}


class ChallengeListItem(BaseModel):
    """Compact challenge representation for list views."""
    id: str
    title: str
    domain: str
    status: str
    department_name: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    pilot_duration_weeks: int | None = None
    deadline: datetime | None = None
    published_at: datetime | None = None
    created_at: datetime
    proposal_count: int = 0

    model_config = {"from_attributes": True}


class ChallengeListResponse(BaseModel):
    """Paginated challenge list response."""
    items: list[ChallengeListItem]
    total: int
    page: int
    page_size: int


# ── AI Structuring Schemas ───────────────────────────────────────────────────


class AIStructureRequest(BaseModel):
    """Input for AI-assisted challenge structuring."""
    problem_statement: str = Field(..., min_length=10)
    domain: str | None = None


class AIStructuredRequirement(BaseModel):
    """An AI-suggested requirement."""
    description: str
    is_mandatory: bool = True


class AIStructuredKPI(BaseModel):
    """An AI-suggested KPI."""
    name: str
    description: str = ""
    target_value: float = 0
    unit: str = ""
    weight: float = 1.0


class AIStructuredEvalCriterion(BaseModel):
    """An AI-suggested evaluation criterion."""
    name: str
    description: str = ""
    weight: float = 1.0
    max_score: int = 10


class AIStructureResponse(BaseModel):
    """Structured output from the AI challenge analyzer."""
    title: str
    description: str
    domain: str
    requirements: list[AIStructuredRequirement] = []
    kpis: list[AIStructuredKPI] = []
    evaluation_criteria: list[AIStructuredEvalCriterion] = []
    expected_outcomes: list[str] = []
    suggested_budget_min: float | None = None
    suggested_budget_max: float | None = None
    suggested_pilot_duration_weeks: int | None = None
