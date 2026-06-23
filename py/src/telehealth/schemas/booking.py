import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from telehealth.schemas.availability import AvailabilitySlotResponse
from telehealth.utils.constants import BookingStatus


class CreateBookingRequest(BaseModel):
    provider_id: uuid.UUID
    slot_id: uuid.UUID
    patient_notes: Optional[str] = Field(None, max_length=1000)


class UpdateBookingRequest(BaseModel):
    status: Optional[BookingStatus] = None
    patient_notes: Optional[str] = Field(None, max_length=1000)


class BookingResponse(BaseModel):
    id: uuid.UUID
    patient_id: str
    provider_id: uuid.UUID
    slot_id: uuid.UUID
    status: BookingStatus
    patient_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookingDetailResponse(BookingResponse):
    slot: AvailabilitySlotResponse


class ListBookingsQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    status: Optional[BookingStatus] = None
    provider_id: Optional[uuid.UUID] = None
