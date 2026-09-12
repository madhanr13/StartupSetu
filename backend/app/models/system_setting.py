"""
System Setting Domain Model — Configurable platform parameters.

Stores typed configuration values grouped by category.
Settings are read by the eligibility engine, matching engine, and pilot defaults.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SettingCategory(str, enum.Enum):
    """Category grouping for system settings."""
    GENERAL = "GENERAL"
    ELIGIBILITY = "ELIGIBILITY"
    MATCHING = "MATCHING"
    PILOT = "PILOT"
    WORKFLOW = "WORKFLOW"
    NOTIFICATIONS = "NOTIFICATIONS"


class SettingValueType(str, enum.Enum):
    """Data type hint for the setting value."""
    STRING = "STRING"
    INTEGER = "INTEGER"
    FLOAT = "FLOAT"
    BOOLEAN = "BOOLEAN"
    JSON = "JSON"


class SystemSetting(Base):
    """
    Platform configuration entry.
    Values are stored as JSON to support all types uniformly.
    The value_type field hints at the expected shape for UI rendering.
    """

    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    value_type: Mapped[str] = mapped_column(String(20), nullable=False, default="JSON")
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Audit metadata
    updated_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<SystemSetting key='{self.key}' category={self.category}>"
