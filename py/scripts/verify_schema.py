"""
Verifies core tables exist after migrations run — used by entrypoint.sh right
after `alembic upgrade head`, to catch a stale alembic_version row that claims
the database is already at head while the actual tables were never created
(e.g. tables dropped without a downgrade, or the revision was stamped instead
of applied). On a genuine first run against an empty database, alembic
creates these tables itself, so this check passes without intervention.

Usage:
    uv run python scripts/verify_schema.py
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from telehealth.utils.config import get_settings

REQUIRED_TABLES = ("providers", "availability_slots", "bookings", "consultations")


async def verify_schema() -> None:
    engine = create_async_engine(get_settings().database_url)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name = ANY(:tables)"
                ),
                {"tables": list(REQUIRED_TABLES)},
            )
            found = {row[0] for row in result}
    finally:
        await engine.dispose()

    missing = sorted(set(REQUIRED_TABLES) - found)
    if missing:
        print(f"Schema verification failed — missing tables: {', '.join(missing)}", file=sys.stderr)
        print(
            "alembic reports migrations are up to date, but these tables don't exist. "
            "The alembic_version table is likely stale (stamped without running the "
            "migration, or tables were dropped without a downgrade). Inspect "
            "alembic_version in the database and re-run migrations from a clean state.",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(verify_schema())
