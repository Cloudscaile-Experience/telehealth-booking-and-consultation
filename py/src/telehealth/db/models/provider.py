from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from telehealth.db.base import Base

if TYPE_CHECKING:
    from telehealth.db.models.availability_slot import AvailabilitySlot
    from telehealth.db.models.booking import Booking


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    languages: Mapped[str] = mapped_column(String(500), nullable=False, default="English")
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    consultation_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    availability_slots: Mapped[list[AvailabilitySlot]] = relationship(
        "AvailabilitySlot", back_populates="provider", cascade="all, delete-orphan"
    )
    bookings: Mapped[list[Booking]] = relationship("Booking", back_populates="provider")
