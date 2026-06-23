from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from telehealth.api.v1 import availability, bookings, consultations, health, providers
from telehealth.db.session import sessionmanager
from telehealth.utils.config import settings
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)

DOCS_URL = "/open/docs"
REDOC_URL = "/open/redoc"
OPENAPI_URL = "/open/openapi.json"

_HTTP_METHODS = ("get", "post", "put", "patch", "delete", "options", "head")


def _ext_path() -> str:
    """Build the extension base path used in gateway server URLs."""
    return f"/v1/extensions/access/{settings.TENANT_NAME}/{settings.EXTENSION_NAME}/py"


def _build_servers() -> list[dict[str, str]]:
    """Return the ordered server list shown in Swagger UI.

    Hardcoded environment URLs are built from TENANT_NAME / EXTENSION_NAME so the
    template works for any extension without editing this file.  An optional
    GATEWAY_BASE_URL env var appends one more entry (useful for custom deployments).
    """
    ext = _ext_path()
    servers: list[dict[str, str]] = [
        {"url": f"http://localhost:{settings.PORT}", "description": "Local Development Server"},
        {"url": f"https://cs-platform.cloudscaile.com{ext}", "description": "API Gateway - CS Dev"},
        {"url": f"https://chaselist.bestopinions.us{ext}", "description": "API Gateway - Navya Dev"},
        {"url": f"https://chaselist-preproduction.navyanetwork.com{ext}", "description": "API Gateway - Navya Preprod"},
        {"url": f"https://chaselist.navyanetwork.com{ext}", "description": "API Gateway - Navya Prod"},
        *(
            [{"url": settings.GATEWAY_BASE_URL, "description": "API Gateway - From env"}]
            if settings.GATEWAY_BASE_URL is not None
            else []
        ),
    ]
    return servers


def _build_custom_openapi(app: FastAPI) -> Callable[[], dict[str, Any]]:
    """Return a custom openapi() function that:

    - Lists all environment gateway servers (built from TENANT_NAME / EXTENSION_NAME).
    - Adds Bearer and ApiKeyAuth security schemes.
    - Auto-applies ``{"ApiKeyAuth": []}`` to routes under ``/open/api/v1/``.
    - Auto-applies ``{"Bearer": []}``  to all other non-``/open/`` routes.
    """

    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema  # type: ignore[return-value]

        schema = get_openapi(
            title=settings.APP_NAME,
            version=settings.APP_VERSION,
            description=(
                "REST API for the Telehealth Booking & Consultation platform. "
                "Handles slot availability, booking confirmation, video-session token "
                "generation, and post-visit summaries.\n\n"
                "**Authentication:** All `/v1/` routes require a `Bearer` JWT forwarded "
                "from the API gateway. The gateway validates the signature; this service "
                "only decodes the payload to extract user identity."
            ),
            contact={"name": "API Support", "email": "devops@cloudscaile.com"},
            routes=app.routes,
            servers=_build_servers(),
            tags=[
                {"name": "health", "description": "Liveness and readiness probes"},
                {"name": "providers", "description": "Provider directory — browse and manage healthcare providers"},
                {"name": "availability", "description": "Availability slots — manage provider time windows"},
                {"name": "bookings", "description": "Bookings — patients reserve available slots"},
                {
                    "name": "consultations",
                    "description": "Consultations — video session lifecycle and post-visit notes",
                },
            ],
        )

        schema.setdefault("components", {})
        schema["components"]["securitySchemes"] = {
            "Bearer": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": (
                    "JWT token forwarded from the API gateway. "
                    "The gateway validates the signature; this service only reads the payload."
                ),
            },
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "x-api-key",
                "description": "API key for public/webhook endpoints.",
            },
        }

        for path, path_item in schema.get("paths", {}).items():
            for method in _HTTP_METHODS:
                operation = path_item.get(method)
                if not isinstance(operation, dict) or "responses" not in operation:
                    continue

                if path.startswith("/open/api/v1"):
                    # Public API key–protected endpoints (webhooks, integration endpoints)
                    operation.setdefault("security", []).append({"ApiKeyAuth": []})
                elif not path.startswith("/open"):
                    # All domain routes (/v1/*) — Bearer JWT required
                    operation.setdefault("security", []).append({"Bearer": []})
                # /open/* but not /open/api/v1/* → no security (health, docs)

        app.openapi_schema = schema
        return schema  # type: ignore[return-value]

    return custom_openapi


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:  # type: ignore[misc]
    logger.info("Starting Telehealth API", extra={"version": settings.APP_VERSION, "env": settings.ENVIRONMENT})
    await sessionmanager.init(settings.DATABASE_URL)
    yield
    await sessionmanager.close()
    logger.info("Telehealth API shutdown complete")


def create_app() -> FastAPI:
    """Application factory — builds and configures the FastAPI instance.

    Route / auth conventions (same as JS backend):

    +-----------------+----------+---------------------------------------+
    | Prefix          | Security | Purpose                               |
    +-----------------+----------+---------------------------------------+
    | /open/          | None     | Health probes, Swagger UI, OpenAPI    |
    | /open/api/v1/   | ApiKey   | Public / webhook endpoints            |
    | /v1/            | Bearer   | Domain endpoints (auth JWT required)  |
    +-----------------+----------+---------------------------------------+

    Docs:   GET /open/docs          (Swagger UI)
            GET /open/redoc         (ReDoc)
            GET /open/openapi.json  (OpenAPI JSON)
    Health: GET /open/health        (liveness)
            GET /open/health/ready  (readiness — checks DB)
    """
    is_production = settings.ENVIRONMENT == "production"

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url=None if is_production else DOCS_URL,
        redoc_url=None if is_production else REDOC_URL,
        openapi_url=None if is_production else OPENAPI_URL,
        lifespan=lifespan,
    )

    app.openapi = _build_custom_openapi(app)  # type: ignore[method-assign]

    # ── CORS ───────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Compression ────────────────────────────────────────────────────────────
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ── Global error handler ───────────────────────────────────────────────────
    @app.exception_handler(Exception)  # type: ignore[misc]
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception", extra={"path": request.url.path, "error": str(exc)})
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    # ── Routers ────────────────────────────────────────────────────────────────
    app.include_router(health.router, prefix="/open")
    app.include_router(providers.router, prefix="/v1/providers", tags=["providers"])
    app.include_router(availability.router, prefix="/v1", tags=["availability"])
    app.include_router(bookings.router, prefix="/v1/bookings", tags=["bookings"])
    app.include_router(consultations.router, prefix="/v1/consultations", tags=["consultations"])

    logger.info("Application configured", extra={"routes": len(app.routes)})
    return app
