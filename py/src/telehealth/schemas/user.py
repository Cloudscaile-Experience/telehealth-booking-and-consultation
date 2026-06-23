from pydantic import BaseModel


class UserContext(BaseModel):
    """User identity extracted from the JWT forwarded by the API gateway.

    Claims are sourced from the OIDC token populated by the gateway:
      sub           → id
      email         → email
      given_name    → first_name
      family_name   → last_name
      tenantId      → tenant_id
      resource_access[*][roles] → role (collected across all clients)
    """

    id: str
    email: str
    first_name: str
    last_name: str
    role: list[str]
    tenant_id: str
