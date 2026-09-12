"""
Startup domain models.

Defines Startup profiles, capabilities, technologies, domain experience,
previous projects, deployments, certifications, team strength, and the
general Startup Readiness Score.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Startup(Base):
    """Startup company profile record."""

    __tablename__ = "startups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    company_name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    short_description = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    founded_year = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    employee_count = Column(Integer, nullable=True)
    dpiit_recognized = Column(Boolean, default=True)
    dpiit_number = Column(String(100), nullable=True)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    technologies = relationship(
        "StartupTechnology", back_populates="startup", cascade="all, delete-orphan"
    )
    domains = relationship(
        "StartupDomain", back_populates="startup", cascade="all, delete-orphan"
    )
    projects = relationship(
        "StartupProject", back_populates="startup", cascade="all, delete-orphan"
    )
    certifications = relationship(
        "StartupCertification", back_populates="startup", cascade="all, delete-orphan"
    )
    team_capabilities = relationship(
        "StartupTeamCapability", back_populates="startup", cascade="all, delete-orphan"
    )
    deployments = relationship(
        "StartupDeployment", back_populates="startup", cascade="all, delete-orphan"
    )
    readiness_score = relationship(
        "StartupReadinessScore",
        back_populates="startup",
        uselist=False,
        cascade="all, delete-orphan",
    )


class StartupTechnology(Base):
    """Specific technology stack capability of a startup."""

    __tablename__ = "startup_technologies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    technology = Column(String(100), nullable=False, index=True)
    proficiency = Column(String(50), nullable=True)  # Expert, Advanced, Intermediate
    description = Column(Text, nullable=True)

    startup = relationship("Startup", back_populates="technologies")


class StartupDomain(Base):
    """Industry/Governance domain experience of a startup."""

    __tablename__ = "startup_domains"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    domain = Column(String(150), nullable=False, index=True)

    startup = relationship("Startup", back_populates="domains")


class StartupProject(Base):
    """Previous case study / deployed project by a startup."""

    __tablename__ = "startup_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String(150), nullable=True)
    technologies = Column(JSON, default=list)  # list of tech strings
    outcome = Column(Text, nullable=True)
    deployment_scale = Column(String(150), nullable=True)  # e.g., "50+ junctions"
    client_type = Column(String(150), nullable=True)  # e.g., "Municipal Corp"
    year = Column(Integer, nullable=True)

    startup = relationship("Startup", back_populates="projects")
    deployments = relationship("StartupDeployment", back_populates="project")


class StartupCertification(Base):
    """Security / Quality / Industry certifications held by a startup."""

    __tablename__ = "startup_certifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)  # ISO 27001, SOC2, CERT-In
    issuing_authority = Column(String(255), nullable=True)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)

    startup = relationship("Startup", back_populates="certifications")


class StartupTeamCapability(Base):
    """Key team capability breakdown."""

    __tablename__ = "startup_team_capabilities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    capability = Column(String(150), nullable=False)
    experience_years = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    startup = relationship("Startup", back_populates="team_capabilities")


class StartupDeployment(Base):
    """Field deployment experience record."""

    __tablename__ = "startup_deployments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36), ForeignKey("startups.id", ondelete="CASCADE"), nullable=False
    )
    project_id = Column(
        String(36), ForeignKey("startup_projects.id", ondelete="SET NULL"), nullable=True
    )
    deployment_type = Column(String(100), nullable=False)  # Pilot, Production Scale
    deployment_scale = Column(String(150), nullable=True)
    region = Column(String(150), nullable=True)
    status = Column(String(50), default="Active")  # Active, Completed

    startup = relationship("Startup", back_populates="deployments")
    project = relationship("StartupProject", back_populates="deployments")


class StartupReadinessScore(Base):
    """General Startup Readiness Score (0-100) independent of challenge match."""

    __tablename__ = "startup_readiness_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    startup_id = Column(
        String(36),
        ForeignKey("startups.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    technical_capability = Column(Float, default=80.0)
    team_strength = Column(Float, default=80.0)
    deployment_readiness = Column(Float, default=80.0)
    security_readiness = Column(Float, default=80.0)
    scalability = Column(Float, default=80.0)
    financial_readiness = Column(Float, default=80.0)
    domain_experience = Column(Float, default=80.0)
    government_readiness = Column(Float, default=80.0)
    overall_score = Column(Float, default=80.0)

    calculated_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    startup = relationship("Startup", back_populates="readiness_score")
