FROM python:3.12-alpine AS base

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# ── Dependencies ───────────────────────────────────────────────────────────────
FROM base AS deps
COPY pyproject.toml .
RUN uv sync --no-dev --no-install-project

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM base AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

COPY --from=deps /app/.venv /app/.venv
COPY src/ /app/src/
COPY alembic/ /app/alembic/
COPY alembic.ini /app/alembic.ini

# Install the package itself (no deps — already installed)
RUN uv pip install --no-deps -e .

EXPOSE 8000

CMD ["uvicorn", "telehealth.app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
