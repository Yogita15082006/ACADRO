import logging

from fastapi import APIRouter

from app.services.ai_service import ai_service
from app.schemas.ai import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.post("/health", response_model=HealthResponse)
async def health_check():
    """Check AI service and Groq API connectivity."""
    groq_online = await ai_service.check_health()
    if groq_online:
        return HealthResponse(
            status="healthy",
            message="AI service is running and Groq API is reachable.",
            groq_online=True,
        )
    return HealthResponse(
        status="degraded",
        message="AI service is running but Groq API is unreachable.",
        groq_online=False,
    )

@router.get("/debug/config")
async def debug_config():
    """Temporary debug endpoint to verify configuration loading."""
    from app.config.settings import settings
    api_key = settings.groq_api_key
    prefix = api_key[:8] + "..." if api_key and api_key != "placeholder_key" else "not_loaded_or_placeholder"
    
    return {
        "api_key_loaded": api_key != "placeholder_key",
        "api_key_prefix": prefix,
        "model": settings.groq_model,
        "base_url": settings.groq_base_url
    }
