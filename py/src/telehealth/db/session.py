import contextlib
from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


class AsyncSessionManager:
    """Manages the async SQLAlchemy engine and session factory lifecycle."""

    def __init__(self) -> None:
        self._engine: AsyncEngine | None = None
        self._session_maker: async_sessionmaker[AsyncSession] | None = None

    async def init(self, database_url: str) -> None:
        engine = create_async_engine(
            database_url,
            pool_size=5,
            max_overflow=10,
            echo=False,
        )
        self._session_maker = async_sessionmaker(
            bind=engine,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

        # Verify connectivity at startup — fail fast if the DB is unreachable.
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as exc:
            await engine.dispose()
            self._session_maker = None
            raise RuntimeError(f"Database is unavailable — cannot start: {exc}") from exc

        self._engine = engine
        logger.info("Database connection pool initialised")

    async def close(self) -> None:
        if self._engine is None:
            return
        await self._engine.dispose()
        self._engine = None
        self._session_maker = None
        logger.info("Database connection pool closed")

    @contextlib.asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        if self._session_maker is None:
            raise RuntimeError("AsyncSessionManager not initialised — call init() first")

        async with self._session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise


sessionmanager = AsyncSessionManager()


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields a scoped async session per request."""
    async with sessionmanager.session() as session:
        yield session
