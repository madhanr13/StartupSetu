"""
Simulation Scenario Domain Model — What-If Procurement Decision Sandbox.

Stores saved what-if simulation scenarios created by government officers
and platform administrators. Scenarios are strictly decoupled from official
procurement records, challenges, proposals, and pilot evaluations.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ScenarioType(str, enum.Enum):
    """Supported simulation scenario modes."""
    MATCHING = "MATCHING"
    PILOT_DECISION = "PILOT_DECISION"


class SimulationScenario(Base):
    """
    Persisted What-If Simulation Scenario.

    Holds user-configured simulation parameters, baseline parameters,
    resulting rank/decision comparisons, and deterministic explanations.
    """

    __tablename__ = "simulation_scenarios"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    scenario_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default=ScenarioType.MATCHING.value, index=True
    )

    # Reference target (e.g., Challenge ID or Pilot ID)
    target_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    target_title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Parameters
    input_parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    baseline_parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    # Result snapshot
    results_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Creator information
    created_by_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_by_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<SimulationScenario id='{self.id}' title='{self.title}' type='{self.scenario_type}'>"
