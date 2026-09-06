"""
Challenge service — business logic for challenge CRUD and lifecycle.

All business rules live here; API routes stay thin.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.challenge import (
    Challenge,
    ChallengeEvaluationCriterion,
    ChallengeKPI,
    ChallengeRequirement,
    ChallengeStatus,
)
from app.models.user import User, UserRole
from app.schemas.challenge import (
    ChallengeCreate,
    ChallengeListItem,
    ChallengeListResponse,
    ChallengeResponse,
    ChallengeUpdate,
    EvalCriterionResponse,
    KPIResponse,
    RequirementResponse,
)

logger = logging.getLogger(__name__)


# ── Helpers ──────────────────────────────────────────────────────────────────


def _challenge_to_response(challenge: Challenge) -> ChallengeResponse:
    """Convert a Challenge ORM object to a ChallengeResponse schema."""
    return ChallengeResponse(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        problem_statement=challenge.problem_statement,
        domain=challenge.domain,
        status=challenge.status.value,
        budget_min=challenge.budget_min,
        budget_max=challenge.budget_max,
        pilot_duration_weeks=challenge.pilot_duration_weeks,
        deadline=challenge.deadline,
        department_id=challenge.department_id,
        department_name=challenge.department.name if challenge.department else None,
        created_by=challenge.created_by,
        creator_name=challenge.creator.name if challenge.creator else None,
        published_at=challenge.published_at,
        created_at=challenge.created_at,
        updated_at=challenge.updated_at,
        requirements=[
            RequirementResponse(
                id=r.id,
                description=r.description,
                is_mandatory=r.is_mandatory,
                order=r.order,
            )
            for r in challenge.requirements
        ],
        kpis=[
            KPIResponse(
                id=k.id,
                name=k.name,
                description=k.description,
                target_value=k.target_value,
                unit=k.unit,
                weight=k.weight,
            )
            for k in challenge.kpis
        ],
        evaluation_criteria=[
            EvalCriterionResponse(
                id=e.id,
                name=e.name,
                description=e.description,
                weight=e.weight,
                max_score=e.max_score,
            )
            for e in challenge.evaluation_criteria
        ],
        proposal_count=0,  # No proposals table yet
    )


def _challenge_to_list_item(challenge: Challenge) -> ChallengeListItem:
    """Convert a Challenge ORM object to a ChallengeListItem schema."""
    return ChallengeListItem(
        id=challenge.id,
        title=challenge.title,
        domain=challenge.domain,
        status=challenge.status.value,
        department_name=challenge.department.name if challenge.department else None,
        budget_min=challenge.budget_min,
        budget_max=challenge.budget_max,
        pilot_duration_weeks=challenge.pilot_duration_weeks,
        deadline=challenge.deadline,
        published_at=challenge.published_at,
        created_at=challenge.created_at,
        proposal_count=0,
    )


# ── CRUD Operations ─────────────────────────────────────────────────────────


def create_challenge(
    db: Session, data: ChallengeCreate, user: User
) -> ChallengeResponse:
    """Create a new challenge in DRAFT status."""
    challenge = Challenge(
        title=data.title,
        description=data.description,
        problem_statement=data.problem_statement,
        domain=data.domain,
        status=ChallengeStatus.DRAFT,
        budget_min=data.budget_min,
        budget_max=data.budget_max,
        pilot_duration_weeks=data.pilot_duration_weeks,
        deadline=data.deadline,
        department_id=user.department_id,
        created_by=user.id,
    )
    db.add(challenge)
    db.flush()  # Get the challenge ID

    # Add nested children
    for i, req in enumerate(data.requirements):
        db.add(
            ChallengeRequirement(
                challenge_id=challenge.id,
                description=req.description,
                is_mandatory=req.is_mandatory,
                order=req.order if req.order else i,
            )
        )

    for kpi in data.kpis:
        db.add(
            ChallengeKPI(
                challenge_id=challenge.id,
                name=kpi.name,
                description=kpi.description,
                target_value=kpi.target_value,
                unit=kpi.unit,
                weight=kpi.weight,
            )
        )

    for ec in data.evaluation_criteria:
        db.add(
            ChallengeEvaluationCriterion(
                challenge_id=challenge.id,
                name=ec.name,
                description=ec.description,
                weight=ec.weight,
                max_score=ec.max_score,
            )
        )

    db.commit()
    db.refresh(challenge)
    logger.info("Created challenge %s by user %s", challenge.id, user.email)
    return _challenge_to_response(challenge)


def get_challenge(db: Session, challenge_id: str) -> Challenge | None:
    """Fetch a challenge by ID with all relationships loaded."""
    return db.query(Challenge).filter(Challenge.id == challenge_id).first()


def get_challenge_response(db: Session, challenge_id: str) -> ChallengeResponse | None:
    """Fetch a challenge by ID and return as response schema."""
    challenge = get_challenge(db, challenge_id)
    if challenge is None:
        return None
    return _challenge_to_response(challenge)


def list_challenges(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status: str | None = None,
    domain: str | None = None,
    created_by: str | None = None,
) -> ChallengeListResponse:
    """Return a filtered, paginated list of challenges."""
    query = db.query(Challenge)

    # Filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Challenge.title.ilike(search_term)
            | Challenge.description.ilike(search_term)
            | Challenge.domain.ilike(search_term)
        )

    if status:
        try:
            status_enum = ChallengeStatus(status)
            query = query.filter(Challenge.status == status_enum)
        except ValueError:
            pass  # Invalid status — ignore filter

    if domain:
        query = query.filter(Challenge.domain.ilike(f"%{domain}%"))

    if created_by:
        query = query.filter(Challenge.created_by == created_by)

    # Count before pagination
    total = query.count()

    # Order and paginate
    challenges = (
        query.order_by(Challenge.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ChallengeListResponse(
        items=[_challenge_to_list_item(c) for c in challenges],
        total=total,
        page=page,
        page_size=page_size,
    )


def update_challenge(
    db: Session,
    challenge_id: str,
    data: ChallengeUpdate,
    user: User,
) -> ChallengeResponse | None:
    """
    Update a challenge. Only allowed if:
    - Challenge is in DRAFT status
    - User is the creator OR an ADMIN
    """
    challenge = get_challenge(db, challenge_id)
    if challenge is None:
        return None

    # Authorization
    if challenge.created_by != user.id and user.role != UserRole.ADMIN:
        raise PermissionError("Not authorized to update this challenge")

    if challenge.status != ChallengeStatus.DRAFT:
        raise ValueError("Only DRAFT challenges can be edited")

    # Update scalar fields
    update_fields = data.model_dump(exclude_unset=True, exclude={"requirements", "kpis", "evaluation_criteria"})
    for field, value in update_fields.items():
        setattr(challenge, field, value)

    # Replace nested children if provided
    if data.requirements is not None:
        # Remove existing
        db.query(ChallengeRequirement).filter(
            ChallengeRequirement.challenge_id == challenge_id
        ).delete()
        for i, req in enumerate(data.requirements):
            db.add(
                ChallengeRequirement(
                    challenge_id=challenge_id,
                    description=req.description,
                    is_mandatory=req.is_mandatory,
                    order=req.order if req.order else i,
                )
            )

    if data.kpis is not None:
        db.query(ChallengeKPI).filter(
            ChallengeKPI.challenge_id == challenge_id
        ).delete()
        for kpi in data.kpis:
            db.add(
                ChallengeKPI(
                    challenge_id=challenge_id,
                    name=kpi.name,
                    description=kpi.description,
                    target_value=kpi.target_value,
                    unit=kpi.unit,
                    weight=kpi.weight,
                )
            )

    if data.evaluation_criteria is not None:
        db.query(ChallengeEvaluationCriterion).filter(
            ChallengeEvaluationCriterion.challenge_id == challenge_id
        ).delete()
        for ec in data.evaluation_criteria:
            db.add(
                ChallengeEvaluationCriterion(
                    challenge_id=challenge_id,
                    name=ec.name,
                    description=ec.description,
                    weight=ec.weight,
                    max_score=ec.max_score,
                )
            )

    db.commit()
    db.refresh(challenge)
    logger.info("Updated challenge %s by user %s", challenge_id, user.email)
    return _challenge_to_response(challenge)


def publish_challenge(
    db: Session, challenge_id: str, user: User
) -> ChallengeResponse | None:
    """
    Transition a challenge from DRAFT → PUBLISHED.
    Validates that the challenge has minimum required data.
    """
    challenge = get_challenge(db, challenge_id)
    if challenge is None:
        return None

    # Authorization — only the creator can publish
    if challenge.created_by != user.id:
        raise PermissionError("Only the challenge creator can publish")

    if challenge.status != ChallengeStatus.DRAFT:
        raise ValueError(f"Cannot publish a challenge in {challenge.status.value} status")

    # Validation — ensure minimum data is present
    errors = []
    if not challenge.title or len(challenge.title.strip()) < 5:
        errors.append("Title must be at least 5 characters")
    if not challenge.description or len(challenge.description.strip()) < 20:
        errors.append("Description must be at least 20 characters")
    if not challenge.requirements:
        errors.append("At least one requirement is needed")
    if not challenge.kpis:
        errors.append("At least one KPI is needed")
    if not challenge.evaluation_criteria:
        errors.append("At least one evaluation criterion is needed")

    if errors:
        raise ValueError("Challenge is incomplete: " + "; ".join(errors))

    challenge.status = ChallengeStatus.PUBLISHED
    challenge.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(challenge)
    logger.info("Published challenge %s by user %s", challenge_id, user.email)
    return _challenge_to_response(challenge)


def delete_challenge(
    db: Session, challenge_id: str, user: User
) -> bool:
    """
    Delete a challenge. Only DRAFT challenges can be deleted.
    Only the creator or ADMIN can delete.
    """
    challenge = get_challenge(db, challenge_id)
    if challenge is None:
        return False

    if challenge.created_by != user.id and user.role != UserRole.ADMIN:
        raise PermissionError("Not authorized to delete this challenge")

    if challenge.status != ChallengeStatus.DRAFT:
        raise ValueError("Only DRAFT challenges can be deleted")

    db.delete(challenge)
    db.commit()
    logger.info("Deleted challenge %s by user %s", challenge_id, user.email)
    return True
