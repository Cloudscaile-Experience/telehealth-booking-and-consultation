"""Unit tests for the video token service.

Tests verify token generation, expiry encoding, and decode/verify behaviour
without any network or database calls.
"""

from datetime import UTC, datetime

import pytest
from freezegun import freeze_time
from jose import jwt

from telehealth.services.video_token_service import (
    VideoTokenError,
    generate_video_token,
    new_session_id,
    verify_video_token,
)
from telehealth.utils.config import settings


@pytest.mark.unit
class TestNewSessionId:
    def test_returns_unique_ids(self) -> None:
        ids = {new_session_id() for _ in range(100)}
        assert len(ids) == 100

    def test_prefixed_with_sess(self) -> None:
        assert new_session_id().startswith("sess_")


@pytest.mark.unit
class TestGenerateVideoToken:
    @freeze_time("2026-06-23T10:00:00Z")  # type: ignore[misc]
    def test_returns_token_response(self) -> None:
        result = generate_video_token("sess_abc", "patient-123")

        assert result.session_id == "sess_abc"
        assert result.token
        assert result.expires_at > datetime.now(UTC)

    @freeze_time("2026-06-23T10:00:00Z")  # type: ignore[misc]
    def test_token_encodes_correct_claims(self) -> None:
        result = generate_video_token("sess_xyz", "provider-456")

        payload = jwt.decode(result.token, settings.VIDEO_SESSION_SECRET, algorithms=[settings.JWT_ALGORITHM])

        assert payload["session_id"] == "sess_xyz"
        assert payload["participant_id"] == "provider-456"
        assert payload["type"] == "video_session"

    @freeze_time("2026-06-23T10:00:00Z")  # type: ignore[misc]
    def test_expiry_matches_config(self) -> None:
        result = generate_video_token("sess_exp", "user-1")

        payload = jwt.decode(result.token, settings.VIDEO_SESSION_SECRET, algorithms=[settings.JWT_ALGORITHM])
        now_ts = int(datetime(2026, 6, 23, 10, 0, 0, tzinfo=UTC).timestamp())
        expected_exp = now_ts + settings.VIDEO_SESSION_EXPIRY_MINUTES * 60
        assert payload["exp"] == expected_exp


@pytest.mark.unit
class TestVerifyVideoToken:
    def test_valid_token_returns_payload(self) -> None:
        token_resp = generate_video_token("sess_v", "u-1")
        payload = verify_video_token(token_resp.token)

        assert payload["session_id"] == "sess_v"
        assert payload["participant_id"] == "u-1"

    def test_invalid_token_raises_video_token_error(self) -> None:
        with pytest.raises(VideoTokenError, match="Invalid or expired"):
            verify_video_token("not.a.valid.token")

    def test_tampered_token_raises_video_token_error(self) -> None:
        token_resp = generate_video_token("sess_t", "u-2")
        tampered = token_resp.token[:-4] + "XXXX"

        with pytest.raises(VideoTokenError):
            verify_video_token(tampered)
