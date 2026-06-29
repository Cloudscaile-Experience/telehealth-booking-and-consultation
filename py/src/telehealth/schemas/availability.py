import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class CreateAvailabilitySlotRequest(BaseModel):
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_slot_times(self) -> "CreateAvailabilitySlotRequest":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class AvailabilitySlotResponse(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID
    start_time: datetime
    end_time: datetime
    is_booked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ListAvailabilityQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    from_time: datetime | None = None
    to_time: datetime | None = None
    include_booked: bool = False
