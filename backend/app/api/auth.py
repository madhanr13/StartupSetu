"""
Authentication API endpoints.

POST /api/auth/login   — authenticate and return JWT
POST /api/auth/logout  — client-side token removal (audit endpoint)
GET  /api/auth/me      — return current user from JWT
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import authenticate_user, create_token_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate with email and password.
    Returns a JWT access token and user profile.
    """
    user = authenticate_user(db, request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_token_response(user)


@router.post("/logout")
def logout(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """
    Logout endpoint for audit trail purposes.
    Actual token invalidation happens client-side (token removal).
    In a production system, this would add the token to a deny-list.
    """
    return {
        "message": "Successfully logged out",
        "user": current_user.email,
    }


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """
    Return the currently authenticated user's profile.
    Used by the frontend to validate stored tokens on page load.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        department=current_user.department.name if current_user.department else None,
        department_id=current_user.department_id,
        avatar=current_user.avatar,
        is_active=current_user.is_active,
    )
