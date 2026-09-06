"""
Challenge API endpoints.

GET    /api/challenges              — list challenges (filtered, paginated)
GET    /api/challenges/{id}         — challenge detail
POST   /api/challenges              — create challenge (GOVERNMENT_OFFICER)
PUT    /api/challenges/{id}         — update challenge (owner / ADMIN)
POST   /api/challenges/{id}/publish — publish challenge (owner)
DELETE /api/challenges/{id}         — delete draft challenge (owner / ADMIN)
POST   /api/challenges/structure    — AI structuring (GOVERNMENT_OFFICER)
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.challenge import (
    AIStructureRequest,
    AIStructureResponse,
    ChallengeCreate,
    ChallengeListResponse,
    ChallengeResponse,
    ChallengeUpdate,
)
from app.services.challenge_service import (
    create_challenge,
    delete_challenge,
    get_challenge_response,
    list_challenges,
    publish_challenge,
    update_challenge,
)
from app.ai.challenge_analyzer import get_challenge_analyzer

router = APIRouter(prefix="/challenges", tags=["Challenges"])


# ── List & Read ──────────────────────────────────────────────────────────────


@router.get("", response_model=ChallengeListResponse)
def list_challenges_endpoint(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    domain: str | None = Query(None),
) -> ChallengeListResponse:
    """List challenges with optional filters and pagination."""
    # Government officers see all; other roles only see published+
    created_by = None
    if current_user.role == UserRole.GOVERNMENT_OFFICER:
        # Gov officers see all their own + all published challenges
        pass
    # For now, all authenticated users can list all challenges

    return list_challenges(
        db,
        page=page,
        page_size=page_size,
        search=search,
        status=status_filter,
        domain=domain,
        created_by=created_by,
    )


@router.get("/{challenge_id}", response_model=ChallengeResponse)
def get_challenge_endpoint(
    challenge_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> ChallengeResponse:
    """Get a single challenge by ID."""
    result = get_challenge_response(db, challenge_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
    return result


# ── Create & Update ──────────────────────────────────────────────────────────


@router.post("", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge_endpoint(
    data: ChallengeCreate,
    current_user: Annotated[
        User, Depends(require_roles(UserRole.GOVERNMENT_OFFICER))
    ],
    db: Session = Depends(get_db),
) -> ChallengeResponse:
    """Create a new challenge (GOVERNMENT_OFFICER only)."""
    return create_challenge(db, data, current_user)


@router.put("/{challenge_id}", response_model=ChallengeResponse)
def update_challenge_endpoint(
    challenge_id: str,
    data: ChallengeUpdate,
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)),
    ],
    db: Session = Depends(get_db),
) -> ChallengeResponse:
    """Update an existing challenge (owner or ADMIN, DRAFT only)."""
    try:
        result = update_challenge(db, challenge_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
    return result


# ── Publish ──────────────────────────────────────────────────────────────────


@router.post("/{challenge_id}/publish", response_model=ChallengeResponse)
def publish_challenge_endpoint(
    challenge_id: str,
    current_user: Annotated[
        User, Depends(require_roles(UserRole.GOVERNMENT_OFFICER))
    ],
    db: Session = Depends(get_db),
) -> ChallengeResponse:
    """Publish a DRAFT challenge (creator only)."""
    try:
        result = publish_challenge(db, challenge_id, current_user)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )
    return result


# ── Delete ───────────────────────────────────────────────────────────────────


@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_challenge_endpoint(
    challenge_id: str,
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.GOVERNMENT_OFFICER, UserRole.ADMIN)),
    ],
    db: Session = Depends(get_db),
) -> None:
    """Delete a DRAFT challenge (owner or ADMIN)."""
    try:
        success = delete_challenge(db, challenge_id, current_user)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )


# ── AI Structuring ───────────────────────────────────────────────────────────


@router.post("/structure", response_model=AIStructureResponse)
async def structure_challenge_endpoint(
    data: AIStructureRequest,
    current_user: Annotated[
        User, Depends(require_roles(UserRole.GOVERNMENT_OFFICER))
    ],
) -> AIStructureResponse:
    """
    AI-assisted challenge structuring.
    Takes an unstructured problem statement and returns a structured challenge.
    GOVERNMENT_OFFICER only.
    """
    analyzer = get_challenge_analyzer()
    result = await analyzer.analyze(data.problem_statement, data.domain)
    return result
