from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from telehealth.db.base import Base
from telehealth.utils.constants import BookingStatus

if TYPE_CHECKING:
    from telehealth.db.models.availability_slot import AvailabilitySlot
    from telehealth.db.models.consultation import Consultation
    from telehealth.db.models.provider import Provider


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # patient_id is an external reference sourced from the JWT subject claim
    patient_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    provider_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True
    )
    slot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("availability_slots.id"), nullable=False, unique=True
    )
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="bookingstatus"), nullable=False, default=BookingStatus.PENDING
    )
    patient_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    provider: Mapped[Provider] = relationship("Provider", back_populates="bookings")
    slot: Mapped[AvailabilitySlot] = relationship("AvailabilitySlot", back_populates="booking")
    consultation: Mapped[Optional[Consultation]] = relationship(
        "Consultation", back_populates="booking", uselist=False
    )
