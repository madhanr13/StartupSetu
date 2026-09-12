"""
Database engine, session factory, and declarative base.

In development mode (or when PostgreSQL is unavailable), falls back to SQLite
so the application shell can run without Docker infrastructure.
"""

from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def _get_engine_url() -> str:
    """Resolve the database URL — use SQLite fallback in dev/demo mode."""
    if settings.demo_mode:
        # SQLite file in the backend directory for easy development
        return "sqlite:///./sih26136_demo.db"
    return settings.database_url


engine = create_engine(
    _get_engine_url(),
    # SQLite needs check_same_thread=False for FastAPI's threaded usage
    connect_args=(
        {"check_same_thread": False}
        if _get_engine_url().startswith("sqlite")
        else {}
    ),
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models."""
    pass


def get_db() -> Session:
    """
    FastAPI dependency — yields a database session per request.

    Usage:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all tables defined by Base subclasses and run lightweight schema updates."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("ALTER TABLE audit_events ADD COLUMN ip_address VARCHAR(45);"))
            conn.commit()
    except Exception:
        pass  # Column already exists or table does not need migration
