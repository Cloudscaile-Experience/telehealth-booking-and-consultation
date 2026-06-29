import base64
import json
from typing import Any

from fastapi import Header, HTTPException, status

from telehealth.schemas.user import UserContext
from telehealth.utils.logger import get_logger

logger = get_logger(__name__)


def _decode_jwt_payload(token: str) -> dict[str, Any]:
    """Decode the JWT payload segment without verifying the signature.

    The API gateway upstream is responsible for signature validation.
    This service only reads the encoded claims.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Malformed JWT: expected 3 dot-separated segments")

    payload_segment = parts[1]
    # Base64url may omit padding — restore it before decoding
    padding = 4 - len(payload_segment) % 4
    if padding != 4:
        payload_segment += "=" * padding

    decoded_bytes = base64.urlsafe_b64decode(payload_segment)
    return json.loads(decoded_bytes.decode("utf-8"))  # type: ignore[no-any-return]


def extract_user_context(token: str) -> UserContext:
    """Extract a typed UserContext from a raw JWT token string.

    Maps OIDC claims forwarded by the gateway:
      sub           → id
      email         → email
      given_name    → first_name
      family_name   → last_name
      tenantId      → tenant_id
      resource_access[*][roles] → role (collected across all client entries)

    Raises:
        ValueError: If the token is malformed or required claims are missing.
    """
    try:
        claims = _decode_jwt_payload(token)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as err:
        raise ValueError(f"Invalid JWT token: {err}") from err

    user_id = claims.get("sub")
    email = claims.get("email")
    first_name = claims.get("given_name")
    last_name = claims.get("family_name")
    tenant_id = claims.get("tenantId")

    missing = [
        field
        for field, value in {
            "sub": user_id,
            "email": email,
            "given_name": first_name,
            "family_name": last_name,
            "tenantId": tenant_id,
        }.items()
        if not value
    ]
    if missing:
        raise ValueError(f"Missing required JWT claims: {', '.join(missing)}")

    # Collect roles from resource_access[client_id]["roles"] across all clients
    roles: list[str] = []
    for client_access in claims.get("resource_access", {}).values():
        if isinstance(client_access, dict):
            client_roles = client_access.get("roles", [])
            if isinstance(client_roles, list):
                roles.extend(client_roles)

    logger.debug(
        "User context extracted",
        extra={"user_id": user_id, "email": email, "roles": roles, "tenant_id": tenant_id},
    )

    return UserContext(
        id=str(user_id),
        email=str(email),
        first_name=str(first_name),
        last_name=str(last_name),
        role=roles,
        tenant_id=str(tenant_id),
    )


def _bearer_token(authorization: str | None) -> str:
    """Extract the raw token string from an Authorization header.

    Raises HTTP 401 if the header is absent or not in Bearer scheme.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer scheme",
        )
    return authorization[len("Bearer ") :]


async def get_current_user(
    authorization: str | None = Header(default=None),
) -> str:
    """FastAPI dependency — returns the user ID (sub or id claim) as a plain string.

    Use this for routes that only need to identify the caller.
    """
    token = _bearer_token(authorization)
    try:
        claims = _decode_jwt_payload(token)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as err:
        logger.warning("JWT payload decode failed", extra={"error": str(err)})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from err

    user_id = claims.get("sub") or claims.get("id") or ""
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return str(user_id)


async def get_user_context(
    authorization: str | None = Header(default=None),
) -> UserContext:
    """FastAPI dependency — returns a fully typed UserContext with all OIDC claims.

    Use this when a route needs role, email, or tenant in addition to user ID.
    """
    token = _bearer_token(authorization)
    try:
        return extract_user_context(token)
    except ValueError as err:
        logger.warning("Failed to extract user context", extra={"error": str(err)})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from err
