"""
SIH26136 — AI-Powered Government Innovation Procurement Platform
FastAPI Application Entry Point
"""

import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.challenges import router as challenges_router
from app.api.startups import router as startups_router
from app.api.proposals import router as proposals_router
from app.api.pilots import router as pilots_router
from app.api.procurement import router as procurement_router
from app.api.analytics import router as analytics_router
from app.api.audit_logs import router as audit_logs_router
from app.api.innovation_memory import router as innovation_memory_router
from app.api.settings import router as settings_router
from app.api.simulations import router as simulations_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan — runs on startup and shutdown.
    In demo mode: creates database tables and seeds demo data.
    """
    # Startup
    if settings.demo_mode:
        logger.info("Demo mode enabled — initializing database and seed data.")
        from app.core.database import create_tables, SessionLocal
        from app.core.seed import seed_demo_data

        # Import models so Base.metadata knows about them
        import app.models  # noqa: F401

        create_tables()
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()
        logger.info("Database initialized and demo data seeded.")

    yield

    # Shutdown (nothing to clean up currently)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="SIH26136 — Innovation Procurement Platform",
        description=(
            "AI-Powered Government Innovation Procurement Platform. "
            "Enables government departments to identify, pilot, procure, "
            "and scale innovative solutions from eligible startups."
        ),
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router, prefix="/api")
    app.include_router(auth_router, prefix="/api")
    app.include_router(challenges_router, prefix="/api")
    app.include_router(startups_router, prefix="/api")
    app.include_router(proposals_router, prefix="/api")
    app.include_router(pilots_router, prefix="/api")
    app.include_router(procurement_router, prefix="/api")
    app.include_router(analytics_router, prefix="/api")
    app.include_router(audit_logs_router, prefix="/api")
    app.include_router(innovation_memory_router, prefix="/api")
    app.include_router(settings_router, prefix="/api")
    app.include_router(simulations_router, prefix="/api")

    return app


app = create_app()
