"""
Verifies core tables exist after migrations run — used by entrypoint.sh right
after `alembic upgrade head`, to catch a stale alembic_version row that claims
the database is already at head while the actual tables were never created
(e.g. tables dropped without a downgrade, or the revision was stamped instead
of applied). On a genuine first run against an empty database, alembic
creates these tables itself, so this check passes without intervention.

Self-heals the one unambiguous case: ALL required tables are missing while
alembic_version claims head. That combination means nothing was ever actually
migrated, so there's no data to lose — the stale alembic_version row is reset
and `alembic upgrade head` is re-run once. Any other mismatch (some tables
present, some missing) is left alone and fails loudly, since guessing there
could destroy real data in tables that do exist.

Usage:
    uv run python scripts/verify_schema.py
"""

from __future__ import annotations

import asyncio
import subprocess
import sys

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from telehealth.utils.config import get_settings

REQUIRED_TABLES = ("providers", "availability_slots", "bookings", "consultations")


async def _find_existing_tables(engine: AsyncEngine | Engine) -> set[str]:
    async with engine.connect() as conn:  # type: ignore[union-attr]
        result = await conn.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = ANY(:tables)"
            ),
            {"tables": list(REQUIRED_TABLES)},
        )
        return {row[0] for row in result}


async def _reset_stale_alembic_version(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))


async def verify_schema() -> None:
    engine = create_async_engine(get_settings().database_url)
    try:
        found = await _find_existing_tables(engine)
    finally:
        await engine.dispose()

    missing = sorted(set(REQUIRED_TABLES) - found)
    if not missing:
        return

    print(f"Schema verification failed — missing tables: {', '.join(missing)}", file=sys.stderr)

    if found:
        # Partial mismatch: some required tables exist, some don't. Could mean
        # real data lives in the tables that are present — don't guess, bail.
        print(
            "Some required tables exist and some don't, so this isn't safe to "
            "auto-repair (it could mean real data lives in the tables that are "
            "present). Inspect alembic_version and the database manually.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(
        "alembic reports migrations are up to date, but none of the required "
        "tables exist. Treating alembic_version as stale — resetting it and "
        "re-running migrations from a clean state.",
        file=sys.stderr,
    )

    engine = create_async_engine(get_settings().database_url)
    try:
        await _reset_stale_alembic_version(engine)
    finally:
        await engine.dispose()

    subprocess.run(["alembic", "upgrade", "head"], check=True)

    engine = create_async_engine(get_settings().database_url)
    try:
        found = await _find_existing_tables(engine)
    finally:
        await engine.dispose()

    missing = sorted(set(REQUIRED_TABLES) - found)
    if missing:
        print(
            f"Schema verification failed after self-heal — still missing tables: {', '.join(missing)}",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Schema self-healed: stale alembic_version reset and migrations re-applied.")


if __name__ == "__main__":
    asyncio.run(verify_schema())
