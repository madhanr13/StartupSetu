"""
Models package — re-exports all SQLAlchemy models and the declarative Base.
"""

from app.core.database import Base
from app.models.department import Department
from app.models.user import User, UserRole

__all__ = ["Base", "User", "UserRole", "Department"]
