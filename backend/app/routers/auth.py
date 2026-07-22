import httpx
from fastapi import APIRouter, HTTPException

from ..config import settings
from ..schemas import RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


async def _get_admin_token() -> str:
    """
    Client-credentials grant for the confidential 'echoverse-backend' client.
    Requires that client's service account to have the 'manage-users' role
    from the 'realm-management' client (see README for the one-time setup step).
    """
    url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": settings.KEYCLOAK_ADMIN_CLIENT_ID,
        "client_secret": settings.KEYCLOAK_ADMIN_CLIENT_SECRET,
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(url, data=data)
        if resp.status_code >= 300:
            raise HTTPException(status_code=503, detail="Could not authenticate with Keycloak admin API")
        return resp.json()["access_token"]


@router.post("/register")
async def register(body: RegisterRequest):
    admin_token = await _get_admin_token()

    admin_url = f"{settings.KEYCLOAK_URL}/admin/realms/{settings.KEYCLOAK_REALM}/users"
    payload = {
        "username": body.username,
        "email": body.email,
        "firstName": body.username,
        "lastName": "User",
        "enabled": True,
        "emailVerified": True,
        "requiredActions": [],
        "credentials": [{"type": "password", "value": body.password, "temporary": False}],
    }

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(
            admin_url,
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    if resp.status_code == 409:
        raise HTTPException(status_code=400, detail="That username or email is already registered")
    if resp.status_code >= 300:
        raise HTTPException(status_code=400, detail=f"Keycloak rejected registration: {resp.text}")

    return {"success": True}
