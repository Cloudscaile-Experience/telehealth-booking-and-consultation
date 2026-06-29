import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.session import get_session
from telehealth.middleware.auth import get_current_user
from telehealth.schemas.consultation import (
    ConsultationResponse,
    UpdateNotesRequest,
    UpdateSummaryRequest,
    VideoTokenResponse,
)
from telehealth.services import consultation_service
from telehealth.services.consultation_service import ConsultationNotFoundError, ConsultationStateError
from telehealth.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/{consultation_id}", response_model=ConsultationResponse, summary="Get consultation")
async def get_consultation(
    consultation_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> ConsultationResponse:
    try:
        return await consultation_service.get_consultation(session, consultation_id)
    except ConsultationNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post(
    "/{consultation_id}/start",
    response_model=VideoTokenResponse,
    summary="Start consultation",
)
async def start_consultation(
    consultation_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    participant_id: str = Depends(get_current_user),
) -> VideoTokenResponse:
    """Mark the consultation as in-progress and return a signed video-session token."""
    try:
        return await consultation_service.start_consultation(session, consultation_id, participant_id)
    except ConsultationNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except ConsultationStateError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err


@router.post(
    "/{consultation_id}/end",
    response_model=ConsultationResponse,
    summary="End consultation",
)
async def end_consultation(
    consultation_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> ConsultationResponse:
    """Mark the consultation as completed and invalidate the video token."""
    try:
        return await consultation_service.end_consultation(session, consultation_id)
    except ConsultationNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except ConsultationStateError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err


@router.get(
    "/{consultation_id}/video-token",
    response_model=VideoTokenResponse,
    summary="Refresh video token",
)
async def refresh_video_token(
    consultation_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    participant_id: str = Depends(get_current_user),
) -> VideoTokenResponse:
    """Generate a fresh video-session token for an in-progress consultation."""
    try:
        return await consultation_service.refresh_video_token(session, consultation_id, participant_id)
    except ConsultationNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except ConsultationStateError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err


@router.patch(
    "/{consultation_id}/notes",
    response_model=ConsultationResponse,
    summary="Update consultation notes",
)
async def update_notes(
    consultation_id: uuid.UUID,
    body: UpdateNotesRequest,
    session: AsyncSession = Depends(get_session),
) -> ConsultationResponse:
    try:
        return await consultation_service.update_notes(session, consultation_id, body)
    except ConsultationNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.patch(
    "/{consultation_id}/summary",
    response_model=ConsultationResponse,
    summary="Update post-visit summary",
)
async def update_summary(
    consultation_id: uuid.UUID,
    body: UpdateSummaryRequest,
    session: AsyncSession = Depends(get_session),
) -> ConsultationResponse:
    """Add or update the post-visit summary for a completed consultation."""
    try:
        return await consultation_service.update_summary(session, consultation_id, body)
    except ConsultationNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except ConsultationStateError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err
