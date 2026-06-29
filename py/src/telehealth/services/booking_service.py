import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from telehealth.db.models.availability_slot import AvailabilitySlot
from telehealth.db.models.booking import Booking
from telehealth.schemas.booking import (
    BookingDetailResponse,
    BookingResponse,
    CreateBookingRequest,
    ListBookingsQuery,
    UpdateBookingRequest,
)
from telehealth.schemas.common import PaginatedResponse
from telehealth.utils.constants import BookingStatus
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


class BookingNotFoundError(Exception):
    def __init__(self, booking_id: uuid.UUID) -> None:
        super().__init__(f"Booking '{booking_id}' not found")


class BookingSlotUnavailableError(Exception):
    def __init__(self, slot_id: uuid.UUID) -> None:
        super().__init__(f"Slot '{slot_id}' is not available for booking")


class BookingAccessDeniedError(Exception):
    pass


async def list_bookings(
    session: AsyncSession,
    patient_id: str,
    query: ListBookingsQuery,
) -> PaginatedResponse[BookingResponse]:
    """Return paginated bookings for the authenticated patient."""
    stmt = select(Booking).where(Booking.patient_id == patient_id)

    if query.status:
        stmt = stmt.where(Booking.status == query.status)

    if query.provider_id:
        stmt = stmt.where(Booking.provider_id == query.provider_id)

    stmt = stmt.order_by(Booking.created_at.desc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await session.execute(count_stmt)).scalar_one()

    offset = (query.page - 1) * query.page_size
    rows: Sequence[Booking] = (await session.execute(stmt.limit(query.page_size).offset(offset))).scalars().all()

    return PaginatedResponse(
        data=[BookingResponse.model_validate(row) for row in rows],
        total=total,
        page=query.page,
        page_size=query.page_size,
    )


async def get_booking(session: AsyncSession, booking_id: uuid.UUID, patient_id: str) -> BookingDetailResponse:
    result = await session.execute(select(Booking).options(selectinload(Booking.slot)).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise BookingNotFoundError(booking_id)
    if booking.patient_id != patient_id:
        raise BookingAccessDeniedError("Access denied to this booking")

    return BookingDetailResponse.model_validate(booking)


async def create_booking(
    session: AsyncSession,
    patient_id: str,
    data: CreateBookingRequest,
) -> BookingResponse:
    """Reserve a slot for the patient. Marks the slot as booked atomically."""
    slot = await session.get(AvailabilitySlot, data.slot_id)
    if not slot or slot.is_booked or slot.provider_id != data.provider_id:
        raise BookingSlotUnavailableError(data.slot_id)

    booking = Booking(
        patient_id=patient_id,
        provider_id=data.provider_id,
        slot_id=data.slot_id,
        patient_notes=data.patient_notes,
        status=BookingStatus.PENDING,
    )
    slot.is_booked = True

    session.add(booking)
    await session.flush()
    await session.refresh(booking)

    logger.info(
        "Booking created",
        extra={"booking_id": str(booking.id), "patient_id": patient_id, "slot_id": str(data.slot_id)},
    )
    return BookingResponse.model_validate(booking)


async def update_booking(
    session: AsyncSession,
    booking_id: uuid.UUID,
    patient_id: str,
    data: UpdateBookingRequest,
) -> BookingResponse:
    booking = await session.get(Booking, booking_id)
    if not booking:
        raise BookingNotFoundError(booking_id)
    if booking.patient_id != patient_id:
        raise BookingAccessDeniedError("Access denied to this booking")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(booking, field, value)

    # Free the slot when a booking is cancelled
    if data.status == BookingStatus.CANCELLED:
        slot = await session.get(AvailabilitySlot, booking.slot_id)
        if slot:
            slot.is_booked = False

    await session.flush()
    await session.refresh(booking)

    logger.info("Booking updated", extra={"booking_id": str(booking_id), "status": str(booking.status)})
    return BookingResponse.model_validate(booking)


async def confirm_booking(session: AsyncSession, booking_id: uuid.UUID) -> BookingResponse:
    """Mark a booking as confirmed and create its linked consultation record."""
    booking = await session.get(Booking, booking_id)
    if not booking:
        raise BookingNotFoundError(booking_id)

    from telehealth.services.consultation_service import create_consultation_for_booking

    booking.status = BookingStatus.CONFIRMED
    await session.flush()
    await create_consultation_for_booking(session, booking)
    await session.refresh(booking)

    logger.info("Booking confirmed", extra={"booking_id": str(booking_id)})
    return BookingResponse.model_validate(booking)
