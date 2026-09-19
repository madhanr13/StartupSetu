"""
Simulations API — What-If Procurement Decision Sandbox.

Exposes decision-support simulation endpoints allowing authorized government
officers and administrators to evaluate alternative weighting models and pilot
thresholds without altering official records.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.simulation import (
    MatchingSimulationRequest,
    MatchingSimulationResponse,
    PilotSimulationRequest,
    PilotSimulationResponse,
    ScenarioCreateRequest,
    ScenarioResponse,
)
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/simulations", tags=["What-If Procurement Simulations"])


@router.post(
    "/matching",
    response_model=MatchingSimulationResponse,
    summary="Run Startup Matching What-If Simulation",
)
def run_matching_simulation(
    request: MatchingSimulationRequest,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """
    Simulate startup ranking outcomes for a challenge using custom factor weights.
    Calculations run in-memory and NEVER mutate official challenge, startup, or settings data.
    """
    return simulation_service.run_matching_simulation(db=db, request=request)


@router.post(
    "/pilot",
    response_model=PilotSimulationResponse,
    summary="Run Pilot Decision What-If Simulation",
)
def run_pilot_simulation(
    request: PilotSimulationRequest,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """
    Simulate pilot outcome recommendation (SCALE vs EXTEND vs REJECT) using alternative
    decision thresholds. Runs in-memory without altering official pilot data.
    """
    return simulation_service.run_pilot_simulation(db=db, request=request)


@router.get(
    "/scenarios",
    response_model=List[ScenarioResponse],
    summary="List Saved Simulation Scenarios",
)
def list_scenarios(
    scenario_type: Optional[str] = Query(None, description="Filter by MATCHING or PILOT_DECISION"),
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Retrieve all previously saved what-if simulation scenarios."""
    return simulation_service.list_scenarios(db=db, scenario_type=scenario_type)


@router.post(
    "/scenarios",
    response_model=ScenarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a What-If Simulation Scenario",
)
def save_scenario(
    payload: ScenarioCreateRequest,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)
    ),
    db: Session = Depends(get_db),
):
    """
    Save a simulation scenario comparison. Generates an audit trail entry.
    Does NOT modify actual procurement decisions or configurations.
    """
    return simulation_service.save_scenario(db=db, payload=payload, actor=current_user)


@router.get(
    "/scenarios/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Get a Saved Simulation Scenario",
)
def get_scenario(
    scenario_id: str,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)
    ),
    db: Session = Depends(get_db),
):
    """Fetch details of a single saved simulation scenario."""
    return simulation_service.get_scenario(db=db, scenario_id=scenario_id)


@router.delete(
    "/scenarios/{scenario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Saved Simulation Scenario",
)
def delete_scenario(
    scenario_id: str,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)
    ),
    db: Session = Depends(get_db),
):
    """Delete a saved scenario."""
    simulation_service.delete_scenario(db=db, scenario_id=scenario_id, actor=current_user)
    return None
