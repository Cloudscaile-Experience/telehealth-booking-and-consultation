from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from telehealth.db.session import sessionmanager
from telehealth.schemas.health import HealthResponse, ReadinessResponse
from telehealth.utils.config import settings
from telehealth.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/health", response_model=HealthResponse, tags=["health"])  # type: ignore[misc]
async def health() -> HealthResponse:
    """Liveness probe — returns 200 as long as the process is running."""
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/health/ready", response_model=ReadinessResponse, tags=["health"])  # type: ignore[misc]
async def readiness() -> ReadinessResponse:
    """Readiness probe — verifies database connectivity before declaring healthy."""
    db_status = "ok"
    try:
        async with sessionmanager.session() as session:
            await session.execute(text("SELECT 1"))
    except Exception as err:
        logger.warning("Database readiness check failed", extra={"error": str(err)})
        db_status = "unavailable"

    return ReadinessResponse(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )
