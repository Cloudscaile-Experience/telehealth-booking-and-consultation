import uuid
from collections.abc import Sequence
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.models.availability_slot import AvailabilitySlot
from telehealth.db.models.provider import Provider
from telehealth.schemas.availability import (
    AvailabilitySlotResponse,
    CreateAvailabilitySlotRequest,
    ListAvailabilityQuery,
)
from telehealth.schemas.common import PaginatedResponse
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


class SlotNotFoundError(Exception):
    def __init__(self, slot_id: uuid.UUID) -> None:
        super().__init__(f"Availability slot '{slot_id}' not found")


class SlotOverlapError(Exception):
    pass


class SlotAlreadyBookedError(Exception):
    def __init__(self, slot_id: uuid.UUID) -> None:
        super().__init__(f"Slot '{slot_id}' is already booked")


async def list_slots(
    session: AsyncSession,
    provider_id: uuid.UUID,
    query: ListAvailabilityQuery,
) -> PaginatedResponse[AvailabilitySlotResponse]:
    """Return paginated availability slots for a provider."""
    stmt = select(AvailabilitySlot).where(AvailabilitySlot.provider_id == provider_id)

    if not query.include_booked:
        stmt = stmt.where(AvailabilitySlot.is_booked.is_(False))  # type: ignore[union-attr]

    if query.from_time:
        stmt = stmt.where(AvailabilitySlot.start_time >= query.from_time)

    if query.to_time:
        stmt = stmt.where(AvailabilitySlot.end_time <= query.to_time)

    stmt = stmt.order_by(AvailabilitySlot.start_time)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await session.execute(count_stmt)).scalar_one()

    offset = (query.page - 1) * query.page_size
    rows: Sequence[AvailabilitySlot] = (
        (await session.execute(stmt.limit(query.page_size).offset(offset))).scalars().all()
    )

    return PaginatedResponse(
        data=[AvailabilitySlotResponse.model_validate(row) for row in rows],
        total=total,
        page=query.page,
        page_size=query.page_size,
    )


async def get_slot(session: AsyncSession, slot_id: uuid.UUID) -> AvailabilitySlotResponse:
    slot = await session.get(AvailabilitySlot, slot_id)
    if not slot:
        raise SlotNotFoundError(slot_id)
    return AvailabilitySlotResponse.model_validate(slot)


async def create_slot(
    session: AsyncSession,
    provider_id: uuid.UUID,
    data: CreateAvailabilitySlotRequest,
) -> AvailabilitySlotResponse:
    """Create an availability slot, rejecting overlaps with existing slots."""
    provider = await session.get(Provider, provider_id)
    if not provider:
        from telehealth.services.provider_service import ProviderNotFoundError

        raise ProviderNotFoundError(provider_id)

    overlap = (
        await session.execute(
            select(AvailabilitySlot).where(
                AvailabilitySlot.provider_id == provider_id,
                AvailabilitySlot.start_time < data.end_time,
                AvailabilitySlot.end_time > data.start_time,
            )
        )
    ).scalar_one_or_none()

    if overlap:
        raise SlotOverlapError(
            f"Slot overlaps with existing slot {overlap.id} "
            f"({overlap.start_time.isoformat()} – {overlap.end_time.isoformat()})"
        )

    slot = AvailabilitySlot(
        provider_id=provider_id,
        start_time=data.start_time,
        end_time=data.end_time,
    )
    session.add(slot)
    await session.flush()
    await session.refresh(slot)

    logger.info("Availability slot created", extra={"slot_id": str(slot.id), "provider_id": str(provider_id)})
    return AvailabilitySlotResponse.model_validate(slot)


async def delete_slot(session: AsyncSession, slot_id: uuid.UUID) -> None:
    slot = await session.get(AvailabilitySlot, slot_id)
    if not slot:
        raise SlotNotFoundError(slot_id)
    if slot.is_booked:
        raise SlotAlreadyBookedError(slot_id)

    await session.delete(slot)
    logger.info("Availability slot deleted", extra={"slot_id": str(slot_id)})
