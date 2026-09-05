"""
Authentication-related Pydantic schemas.
"""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Credentials for login."""
    email: str
    password: str


class UserResponse(BaseModel):
    """User data returned to the client (never includes password)."""
    id: str
    email: str
    name: str
    role: str
    department: str | None = None
    department_id: str | None = None
    avatar: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token + embedded user data returned on successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
