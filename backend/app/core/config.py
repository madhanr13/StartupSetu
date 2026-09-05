"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "SIH26136"
    app_env: str = "development"
    debug: bool = True
    demo_mode: bool = True  # Use SQLite + seed data for development

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # JWT
    jwt_secret_key: str = "change-this-to-a-random-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # Database
    database_url: str = "postgresql://sih26136:changeme@localhost:5432/sih26136_db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # MinIO / S3
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "sih26136-proposals"
    minio_use_ssl: bool = False

    # AI / LLM
    llm_api_key: str = ""
    llm_model: str = "gemini-pro"
    embedding_model: str = "all-MiniLM-L6-v2"

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.backend_cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
