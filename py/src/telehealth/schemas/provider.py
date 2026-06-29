import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from telehealth.utils.constants import ProviderSpecialty


class ProviderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    specialty: ProviderSpecialty
    bio: str | None = None
    avatar_url: str | None = Field(None, max_length=500)
    languages: str = Field(default="English", max_length=500)
    consultation_fee: float = Field(default=0.0, ge=0)


class CreateProviderRequest(ProviderBase):
    pass


class UpdateProviderRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    specialty: ProviderSpecialty | None = None
    bio: str | None = None
    avatar_url: str | None = Field(None, max_length=500)
    languages: str | None = Field(None, max_length=500)
    consultation_fee: float | None = Field(None, ge=0)
    is_active: bool | None = None


class ProviderResponse(ProviderBase):
    id: uuid.UUID
    rating: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ListProvidersQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    specialty: ProviderSpecialty | None = None
    language: str | None = Field(None, max_length=50)
    search: str | None = Field(None, max_length=100)
    available_from: datetime | None = None
    available_to: datetime | None = None
