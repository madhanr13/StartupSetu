"""
Startup API endpoints.

GET  /api/startups       — search & filter startup directory
GET  /api/startups/{id}  — startup detailed capability profile
POST /api/startups       — create/register a new startup profile
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.services.startup_service import startup_service
from app.schemas.startup import (
    StartupResponse,
    StartupSummary,
    StartupCreateInput,
)

router = APIRouter(tags=["Startups"])


@router.get("/startups")
def list_startups(
    search: Optional[str] = Query(None, description="Search across name, description, tech, domain, projects"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    technology: Optional[str] = Query(None, description="Filter by technology"),
    location: Optional[str] = Query(None, description="Filter by location"),
    min_readiness: Optional[float] = Query(None, ge=0, le=100, description="Minimum readiness score"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List and filter registered startup capability profiles.
    """
    items, total = startup_service.list_startups(
        db=db,
        search=search,
        domain=domain,
        technology=technology,
        min_readiness=min_readiness,
        location=location,
        page=page,
        limit=limit,
    )

    pages = (total + limit - 1) // limit if total > 0 else 1

    # Convert to summary models
    summaries = []
    for s in items:
        tech_list = [t.technology for t in getattr(s, "technologies", [])]
        dom_list = [d.domain for d in getattr(s, "domains", [])]
        summaries.append(
            StartupSummary(
                id=s.id,
                company_name=s.company_name,
                slug=s.slug,
                short_description=s.short_description,
                founded_year=s.founded_year,
                location=s.location,
                website=s.website,
                logo_url=s.logo_url,
                employee_count=s.employee_count,
                dpiit_recognized=s.dpiit_recognized,
                readiness_score=s.readiness_score,
                technologies=tech_list,
                domains=dom_list,
            )
        )

    return {
        "items": summaries,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit,
    }


@router.get("/startups/{startup_id}", response_model=StartupResponse)
def get_startup_detail(
    startup_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get full capability profile for a single startup.
    """
    startup = startup_service.get_startup_by_id(db, startup_id)
    if not startup:
        # Check by slug as fallback
        startup = startup_service.get_startup_by_slug(db, startup_id)

    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup with ID or slug '{startup_id}' not found",
        )

    return startup


@router.post("/startups", response_model=StartupResponse, status_code=status.HTTP_201_CREATED)
def create_startup(
    input_data: StartupCreateInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new startup capability profile.
    Restricted to STARTUP role or ADMIN.
    """
    if current_user.role not in [UserRole.STARTUP, UserRole.ADMIN, UserRole.GOVERNMENT_OFFICER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to create startup profiles",
        )

    return startup_service.create_startup(db, input_data)
