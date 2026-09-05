"""
Authentication service — business logic for login and token management.

Keeps authentication logic OUT of route handlers and React components.
"""

from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import TokenResponse, UserResponse


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Verify credentials and return the User if valid, else None.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_token_response(user: User) -> TokenResponse:
    """
    Create a JWT access token and wrap it with user data.
    """
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value,
    }
    access_token = create_access_token(data=token_data)

    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        department=user.department.name if user.department else None,
        department_id=user.department_id,
        avatar=user.avatar,
        is_active=user.is_active,
    )

    return TokenResponse(
        access_token=access_token,
        user=user_resp,
    )
