"""Unit tests for availability service validation logic.

Database-touching functions are tested via the integration suite.
These tests focus on the slot time validation in the Pydantic schema.
"""

from datetime import UTC, datetime

import pytest

from telehealth.schemas.availability import CreateAvailabilitySlotRequest


@pytest.mark.unit
class TestCreateAvailabilitySlotRequest:
    def test_valid_slot_passes_validation(self) -> None:
        slot = CreateAvailabilitySlotRequest(
            start_time=datetime(2026, 7, 1, 9, 0, tzinfo=UTC),
            end_time=datetime(2026, 7, 1, 9, 30, tzinfo=UTC),
        )
        assert slot.end_time > slot.start_time

    def test_end_before_start_raises_validation_error(self) -> None:
        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="end_time must be after start_time"):
            CreateAvailabilitySlotRequest(
                start_time=datetime(2026, 7, 1, 10, 0, tzinfo=UTC),
                end_time=datetime(2026, 7, 1, 9, 0, tzinfo=UTC),
            )

    def test_equal_start_and_end_raises_validation_error(self) -> None:
        from pydantic import ValidationError

        ts = datetime(2026, 7, 1, 9, 0, tzinfo=UTC)
        with pytest.raises(ValidationError):
            CreateAvailabilitySlotRequest(start_time=ts, end_time=ts)
