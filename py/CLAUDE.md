---
trigger: always_on
description: Trigger these rules when modifying the Telehealth backend (FastAPI + SQLAlchemy + asyncpg). Enforces async-first design, strict typing (mypy), layered architecture, pre-commit workflows, and Pydantic schema standards.
---

# Telehealth Booking & Consultation — Python Backend

## Project Overview

Production-grade REST API built with **FastAPI**, **SQLAlchemy 2.0 async**, and **asyncpg**. Handles slot availability, booking confirmation, video-session token generation, and post-visit summaries.

**Tech Stack**

| Tool               | Purpose                                   |
| ------------------ | ----------------------------------------- |
| **FastAPI**        | Async web framework with OpenAPI docs     |
| **SQLAlchemy 2.0** | Async ORM with `Mapped` / `mapped_column` |
| **asyncpg**        | Async PostgreSQL driver                   |
| **Alembic**        | Database migration management             |
| **Pydantic v2**    | Request/response validation and settings  |
| **python-jose**    | JWT encoding for auth and video tokens    |
| **uv**             | Dependency management and virtualenv      |

## Development Quick Start

```bash
# 1. Create and activate virtual environment
uv venv
source .venv/bin/activate

# 2. Install all dependencies and set up git hooks
make install

# 3. Copy and fill in environment variables
cp .env.example .env

# 4. Start development database
docker compose -f docker-compose.dev.yml up -d

# 5. Run database migrations
uv run alembic upgrade head

# 6. Start the dev server (hot reload)
make dev
```

API docs: `http://localhost:8000/open/docs`
Health: `http://localhost:8000/open/health`

## Makefile Shortcuts

| Command | What it does |
| -------------- | --------------------------------------- |
| `make install` | `uv sync --group dev` + `pre-commit install` |
| `make dev` | Start uvicorn with hot reload on `:8000` |
| `make lint` | Run ruff, black, mypy across `src/` and `tests/` |
| `make test` | Run the full pytest suite |

## Project Structure

```
py/
├── src/telehealth/              # Main package
│   ├── api/v1/                  # Route handlers (thin controllers)
│   │   ├── health.py            # Liveness + readiness probes
│   │   ├── providers.py         # Provider directory CRUD
│   │   ├── availability.py      # Availability slot management
│   │   ├── bookings.py          # Booking lifecycle
│   │   └── consultations.py     # Consultation + video token endpoints
│   ├── app/
│   │   └── main.py              # FastAPI application factory (create_app)
│   ├── db/
│   │   ├── base.py              # DeclarativeBase
│   │   ├── session.py           # AsyncSessionManager + get_session dependency
│   │   └── models/              # SQLAlchemy ORM models
│   │       ├── provider.py
│   │       ├── availability_slot.py
│   │       ├── booking.py
│   │       └── consultation.py
│   ├── middleware/
│   │   └── auth.py              # JWT decode-only dependency (get_current_user)
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── common.py            # PaginatedResponse[T]
│   │   ├── provider.py
│   │   ├── availability.py
│   │   ├── booking.py
│   │   ├── consultation.py
│   │   └── health.py
│   ├── services/                # Business logic (no HTTP types)
│   │   ├── provider_service.py
│   │   ├── availability_service.py
│   │   ├── booking_service.py
│   │   ├── consultation_service.py
│   │   └── video_token_service.py
│   └── utils/
│       ├── config.py            # Pydantic Settings (loaded from .env)
│       ├── constants.py         # BookingStatus, ConsultationStatus, ProviderSpecialty enums
│       └── logger.py            # get_logger() factory
├── tests/
│   ├── unit/                    # Fast, mocked — no DB
│   └── integration/             # Real DB via aiosqlite / asyncpg
├── alembic/                     # Migration scripts
├── docker-compose.dev.yml       # Dev DB only
├── docker-compose.yml           # Full stack (API + DB)
├── Dockerfile
└── pyproject.toml
```

## Running Quality Checks

```bash
# All hooks (black, isort, ruff, mypy, pytest-unit)
uv run pre-commit run --all-files

# Specific hooks
uv run pre-commit run ruff --all-files
uv run pre-commit run black --all-files
uv run pre-commit run isort --all-files
uv run pre-commit run mypy --all-files

# Tests
uv run pytest tests/unit/ -v           # fast
uv run pytest tests/integration/ -v   # requires running DB
uv run pytest tests/ -v               # full suite
```

## Architecture Rules

### Layered Architecture

- **Routes** (`api/v1/*.py`): Thin FastAPI handlers. Extract params, call service, map exceptions to HTTP errors.
- **Services** (`services/*.py`): All business logic and DB queries. No `Request`/`Response` types.
- **Models** (`db/models/*.py`): SQLAlchemy ORM definitions only. No business logic.
- **Schemas** (`schemas/*.py`): Pydantic request/response models. No DB access.

### Session Lifecycle

- `AsyncSessionManager` owns the engine and session factory.
- `get_session()` is a FastAPI dependency that yields a scoped `AsyncSession` per request, auto-committing on success and rolling back on exception.
- Services receive the session as a parameter — they never import `sessionmanager` directly.

### App vs Factory

- `src/telehealth/app/main.py` defines `create_app()` and NEVER calls `uvicorn.run()`.
- The server command passes `telehealth.app.main:create_app` with `--factory` to let uvicorn call it.
- This allows test code to call `create_app()` without binding a port.

### `/open/` vs `/v1/` Route Convention

Mirrors the JS backend:

| Prefix   | Auth required | Purpose                                             |
| -------- | ------------- | --------------------------------------------------- |
| `/open/` | No            | Liveness/readiness probes, Swagger UI, OpenAPI JSON |
| `/v1/`   | Bearer JWT    | All domain endpoints                                |

- Swagger UI: `http://localhost:8000/open/docs`
- OpenAPI JSON: `http://localhost:8000/open/openapi.json`
- Health (liveness): `http://localhost:8000/open/health`
- Health (readiness): `http://localhost:8000/open/health/ready`

### Authentication Model

**This service does not verify JWT signatures.** The API gateway upstream validates signatures before forwarding requests.

`get_current_user` (in `middleware/auth.py`) performs a **raw base64url decode** of the JWT payload segment to extract user identity — no jose/secret key involved. This matches the JS backend's `decodeJwtPayload` function exactly.

The JWT payload carries:

- `sub` — user ID (OIDC standard; preferred)
- `id` — user ID (legacy gateway tokens; fallback)
- `role` — user role
- `email` — user email

Use `get_token_payload` when a route needs `role` or `email` in addition to the user ID.

## Best Practices

### 1. Async-First

All endpoints, service functions, and I/O operations MUST be `async def`. No blocking calls in request path.

### 2. Type Safety

Full type hints are mandatory. mypy runs in strict mode.
Add `# type: ignore[misc]` to FastAPI route decorators (untyped decorator limitation).

### 3. Configuration

All config is loaded via `telehealth.utils.config.Settings` (Pydantic BaseSettings).
Never hardcode secrets or env-specific values.
`JWT_SECRET_KEY` does NOT exist in this service — there is no auth secret. Only `VIDEO_SESSION_SECRET` exists for signing video tokens.

### 4. Logging

Use `get_logger(__name__)` from `telehealth.utils.logger`.
Never use `print()`. Use structured extras: `logger.info("msg", extra={"key": "val"})`.

### 5. Exception Handling

- Define domain-specific exception classes in each service module.
- Route handlers catch domain exceptions and re-raise as `HTTPException` with `raise ... from err`.
- Never let a raw `Exception` propagate to the client.

### 6. Schema Placement

All Pydantic schemas go in `src/telehealth/schemas/`. Never define them inline in route files.

## Troubleshooting

### Pre-commit hook failures

Formatting hooks (black, isort, ruff) auto-fix files. Stage and re-run:

```bash
git add -u && uv run pre-commit run --all-files
```

### Mypy Untyped Decorators

FastAPI route decorators trigger `Untyped decorator` errors. Append `# type: ignore[misc]` to the decorator line.

### Running specific hooks

```bash
# ✅ Correct
uv run pre-commit run mypy --all-files
uv run pre-commit run ruff --all-files

# ❌ Wrong
uv run mypy src/
uv run pre-commit run --all-files --mypy
```

### Alembic can't find models

Ensure `import telehealth.db.models` is called in `alembic/env.py` (already done). All models must be imported before `Base.metadata` is passed to Alembic.
