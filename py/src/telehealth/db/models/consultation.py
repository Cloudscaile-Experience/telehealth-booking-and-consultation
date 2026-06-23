from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from telehealth.db.base import Base
from telehealth.utils.constants import ConsultationStatus

if TYPE_CHECKING:
    from telehealth.db.models.booking import Booking


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, unique=True
    )
    video_session_id: Mapped[str] = mapped_column(String(255), nullable=False)
    # Stored token is nullable — regenerated on demand via /video-token endpoint
    video_session_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ConsultationStatus] = mapped_column(
        SAEnum(ConsultationStatus, name="consultationstatus"),
        nullable=False,
        default=ConsultationStatus.SCHEDULED,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    provider_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    booking: Mapped[Booking] = relationship("Booking", back_populates="consultation")
