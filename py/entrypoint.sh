#!/bin/sh
# Container entrypoint: wait for Postgres, run migrations, seed a fresh
# database, then hand off to uvicorn. Migrations and seeding are both
# idempotent, so this is safe to run on every container start.
set -e

echo "Waiting for database to be reachable..."
python scripts/wait_for_db.py

echo "Running database migrations..."
alembic upgrade head

echo "Verifying schema..."
python scripts/verify_schema.py

echo "Seeding database (idempotent — skips if data already exists)..."
python seed/seed.py

echo "Starting server..."
exec uvicorn telehealth.app.main:create_app --factory --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"
