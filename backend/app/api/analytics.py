"""
Analytics & Decision Intelligence API Routes.
Exposes overview metrics, challenge analytics, startup intelligence, pilot telemetry,
pipeline funnel, deterministic bottlenecks, structured AI insights, and exportable reports.
Enforces strict RBAC to shield government analytics from unauthorized roles.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.ai.analytics_insights import AIInsightService
from app.api.deps import require_roles
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.analytics import (
    AnalyticsReportExportResponse,
    BottleneckResponse,
    ChallengeAnalyticsResponse,
    OverviewMetricsResponse,
    PilotPerformanceAnalyticsResponse,
    ProcurementPipelineResponse,
    StartupIntelligenceResponse,
    StructuredInsightsResponse,
)
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & Decision Intelligence"],
    dependencies=[
        Depends(
            require_roles(
                UserRole.GOVERNMENT_OFFICER,
                UserRole.ADMIN,
                UserRole.AUDITOR,
            )
        )
    ],
)

insight_service = AIInsightService()


@router.get(
    "/overview",
    response_model=OverviewMetricsResponse,
    summary="Get platform macro procurement metrics & averages",
)
def get_overview_metrics(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Returns platform overview counts, average evaluation scores, and KPI achievements."""
    return AnalyticsService.get_overview_metrics(db, user)


@router.get(
    "/challenges",
    response_model=ChallengeAnalyticsResponse,
    summary="Get challenge participation, conversion, and score distributions",
)
def get_challenge_analytics(
    challenge_id: Optional[str] = Query(None, description="Filter for single challenge"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Returns per-challenge participation funnel, conversion rate, and score distributions."""
    return AnalyticsService.get_challenge_analytics(db, user, challenge_id=challenge_id)


@router.get(
    "/startups",
    response_model=StartupIntelligenceResponse,
    summary="Get calculated startup performance profiles and radar dimensions",
)
def get_startup_intelligence(
    startup_id: Optional[str] = Query(None, description="Filter for single startup"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Calculates multi-dimensional performance radar scores from actual platform data."""
    return AnalyticsService.get_startup_intelligence(db, user, startup_id=startup_id)


@router.get(
    "/pilots",
    response_model=PilotPerformanceAnalyticsResponse,
    summary="Get pilot milestone completion, time-series KPI trends, and risks",
)
def get_pilot_performance(
    pilot_id: Optional[str] = Query(None, description="Filter for single pilot"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Returns pilot execution telemetry, milestone completion rates, and time-series KPI measurements."""
    return AnalyticsService.get_pilot_performance_analytics(db, user, pilot_id=pilot_id)


@router.get(
    "/pipeline",
    response_model=ProcurementPipelineResponse,
    summary="Get 9-stage procurement pipeline with conversion and drop-off rates",
)
def get_procurement_pipeline(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Returns visual procurement pipeline with counts and step-to-step drop-off percentages."""
    return AnalyticsService.get_procurement_pipeline(db, user)


@router.get(
    "/bottlenecks",
    response_model=BottleneckResponse,
    summary="Get deterministic bottlenecks across challenges, proposals, pilots, and scale-up",
)
def get_bottlenecks(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Detects deterministic operational bottlenecks across all procurement lifecycle stages."""
    return AnalyticsService.get_bottlenecks(db, user)


@router.get(
    "/insights",
    response_model=StructuredInsightsResponse,
    summary="Get structured AI & rule-based decision intelligence insights",
)
def get_insights(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Returns structured decisions support insights backed by verified database evidence."""
    return insight_service.generate_insights(db, user)


@router.get(
    "/export/report",
    response_model=AnalyticsReportExportResponse,
    summary="Export intelligence report for challenge, pilot, or platform overview",
)
def export_summary_report(
    type: str = Query("PLATFORM", description="Entity type: 'CHALLENGE', 'PILOT', or 'PLATFORM'"),
    id: Optional[str] = Query(None, description="Entity ID if type is CHALLENGE or PILOT"),
    format: str = Query("markdown", description="Format: 'markdown' or 'json'"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN, UserRole.AUDITOR)),
):
    """Generates an exportable comprehensive intelligence report."""
    try:
        return AnalyticsService.export_summary_report(db, user, entity_type=type, entity_id=id, export_format=format)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
