import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from telehealth.utils.constants import ProviderSpecialty


class ProviderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    specialty: ProviderSpecialty
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    languages: str = Field(default="English", max_length=500)
    consultation_fee: float = Field(default=0.0, ge=0)


class CreateProviderRequest(ProviderBase):
    pass


class UpdateProviderRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    specialty: Optional[ProviderSpecialty] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    languages: Optional[str] = Field(None, max_length=500)
    consultation_fee: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


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
    specialty: Optional[ProviderSpecialty] = None
    language: Optional[str] = Field(None, max_length=50)
    search: Optional[str] = Field(None, max_length=100)
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None
