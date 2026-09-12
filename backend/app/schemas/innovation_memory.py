"""
Pydantic Schemas for Innovation Memory API.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InnovationMemoryResponse(BaseModel):
    """Full innovation memory entry."""
    id: str
    source_type: str
    source_id: str
    title: str
    summary: str
    domain: Optional[str] = None
    technology: Optional[str] = None
    challenge_area: Optional[str] = None
    outcome: Optional[str] = None
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    lessons_learned: List[str] = Field(default_factory=list)
    success_factors: List[str] = Field(default_factory=list)
    failure_factors: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    startup_id: Optional[str] = None
    startup_name: Optional[str] = None
    challenge_id: Optional[str] = None
    pilot_id: Optional[str] = None
    decision_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InnovationMemoryListResponse(BaseModel):
    """Paginated innovation memory list."""
    items: List[InnovationMemoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class InnovationMemoryCreate(BaseModel):
    """Manual memory creation payload."""
    title: str = Field(..., min_length=5, max_length=500)
    summary: str = Field(..., min_length=10)
    domain: Optional[str] = None
    technology: Optional[str] = None
    challenge_area: Optional[str] = None
    outcome: Optional[str] = None
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    lessons_learned: List[str] = Field(default_factory=list)
    success_factors: List[str] = Field(default_factory=list)
    failure_factors: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    challenge_id: Optional[str] = None
    pilot_id: Optional[str] = None
    startup_id: Optional[str] = None


class InnovationMemoryUpdate(BaseModel):
    """Partial update payload for memory entries."""
    title: Optional[str] = None
    summary: Optional[str] = None
    lessons_learned: Optional[List[str]] = None
    success_factors: Optional[List[str]] = None
    failure_factors: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None


class RelatedMemoryItem(BaseModel):
    """Compact memory reference for related-challenge lookups."""
    id: str
    title: str
    domain: Optional[str] = None
    outcome: Optional[str] = None
    startup_name: Optional[str] = None
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    lessons_learned: List[str] = Field(default_factory=list)
    created_at: datetime
