import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.models.booking import Booking
from telehealth.db.models.consultation import Consultation
from telehealth.schemas.consultation import (
    ConsultationResponse,
    UpdateNotesRequest,
    UpdateSummaryRequest,
    VideoTokenResponse,
)
from telehealth.services.video_token_service import generate_video_token, new_session_id
from telehealth.utils.constants import BookingStatus, ConsultationStatus
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


class ConsultationNotFoundError(Exception):
    def __init__(self, consultation_id: uuid.UUID) -> None:
        super().__init__(f"Consultation '{consultation_id}' not found")


class ConsultationStateError(Exception):
    pass


async def get_consultation(
    session: AsyncSession, consultation_id: uuid.UUID
) -> ConsultationResponse:
    consultation = await session.get(Consultation, consultation_id)
    if not consultation:
        raise ConsultationNotFoundError(consultation_id)
    return ConsultationResponse.model_validate(consultation)


async def get_consultation_by_booking(
    session: AsyncSession, booking_id: uuid.UUID
) -> ConsultationResponse:
    result = await session.execute(select(Consultation).where(Consultation.booking_id == booking_id))
    consultation = result.scalar_one_or_none()
    if not consultation:
        raise ConsultationNotFoundError(booking_id)
    return ConsultationResponse.model_validate(consultation)


async def create_consultation_for_booking(
    session: AsyncSession, booking: Booking
) -> ConsultationResponse:
    """Create a Consultation record linked to the given Booking."""
    session_id = new_session_id()

    consultation = Consultation(
        booking_id=booking.id,
        video_session_id=session_id,
        status=ConsultationStatus.SCHEDULED,
    )
    session.add(consultation)
    await session.flush()
    await session.refresh(consultation)

    logger.info(
        "Consultation created",
        extra={"consultation_id": str(consultation.id), "booking_id": str(booking.id)},
    )
    return ConsultationResponse.model_validate(consultation)


async def start_consultation(
    session: AsyncSession, consultation_id: uuid.UUID, participant_id: str
) -> VideoTokenResponse:
    """Mark the consultation as in-progress and issue a video token."""
    consultation = await session.get(Consultation, consultation_id)
    if not consultation:
        raise ConsultationNotFoundError(consultation_id)
    if consultation.status not in (ConsultationStatus.SCHEDULED, ConsultationStatus.IN_PROGRESS):
        raise ConsultationStateError(
            f"Cannot start a consultation with status '{consultation.status}'"
        )

    consultation.status = ConsultationStatus.IN_PROGRESS
    if not consultation.started_at:
        consultation.started_at = datetime.now(timezone.utc)

    token_response = generate_video_token(consultation.video_session_id, participant_id)
    consultation.video_session_token = token_response.token

    await session.flush()

    logger.info("Consultation started", extra={"consultation_id": str(consultation_id)})
    return token_response


async def end_consultation(
    session: AsyncSession, consultation_id: uuid.UUID
) -> ConsultationResponse:
    """Mark the consultation as completed and update the linked booking."""
    consultation = await session.get(Consultation, consultation_id)
    if not consultation:
        raise ConsultationNotFoundError(consultation_id)
    if consultation.status != ConsultationStatus.IN_PROGRESS:
        raise ConsultationStateError(
            f"Cannot end a consultation with status '{consultation.status}'"
        )

    consultation.status = ConsultationStatus.COMPLETED
    consultation.ended_at = datetime.now(timezone.utc)
    consultation.video_session_token = None

    booking = await session.get(Booking, consultation.booking_id)
    if booking:
        booking.status = BookingStatus.COMPLETED

    await session.flush()
    await session.refresh(consultation)

    logger.info("Consultation ended", extra={"consultation_id": str(consultation_id)})
    return ConsultationResponse.model_validate(consultation)


async def refresh_video_token(
    session: AsyncSession, consultation_id: uuid.UUID, participant_id: str
) -> VideoTokenResponse:
    """Issue a fresh video token for an in-progress consultation."""
    consultation = await session.get(Consultation, consultation_id)
    if not consultation:
        raise ConsultationNotFoundError(consultation_id)
    if consultation.status != ConsultationStatus.IN_PROGRESS:
        raise ConsultationStateError("Video tokens can only be refreshed for in-progress consultations")

    token_response = generate_video_token(consultation.video_session_id, participant_id)
    consultation.video_session_token = token_response.token
    await session.flush()

    logger.info("Video token refreshed", extra={"consultation_id": str(consultation_id)})
    return token_response


async def update_notes(
    session: AsyncSession, consultation_id: uuid.UUID, data: UpdateNotesRequest
) -> ConsultationResponse:
    consultation = await session.get(Consultation, consultation_id)
    if not consultation:
        raise ConsultationNotFoundError(consultation_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(consultation, field, value)

    await session.flush()
    await session.refresh(consultation)
    return ConsultationResponse.model_validate(consultation)


async def update_summary(
    session: AsyncSession, consultation_id: uuid.UUID, data: UpdateSummaryRequest
) -> ConsultationResponse:
    consultation = await session.get(Consultation, consultation_id)
    if not consultation:
        raise ConsultationNotFoundError(consultation_id)
    if consultation.status != ConsultationStatus.COMPLETED:
        raise ConsultationStateError("Summaries can only be added to completed consultations")

    consultation.summary = data.summary
    await session.flush()
    await session.refresh(consultation)

    logger.info("Consultation summary updated", extra={"consultation_id": str(consultation_id)})
    return ConsultationResponse.model_validate(consultation)
