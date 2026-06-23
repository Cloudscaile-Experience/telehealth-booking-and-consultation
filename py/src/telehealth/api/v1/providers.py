import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from telehealth.db.session import get_session
from telehealth.schemas.common import PaginatedResponse
from telehealth.schemas.provider import (
    CreateProviderRequest,
    ListProvidersQuery,
    ProviderResponse,
    UpdateProviderRequest,
)
from telehealth.services import provider_service
from telehealth.services.provider_service import ProviderEmailConflictError, ProviderNotFoundError
from telehealth.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("", response_model=PaginatedResponse[ProviderResponse], summary="List providers")  # type: ignore[misc]
async def list_providers(
    query: ListProvidersQuery = Depends(),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[ProviderResponse]:
    """Return a paginated list of active providers with optional filters for
    specialty, language, text search, and time-window availability."""
    return await provider_service.list_providers(session, query)


@router.get("/{provider_id}", response_model=ProviderResponse, summary="Get provider")  # type: ignore[misc]
async def get_provider(
    provider_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> ProviderResponse:
    try:
        return await provider_service.get_provider(session, provider_id)
    except ProviderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED, summary="Create provider")  # type: ignore[misc]
async def create_provider(
    body: CreateProviderRequest,
    session: AsyncSession = Depends(get_session),
) -> ProviderResponse:
    try:
        return await provider_service.create_provider(session, body)
    except ProviderEmailConflictError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err)) from err


@router.patch("/{provider_id}", response_model=ProviderResponse, summary="Update provider")  # type: ignore[misc]
async def update_provider(
    provider_id: uuid.UUID,
    body: UpdateProviderRequest,
    session: AsyncSession = Depends(get_session),
) -> ProviderResponse:
    try:
        return await provider_service.update_provider(session, provider_id, body)
    except ProviderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete provider")  # type: ignore[misc]
async def delete_provider(
    provider_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        await provider_service.delete_provider(session, provider_id)
    except ProviderNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
