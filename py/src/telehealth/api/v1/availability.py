import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.session import get_session
from telehealth.schemas.availability import (
    AvailabilitySlotResponse,
    CreateAvailabilitySlotRequest,
    ListAvailabilityQuery,
)
from telehealth.schemas.common import PaginatedResponse
from telehealth.services import availability_service
from telehealth.services.availability_service import (
    SlotAlreadyBookedError,
    SlotNotFoundError,
    SlotOverlapError,
)
from telehealth.services.provider_service import ProviderNotFoundError
from telehealth.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get(  # type: ignore[misc]
    "/providers/{provider_id}/availability",
    response_model=PaginatedResponse[AvailabilitySlotResponse],
    summary="List availability slots",
)
async def list_slots(
    provider_id: uuid.UUID,
    query: ListAvailabilityQuery = Depends(),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[AvailabilitySlotResponse]:
    """Return paginated availability slots for a provider.
    By default only unbooked slots are returned; set include_booked=true to see all."""
    return await availability_service.list_slots(session, provider_id, query)


@router.post(  # type: ignore[misc]
    "/providers/{provider_id}/availability",
    response_model=AvailabilitySlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create availability slot",
)
async def create_slot(
    provider_id: uuid.UUID,
    body: CreateAvailabilitySlotRequest,
    session: AsyncSession = Depends(get_session),
) -> AvailabilitySlotResponse:
    try:
        return await availability_service.create_slot(session, provider_id, body)
    except ProviderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except SlotOverlapError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err


@router.delete(  # type: ignore[misc]
    "/availability/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete availability slot",
)
async def delete_slot(
    slot_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await availability_service.delete_slot(session, slot_id)
    except SlotNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except SlotAlreadyBookedError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err
