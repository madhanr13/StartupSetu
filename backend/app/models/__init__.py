"""
Models package — re-exports all SQLAlchemy models and the declarative Base.
"""

from app.core.database import Base
from app.models.department import Department
from app.models.user import User, UserRole
from app.models.challenge import (
    Challenge,
    ChallengeEvaluationCriterion,
    ChallengeKPI,
    ChallengeRequirement,
    ChallengeStatus,
)

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Department",
    "Challenge",
    "ChallengeRequirement",
    "ChallengeKPI",
    "ChallengeEvaluationCriterion",
    "ChallengeStatus",
]
