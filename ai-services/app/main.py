import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import health, generate, validate, match, analyze, timetable
from app.exceptions.ai_exceptions import AiServiceException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ACADRO AI Services",
    description="Centralized AI service layer for ACADRO. All AI logic lives here.",
    version="1.0.0",
)

# CORS — allow the Spring Boot backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(generate.router)
app.include_router(validate.router)
app.include_router(match.router)
app.include_router(analyze.router)
app.include_router(timetable.router)


@app.exception_handler(AiServiceException)
async def ai_service_exception_handler(request: Request, exc: AiServiceException):
    """Global handler for AI service exceptions."""
    logger.error("AI Service Error: %s (status=%d)", exc.detail, exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected errors."""
    logger.error("Unexpected error: %s", str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected internal error occurred."},
    )


@app.get("/", tags=["Health"])
async def root():
    return {"service": "ACADRO AI Services", "status": "running", "version": "1.0.0"}

# Trigger reload
