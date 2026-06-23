import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from telehealth.utils.constants import ConsultationStatus


class ConsultationResponse(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    video_session_id: str
    status: ConsultationStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    provider_notes: Optional[str]
    patient_notes: Optional[str]
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VideoTokenResponse(BaseModel):
    token: str
    session_id: str
    expires_at: datetime


class UpdateNotesRequest(BaseModel):
    provider_notes: Optional[str] = Field(None, max_length=5000)
    patient_notes: Optional[str] = Field(None, max_length=5000)


class UpdateSummaryRequest(BaseModel):
    summary: str = Field(..., min_length=1, max_length=5000)
