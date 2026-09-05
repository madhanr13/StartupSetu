"""
Health check endpoint.
"""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Return application health status."""
    return {
        "status": "ok",
        "version": "0.1.0",
        "service": "SIH26136 — Innovation Procurement Platform",
    }
