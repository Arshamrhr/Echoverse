import time

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import settings

security = HTTPBearer()

# Cache Keycloak's public keys in memory so we're not fetching them on every request
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL_SECONDS = 3600


async def _get_jwks() -> dict:
    now = time.time()
    if not _jwks_cache["keys"] or now - _jwks_cache["fetched_at"] > _JWKS_TTL_SECONDS:
        url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            _jwks_cache["keys"] = resp.json()
            _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validates the bearer token's signature, issuer, and expiry against Keycloak.

    Note: Keycloak's default access-token audience is usually "account", not the
    client id, so we don't enforce `aud` here. If you want strict audience
    checks, add a custom "audience" client scope/mapper in Keycloak for
    echoverse-frontend and set audience=settings.KEYCLOAK_CLIENT_ID below.
    """
    token = creds.credentials
    try:
        jwks = await _get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        key = next((k for k in jwks["keys"] if k["kid"] == unverified_header.get("kid")), None)
        if key is None:
            raise HTTPException(status_code=401, detail="Unknown token signing key")

        issuer = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}"
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
        return {
            "sub": payload["sub"],
            "username": payload.get("preferred_username", "unknown"),
            "email": payload.get("email"),
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Could not reach Keycloak to validate token")
