"""
Pydantic Schemas for Audit Log API responses, pagination, and filtering.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_serializer


class AuditLogResponse(BaseModel):
    """Single audit event detail."""
    id: str
    action: str
    entity_type: str
    entity_id: str
    actor_id: Optional[str] = None
    actor_name: str
    actor_role: str
    summary: str
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    timestamp: datetime

    @field_serializer("timestamp")
    def serialize_timestamp(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            # Stored as UTC in database without tzinfo in SQLite
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit log list."""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
