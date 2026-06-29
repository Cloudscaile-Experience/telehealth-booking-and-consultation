import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from telehealth.schemas.consultation import VideoTokenResponse
from telehealth.utils.config import settings
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


class VideoTokenError(Exception):
    pass


def generate_video_token(session_id: str, participant_id: str) -> VideoTokenResponse:
    """Generate a signed JWT video-session token for the given session and participant.

    The token encodes session_id, participant_id, expiry, and a 'type' claim
    so the video service can validate it independently.
    """
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.VIDEO_SESSION_EXPIRY_MINUTES)

    payload: dict[str, Any] = {
        "session_id": session_id,
        "participant_id": participant_id,
        "type": "video_session",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token: str = jwt.encode(payload, settings.VIDEO_SESSION_SECRET, algorithm=settings.JWT_ALGORITHM)

    logger.info("Video token generated", extra={"session_id": session_id, "participant_id": participant_id})

    return VideoTokenResponse(token=token, session_id=session_id, expires_at=expires_at)


def verify_video_token(token: str) -> dict[str, Any]:
    """Decode and verify a video-session token.

    Raises VideoTokenError if the token is invalid or expired.
    """
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.VIDEO_SESSION_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as err:
        raise VideoTokenError("Invalid or expired video session token") from err


def new_session_id() -> str:
    """Generate a unique video session identifier."""
    return f"sess_{uuid.uuid4().hex}"
