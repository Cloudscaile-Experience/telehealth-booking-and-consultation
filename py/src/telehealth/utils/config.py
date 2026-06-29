from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Application ────────────────────────────────────────────────────────────
    APP_NAME: str = "Telehealth Booking & Consultation API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)

    # ── Server ─────────────────────────────────────────────────────────────────
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)

    # ── Database ───────────────────────────────────────────────────────────────
    PG_HOST: str = Field(default="localhost")
    PG_PORT: int = Field(default=5432)
    PG_USERNAME: str = Field(default="postgres")
    PG_PASSWORD: str = Field(default="postgres")
    PG_DATABASE: str = Field(default="patient_portal_dev")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.PG_USERNAME}:{self.PG_PASSWORD}"
            f"@{self.PG_HOST}:{self.PG_PORT}/{self.PG_DATABASE}"
        )

    # ── Video Sessions ─────────────────────────────────────────────────────────
    # Secret used to sign video-session JWT tokens issued to patients/providers.
    VIDEO_SESSION_SECRET: str = Field(default="change-me-in-production")
    VIDEO_SESSION_EXPIRY_MINUTES: int = Field(default=90)
    # Algorithm for signing video session tokens (HS256 is sufficient for internal use)
    JWT_ALGORITHM: str = Field(default="HS256")

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:4000,http://localhost:5173")

    # ── API Gateway ────────────────────────────────────────────────────────────
    # Optional: displayed as a server entry in Swagger UI when set.
    # The gateway is responsible for validating auth JWT signatures.
    GATEWAY_BASE_URL: str | None = Field(default=None)

    # ── Tenant ─────────────────────────────────────────────────────────────────
    TENANT_NAME: str = Field(default="telehealth")
    EXTENSION_NAME: str = Field(default="telehealth-booking-and-consultation")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
