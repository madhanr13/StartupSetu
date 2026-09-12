"""
Innovation Memory API — Institutional knowledge and past procurement intelligence.

Enables government officers to explore lessons learned, success/failure patterns,
and related prior innovations to inform new procurement initiatives.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.innovation_memory import (
    InnovationMemoryCreate,
    InnovationMemoryListResponse,
    InnovationMemoryResponse,
    InnovationMemoryUpdate,
    RelatedMemoryItem,
)
from app.services.innovation_memory_service import InnovationMemoryService

router = APIRouter(prefix="/innovation-memory", tags=["Innovation Memory"])


@router.get("", response_model=InnovationMemoryListResponse)
def list_innovation_memories(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    outcome: Optional[str] = Query(None, description="Filter by outcome (SCALE, EXTEND, REJECT)"),
    technology: Optional[str] = Query(None, description="Filter by technology"),
    search: Optional[str] = Query(None, description="Search by title, summary, or startup name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List institutional innovation memory records with pagination and filters."""
    result = InnovationMemoryService.list_memories(
        db=db,
        page=page,
        page_size=page_size,
        domain=domain,
        outcome=outcome,
        technology=technology,
        search=search,
    )
    return result


@router.get("/related/{challenge_id}", response_model=List[RelatedMemoryItem])
def get_related_memories(
    challenge_id: str,
    limit: int = Query(5, ge=1, le=20, description="Max memories to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Find prior innovation memory entries relevant to the specified challenge."""
    memories = InnovationMemoryService.find_related_memories(
        db=db, challenge_id=challenge_id, limit=limit
    )
    return memories


@router.get("/startup/{startup_id}", response_model=List[InnovationMemoryResponse])
def get_startup_history(
    startup_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve historical innovation memory records involving a specific startup."""
    memories = InnovationMemoryService.get_startup_platform_history(
        db=db, startup_id=startup_id
    )
    return memories


@router.get("/{id}", response_model=InnovationMemoryResponse)
def get_innovation_memory(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details of a specific innovation memory entry."""
    memory = InnovationMemoryService.get_memory(db=db, memory_id=id)
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Innovation memory with ID '{id}' not found",
        )
    return memory


@router.post("", response_model=InnovationMemoryResponse, status_code=status.HTTP_201_CREATED)
def create_innovation_memory(
    payload: InnovationMemoryCreate,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)
    ),
    db: Session = Depends(get_db),
):
    """Manually create an institutional knowledge / innovation memory entry."""
    memory = InnovationMemoryService.create_manual_memory(
        db=db, data=payload, actor=current_user
    )
    return memory


@router.patch("/{id}", response_model=InnovationMemoryResponse)
def update_innovation_memory(
    id: str,
    payload: InnovationMemoryUpdate,
    current_user: User = Depends(
        require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)
    ),
    db: Session = Depends(get_db),
):
    """Update lessons learned, recommendations, or summary of an innovation memory entry."""
    memory = InnovationMemoryService.update_memory(
        db=db, memory_id=id, data=payload
    )
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Innovation memory with ID '{id}' not found",
        )
    return memory
