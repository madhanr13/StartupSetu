"""
Pydantic Schemas for System Settings API.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SystemSettingResponse(BaseModel):
    """Single system setting detail."""
    id: str
    key: str
    value: Any
    value_type: str
    category: str
    label: str
    description: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: datetime


class SystemSettingUpdate(BaseModel):
    """Payload for updating a setting value."""
    value: Any = Field(..., description="New value for the setting")


class SettingsByCategoryResponse(BaseModel):
    """Settings grouped by category."""
    category: str
    settings: List[SystemSettingResponse]


class MatchingWeightsResponse(BaseModel):
    """Current matching weights configuration."""
    weights: Dict[str, float]
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None


class MatchingWeightsUpdate(BaseModel):
    """Payload for updating matching weights."""
    weights: Dict[str, float] = Field(
        ..., description="Map of weight_name → weight_value (e.g. technology_fit: 0.25)"
    )
