"""Unit tests for BookingDetailResponse schema — consultation_id field behaviour."""

import uuid
from datetime import UTC, datetime

import pytest

from telehealth.schemas.availability import AvailabilitySlotResponse
from telehealth.schemas.booking import BookingDetailResponse, BookingResponse
from telehealth.utils.constants import BookingStatus

_NOW = datetime(2026, 7, 1, 10, 0, tzinfo=UTC)
_SLOT_ID = uuid.uuid4()
_PROVIDER_ID = uuid.uuid4()
_BOOKING_ID = uuid.uuid4()


def _make_slot() -> AvailabilitySlotResponse:
    return AvailabilitySlotResponse(
        id=_SLOT_ID,
        provider_id=_PROVIDER_ID,
        start_time=_NOW,
        end_time=datetime(2026, 7, 1, 10, 30, tzinfo=UTC),
        is_booked=True,
        created_at=_NOW,
        updated_at=_NOW,
    )


def _make_detail(**overrides: object) -> BookingDetailResponse:
    base: dict[str, object] = {
        "id": _BOOKING_ID,
        "patient_id": "patient-123",
        "provider_id": _PROVIDER_ID,
        "slot_id": _SLOT_ID,
        "status": BookingStatus.CONFIRMED,
        "patient_notes": None,
        "created_at": _NOW,
        "updated_at": _NOW,
        "slot": _make_slot(),
    }
    base.update(overrides)
    return BookingDetailResponse.model_validate(base)


@pytest.mark.unit
class TestBookingDetailResponseConsultationId:
    def test_consultation_id_defaults_to_none(self) -> None:
        detail = _make_detail()
        assert detail.consultation_id is None

    def test_consultation_id_accepts_uuid(self) -> None:
        cid = uuid.uuid4()
        detail = _make_detail(consultation_id=cid)
        assert detail.consultation_id == cid

    def test_consultation_id_serialised_in_json(self) -> None:
        cid = uuid.uuid4()
        detail = _make_detail(consultation_id=cid)
        data = detail.model_dump()
        assert "consultation_id" in data
        assert data["consultation_id"] == cid

    def test_consultation_id_null_in_json_when_absent(self) -> None:
        detail = _make_detail()
        data = detail.model_dump()
        assert data["consultation_id"] is None

    def test_model_copy_updates_consultation_id(self) -> None:
        detail = _make_detail()
        cid = uuid.uuid4()
        updated = detail.model_copy(update={"consultation_id": cid})
        assert updated.consultation_id == cid
        assert detail.consultation_id is None  # original unchanged

    def test_booking_detail_response_is_superset_of_booking_response(self) -> None:
        base_fields = set(BookingResponse.model_fields)
        detail_fields = set(BookingDetailResponse.model_fields)
        assert base_fields.issubset(detail_fields)
        assert "consultation_id" in detail_fields
        assert "slot" in detail_fields
