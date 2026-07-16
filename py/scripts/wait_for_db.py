"""
Blocks until the database is reachable — used by entrypoint.sh before
migrations run, so container startup fails fast on a genuinely dead DB
instead of racing alembic against a not-yet-ready Postgres.

Usage:
    uv run python scripts/wait_for_db.py
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from telehealth.utils.config import get_settings

ATTEMPTS = 30
DELAY_SECONDS = 2.0


async def wait_for_db(attempts: int = ATTEMPTS, delay: float = DELAY_SECONDS) -> None:
    engine = create_async_engine(get_settings().database_url)
    try:
        for attempt in range(1, attempts + 1):
            try:
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
                return
            except Exception as exc:
                print(f"Database not ready ({attempt}/{attempts}): {exc}", file=sys.stderr)
                if attempt == attempts:
                    sys.exit(1)
                await asyncio.sleep(delay)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(wait_for_db())
