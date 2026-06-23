"""Unit tests for the decode-only JWT auth middleware.

No signature verification happens here — that is the API gateway's responsibility.
Tests cover raw payload decoding, UserContext extraction, claim mapping, and error paths.
"""
import base64
import json

import pytest

from telehealth.middleware.auth import _decode_jwt_payload, extract_user_context
from telehealth.schemas.user import UserContext


def _make_token(payload: dict, valid_sig: bool = True) -> str:
    """Build a minimal JWT-shaped token for testing (no real signing)."""
    header = base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').rstrip(b"=").decode()
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    sig = "validsig" if valid_sig else "XXXXX"
    return f"{header}.{body}.{sig}"


_FULL_CLAIMS = {
    "sub": "user-123",
    "email": "patient@example.com",
    "given_name": "Jane",
    "family_name": "Doe",
    "tenantId": "tenant-abc",
    "resource_access": {
        "telehealth-client": {"roles": ["patient"]},
        "admin-client": {"roles": ["viewer", "editor"]},
    },
}


@pytest.mark.unit
class TestDecodeJwtPayload:
    def test_decodes_standard_sub_claim(self) -> None:
        token = _make_token({"sub": "user-123", "role": "patient"})
        payload = _decode_jwt_payload(token)
        assert payload["sub"] == "user-123"

    def test_decodes_payload_regardless_of_signature(self) -> None:
        token = _make_token({"sub": "u-1"}, valid_sig=False)
        assert _decode_jwt_payload(token)["sub"] == "u-1"

    def test_two_segments_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Malformed JWT"):
            _decode_jwt_payload("only.two")

    def test_four_segments_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Malformed JWT"):
            _decode_jwt_payload("a.b.c.d")

    def test_handles_unpadded_base64url(self) -> None:
        payload = {"sub": "u-abc", "email": "test@example.com"}
        encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
        assert "=" not in encoded
        result = _decode_jwt_payload(f"header.{encoded}.sig")
        assert result["sub"] == "u-abc"


@pytest.mark.unit
class TestExtractUserContext:
    def test_maps_all_required_claims(self) -> None:
        token = _make_token(_FULL_CLAIMS)
        ctx = extract_user_context(token)

        assert ctx.id == "user-123"
        assert ctx.email == "patient@example.com"
        assert ctx.first_name == "Jane"
        assert ctx.last_name == "Doe"
        assert ctx.tenant_id == "tenant-abc"

    def test_collects_roles_from_all_resource_access_clients(self) -> None:
        token = _make_token(_FULL_CLAIMS)
        ctx = extract_user_context(token)

        assert set(ctx.role) == {"patient", "viewer", "editor"}

    def test_returns_empty_roles_when_resource_access_absent(self) -> None:
        claims = {**_FULL_CLAIMS}
        del claims["resource_access"]
        ctx = extract_user_context(_make_token(claims))
        assert ctx.role == []

    def test_raises_when_sub_missing(self) -> None:
        claims = {**_FULL_CLAIMS}
        del claims["sub"]
        with pytest.raises(ValueError, match="Missing required JWT claims"):
            extract_user_context(_make_token(claims))

    def test_raises_when_email_missing(self) -> None:
        claims = {**_FULL_CLAIMS}
        del claims["email"]
        with pytest.raises(ValueError, match="Missing required JWT claims"):
            extract_user_context(_make_token(claims))

    def test_raises_when_tenant_id_missing(self) -> None:
        claims = {**_FULL_CLAIMS}
        del claims["tenantId"]
        with pytest.raises(ValueError, match="Missing required JWT claims"):
            extract_user_context(_make_token(claims))

    def test_raises_on_malformed_token(self) -> None:
        with pytest.raises(ValueError, match="Invalid JWT token"):
            extract_user_context("not.a.valid.token.at.all")

    def test_returns_user_context_instance(self) -> None:
        token = _make_token(_FULL_CLAIMS)
        ctx = extract_user_context(token)
        assert isinstance(ctx, UserContext)


@pytest.mark.unit
class TestUserContextSchema:
    def test_role_is_list(self) -> None:
        ctx = UserContext(
            id="u-1",
            email="a@b.com",
            first_name="A",
            last_name="B",
            role=["patient", "admin"],
            tenant_id="t-1",
        )
        assert ctx.role == ["patient", "admin"]

    def test_empty_role_list_is_valid(self) -> None:
        ctx = UserContext(id="u-2", email="x@y.com", first_name="X", last_name="Y", role=[], tenant_id="t-2")
        assert ctx.role == []
