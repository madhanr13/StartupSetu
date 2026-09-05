"""
User-related Pydantic schemas for CRUD operations.
"""

from pydantic import BaseModel


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: str
    name: str
    password: str
    role: str
    department_id: str | None = None


class UserUpdate(BaseModel):
    """Schema for updating user fields."""
    name: str | None = None
    email: str | None = None
    role: str | None = None
    department_id: str | None = None
    is_active: bool | None = None


class UserListItem(BaseModel):
    """Compact user representation for lists."""
    id: str
    email: str
    name: str
    role: str
    department: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}
