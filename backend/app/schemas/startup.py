"""
Startup domain Pydantic schemas for validation and API serialization.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ── Child Item Schemas ───────────────────────────────────────────

class StartupTechnologySchema(BaseModel):
    id: Optional[str] = None
    technology: str
    proficiency: Optional[str] = "Expert"
    description: Optional[str] = None

    class Config:
        from_attributes = True


class StartupDomainSchema(BaseModel):
    id: Optional[str] = None
    domain: str

    class Config:
        from_attributes = True


class StartupProjectSchema(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    domain: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    outcome: Optional[str] = None
    deployment_scale: Optional[str] = None
    client_type: Optional[str] = None
    year: Optional[int] = None

    class Config:
        from_attributes = True


class StartupCertificationSchema(BaseModel):
    id: Optional[str] = None
    name: str
    issuing_authority: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None

    class Config:
        from_attributes = True


class StartupTeamCapabilitySchema(BaseModel):
    id: Optional[str] = None
    capability: str
    experience_years: Optional[int] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class StartupDeploymentSchema(BaseModel):
    id: Optional[str] = None
    project_id: Optional[str] = None
    deployment_type: str
    deployment_scale: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = "Active"

    class Config:
        from_attributes = True


class StartupReadinessScoreSchema(BaseModel):
    technical_capability: float = 80.0
    team_strength: float = 80.0
    deployment_readiness: float = 80.0
    security_readiness: float = 80.0
    scalability: float = 80.0
    financial_readiness: float = 80.0
    domain_experience: float = 80.0
    government_readiness: float = 80.0
    overall_score: float = 80.0
    calculated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Main Startup Schemas ──────────────────────────────────────────

class StartupSummary(BaseModel):
    id: str
    company_name: str
    slug: str
    short_description: Optional[str] = None
    founded_year: Optional[int] = None
    location: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    employee_count: Optional[int] = None
    dpiit_recognized: bool = True
    readiness_score: Optional[StartupReadinessScoreSchema] = None
    technologies: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class StartupResponse(BaseModel):
    id: str
    company_name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    founded_year: Optional[int] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None
    employee_count: Optional[int] = None
    dpiit_recognized: bool = True
    dpiit_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    technologies: List[StartupTechnologySchema] = Field(default_factory=list)
    domains: List[StartupDomainSchema] = Field(default_factory=list)
    projects: List[StartupProjectSchema] = Field(default_factory=list)
    certifications: List[StartupCertificationSchema] = Field(default_factory=list)
    team_capabilities: List[StartupTeamCapabilitySchema] = Field(default_factory=list)
    deployments: List[StartupDeploymentSchema] = Field(default_factory=list)
    readiness_score: Optional[StartupReadinessScoreSchema] = None

    class Config:
        from_attributes = True


class StartupCreateInput(BaseModel):
    company_name: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    founded_year: Optional[int] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None
    employee_count: Optional[int] = None
    dpiit_recognized: bool = True
    dpiit_number: Optional[str] = None

    technologies: List[StartupTechnologySchema] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    projects: List[StartupProjectSchema] = Field(default_factory=list)
    certifications: List[StartupCertificationSchema] = Field(default_factory=list)
    team_capabilities: List[StartupTeamCapabilitySchema] = Field(default_factory=list)
    deployments: List[StartupDeploymentSchema] = Field(default_factory=list)
    readiness_score: Optional[StartupReadinessScoreSchema] = None


# ── AI Matching & Scoring Schemas ──────────────────────────────────

class MatchBreakdown(BaseModel):
    technology_fit: float
    domain_fit: float
    relevant_projects: float
    team_capability: float
    deployment_experience: float
    scalability: float
    security_readiness: float
    budget_compatibility: float
    explanation: str


class EligibilityResult(BaseModel):
    is_eligible: bool
    status: str  # "ELIGIBLE" | "CONDITIONALLY_ELIGIBLE" | "INELIGIBLE"
    checks: Dict[str, bool] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class StartupMatchRecommendation(BaseModel):
    rank: int
    startup: StartupSummary
    match_score: float  # Challenge-specific match % (e.g. 94.1)
    readiness_overall: float  # General startup readiness score (e.g. 87.0)
    eligibility: EligibilityResult
    match_breakdown: MatchBreakdown
    why_recommended: List[str]
    potential_concerns: List[str]


class StartupComparisonRequest(BaseModel):
    startup_ids: List[str]


class StartupComparisonResponse(BaseModel):
    challenge_id: str
    challenge_title: str
    recommendations: List[StartupMatchRecommendation]
