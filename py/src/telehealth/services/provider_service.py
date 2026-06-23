import uuid
from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.models.availability_slot import AvailabilitySlot
from telehealth.db.models.provider import Provider
from telehealth.schemas.common import PaginatedResponse
from telehealth.schemas.provider import (
    CreateProviderRequest,
    ListProvidersQuery,
    ProviderResponse,
    UpdateProviderRequest,
)
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


class ProviderNotFoundError(Exception):
    def __init__(self, provider_id: uuid.UUID) -> None:
        super().__init__(f"Provider '{provider_id}' not found")


class ProviderEmailConflictError(Exception):
    def __init__(self, email: str) -> None:
        super().__init__(f"A provider with email '{email}' already exists")


async def list_providers(
    session: AsyncSession,
    query: ListProvidersQuery,
) -> PaginatedResponse[ProviderResponse]:
    """Return a paginated, filtered list of active providers."""
    stmt = select(Provider).where(Provider.is_active.is_(True))  # type: ignore[union-attr]

    if query.specialty:
        stmt = stmt.where(Provider.specialty == query.specialty.value)

    if query.language:
        stmt = stmt.where(Provider.languages.ilike(f"%{query.language}%"))  # type: ignore[union-attr]

    if query.search:
        stmt = stmt.where(
            or_(
                Provider.name.ilike(f"%{query.search}%"),  # type: ignore[union-attr]
                Provider.specialty.ilike(f"%{query.search}%"),  # type: ignore[union-attr]
            )
        )

    if query.available_from and query.available_to:
        stmt = (
            stmt.join(AvailabilitySlot, AvailabilitySlot.provider_id == Provider.id)
            .where(
                AvailabilitySlot.start_time >= query.available_from,
                AvailabilitySlot.end_time <= query.available_to,
                AvailabilitySlot.is_booked.is_(False),  # type: ignore[union-attr]
            )
            .distinct()
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await session.execute(count_stmt)).scalar_one()

    offset = (query.page - 1) * query.page_size
    rows: Sequence[Provider] = (await session.execute(stmt.limit(query.page_size).offset(offset))).scalars().all()

    logger.debug("Listed providers", extra={"count": len(rows), "total": total})

    return PaginatedResponse(
        data=[ProviderResponse.model_validate(row) for row in rows],
        total=total,
        page=query.page,
        page_size=query.page_size,
    )


async def get_provider(session: AsyncSession, provider_id: uuid.UUID) -> ProviderResponse:
    provider = await session.get(Provider, provider_id)
    if not provider:
        raise ProviderNotFoundError(provider_id)
    return ProviderResponse.model_validate(provider)


async def create_provider(session: AsyncSession, data: CreateProviderRequest) -> ProviderResponse:
    existing = (await session.execute(select(Provider).where(Provider.email == str(data.email)))).scalar_one_or_none()
    if existing:
        raise ProviderEmailConflictError(str(data.email))

    provider = Provider(
        name=data.name,
        email=str(data.email),
        specialty=data.specialty.value,
        bio=data.bio,
        avatar_url=data.avatar_url,
        languages=data.languages,
        consultation_fee=data.consultation_fee,
    )
    session.add(provider)
    await session.flush()
    await session.refresh(provider)

    logger.info("Provider created", extra={"provider_id": str(provider.id)})
    return ProviderResponse.model_validate(provider)


async def update_provider(
    session: AsyncSession, provider_id: uuid.UUID, data: UpdateProviderRequest
) -> ProviderResponse:
    provider = await session.get(Provider, provider_id)
    if not provider:
        raise ProviderNotFoundError(provider_id)

    update_data = data.model_dump(exclude_unset=True)
    if "specialty" in update_data and update_data["specialty"] is not None:
        update_data["specialty"] = update_data["specialty"].value

    for field, value in update_data.items():
        setattr(provider, field, value)

    await session.flush()
    await session.refresh(provider)

    logger.info("Provider updated", extra={"provider_id": str(provider_id)})
    return ProviderResponse.model_validate(provider)


async def delete_provider(session: AsyncSession, provider_id: uuid.UUID) -> None:
    provider = await session.get(Provider, provider_id)
    if not provider:
        raise ProviderNotFoundError(provider_id)

    await session.delete(provider)
    logger.info("Provider deleted", extra={"provider_id": str(provider_id)})
