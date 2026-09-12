"""
Startup Service — Business logic for Startup CRUD and directory filtering.
"""

from typing import List, Optional, Tuple, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func

from app.models.startup import (
    Startup,
    StartupTechnology,
    StartupDomain,
    StartupProject,
    StartupCertification,
    StartupTeamCapability,
    StartupDeployment,
    StartupReadinessScore,
)
from app.schemas.startup import StartupCreateInput


class StartupService:

    def list_startups(
        self,
        db: Session,
        search: Optional[str] = None,
        domain: Optional[str] = None,
        technology: Optional[str] = None,
        min_readiness: Optional[float] = None,
        location: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[Startup], int]:
        """
        List startups with full-text search and multi-attribute filters.
        """
        query = (
            db.query(Startup)
            .options(
                joinedload(Startup.technologies),
                joinedload(Startup.domains),
                joinedload(Startup.readiness_score),
            )
        )

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.outerjoin(Startup.technologies).outerjoin(Startup.domains).outerjoin(Startup.projects)
            query = query.filter(
                or_(
                    Startup.company_name.ilike(search_pattern),
                    Startup.short_description.ilike(search_pattern),
                    Startup.description.ilike(search_pattern),
                    Startup.location.ilike(search_pattern),
                    StartupTechnology.technology.ilike(search_pattern),
                    StartupDomain.domain.ilike(search_pattern),
                    StartupProject.name.ilike(search_pattern),
                )
            ).distinct()

        if domain:
            query = query.join(Startup.domains).filter(
                StartupDomain.domain.ilike(f"%{domain}%")
            )

        if technology:
            query = query.join(Startup.technologies).filter(
                StartupTechnology.technology.ilike(f"%{technology}%")
            )

        if location:
            query = query.filter(Startup.location.ilike(f"%{location}%"))

        if min_readiness is not None:
            query = query.join(Startup.readiness_score).filter(
                StartupReadinessScore.overall_score >= min_readiness
            )

        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(Startup.company_name.asc()).offset(offset).limit(limit).all()

        return items, total

    def get_startup_by_id(self, db: Session, startup_id: str) -> Optional[Startup]:
        """
        Fetch a single startup with all child relationships loaded.
        """
        return (
            db.query(Startup)
            .options(
                joinedload(Startup.technologies),
                joinedload(Startup.domains),
                joinedload(Startup.projects),
                joinedload(Startup.certifications),
                joinedload(Startup.team_capabilities),
                joinedload(Startup.deployments),
                joinedload(Startup.readiness_score),
            )
            .filter(Startup.id == startup_id)
            .first()
        )

    def get_startup_by_slug(self, db: Session, slug: str) -> Optional[Startup]:
        return (
            db.query(Startup)
            .options(
                joinedload(Startup.technologies),
                joinedload(Startup.domains),
                joinedload(Startup.projects),
                joinedload(Startup.certifications),
                joinedload(Startup.team_capabilities),
                joinedload(Startup.deployments),
                joinedload(Startup.readiness_score),
            )
            .filter(Startup.slug == slug)
            .first()
        )

    def create_startup(self, db: Session, input_data: StartupCreateInput) -> Startup:
        """
        Create a new startup record with nested child objects.
        """
        slug = input_data.company_name.lower().replace(" ", "-").replace("&", "and")
        existing = db.query(Startup).filter(Startup.slug == slug).first()
        if existing:
            slug = f"{slug}-{func.substr(func.uuid(), 1, 4)}"

        startup = Startup(
            company_name=input_data.company_name,
            slug=slug,
            short_description=input_data.short_description,
            description=input_data.description,
            founded_year=input_data.founded_year,
            location=input_data.location,
            website=input_data.website,
            contact_email=input_data.contact_email,
            logo_url=input_data.logo_url,
            employee_count=input_data.employee_count,
            dpiit_recognized=input_data.dpiit_recognized,
            dpiit_number=input_data.dpiit_number,
        )
        db.add(startup)
        db.flush()

        # Add child items
        for t in input_data.technologies:
            db.add(
                StartupTechnology(
                    startup_id=startup.id,
                    technology=t.technology,
                    proficiency=t.proficiency,
                    description=t.description,
                )
            )

        for dom in input_data.domains:
            db.add(StartupDomain(startup_id=startup.id, domain=dom))

        for p in input_data.projects:
            db.add(
                StartupProject(
                    startup_id=startup.id,
                    name=p.name,
                    description=p.description,
                    domain=p.domain,
                    technologies=p.technologies,
                    outcome=p.outcome,
                    deployment_scale=p.deployment_scale,
                    client_type=p.client_type,
                    year=p.year,
                )
            )

        for c in input_data.certifications:
            db.add(
                StartupCertification(
                    startup_id=startup.id,
                    name=c.name,
                    issuing_authority=c.issuing_authority,
                    issue_date=c.issue_date,
                    expiry_date=c.expiry_date,
                )
            )

        for tc in input_data.team_capabilities:
            db.add(
                StartupTeamCapability(
                    startup_id=startup.id,
                    capability=tc.capability,
                    experience_years=tc.experience_years,
                    description=tc.description,
                )
            )

        for dep in input_data.deployments:
            db.add(
                StartupDeployment(
                    startup_id=startup.id,
                    project_id=dep.project_id,
                    deployment_type=dep.deployment_type,
                    deployment_scale=dep.deployment_scale,
                    region=dep.region,
                    status=dep.status,
                )
            )

        # Create Readiness Score
        score_data = input_data.readiness_score
        if score_data:
            db.add(
                StartupReadinessScore(
                    startup_id=startup.id,
                    technical_capability=score_data.technical_capability,
                    team_strength=score_data.team_strength,
                    deployment_readiness=score_data.deployment_readiness,
                    security_readiness=score_data.security_readiness,
                    scalability=score_data.scalability,
                    financial_readiness=score_data.financial_readiness,
                    domain_experience=score_data.domain_experience,
                    government_readiness=score_data.government_readiness,
                    overall_score=score_data.overall_score,
                )
            )
        else:
            db.add(StartupReadinessScore(startup_id=startup.id))

        db.commit()
        db.refresh(startup)
        return startup


startup_service = StartupService()
