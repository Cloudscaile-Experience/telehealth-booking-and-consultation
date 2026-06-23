import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.session import get_session
from telehealth.middleware.auth import get_current_user
from telehealth.schemas.booking import (
    BookingDetailResponse,
    BookingResponse,
    CreateBookingRequest,
    ListBookingsQuery,
    UpdateBookingRequest,
)
from telehealth.schemas.common import PaginatedResponse
from telehealth.services import booking_service
from telehealth.services.booking_service import (
    BookingAccessDeniedError,
    BookingNotFoundError,
    BookingSlotUnavailableError,
)
from telehealth.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", response_model=PaginatedResponse[BookingResponse], summary="List my bookings")  # type: ignore[misc]
async def list_bookings(
    query: ListBookingsQuery = Depends(),
    session: AsyncSession = Depends(get_session),
    patient_id: str = Depends(get_current_user),
) -> PaginatedResponse[BookingResponse]:
    """Return paginated bookings for the authenticated patient."""
    return await booking_service.list_bookings(session, patient_id, query)


@router.get("/{booking_id}", response_model=BookingDetailResponse, summary="Get booking")  # type: ignore[misc]
async def get_booking(
    booking_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    patient_id: str = Depends(get_current_user),
) -> BookingDetailResponse:
    try:
        return await booking_service.get_booking(session, booking_id, patient_id)
    except BookingNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except BookingAccessDeniedError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err)) from err


@router.post(  # type: ignore[misc]
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create booking",
)
async def create_booking(
    body: CreateBookingRequest,
    session: AsyncSession = Depends(get_session),
    patient_id: str = Depends(get_current_user),
) -> BookingResponse:
    try:
        return await booking_service.create_booking(session, patient_id, body)
    except BookingSlotUnavailableError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err


@router.patch("/{booking_id}", response_model=BookingResponse, summary="Update booking")  # type: ignore[misc]
async def update_booking(
    booking_id: uuid.UUID,
    body: UpdateBookingRequest,
    session: AsyncSession = Depends(get_session),
    patient_id: str = Depends(get_current_user),
) -> BookingResponse:
    try:
        return await booking_service.update_booking(session, booking_id, patient_id, body)
    except BookingNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except BookingAccessDeniedError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err)) from err


@router.post("/{booking_id}/confirm", response_model=BookingResponse, summary="Confirm booking")  # type: ignore[misc]
async def confirm_booking(
    booking_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> BookingResponse:
    """Confirm a pending booking and automatically create its consultation record."""
    try:
        return await booking_service.confirm_booking(session, booking_id)
    except BookingNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
