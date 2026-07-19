# Anime Mixtape — Dockerized Stack

Services: **Keycloak** (identity/JWT) → **FastAPI** (validates JWT, talks to Postgres + Redis) → **Postgres** (comments/likes) → **Redis** (caches the most-liked comment per anime) → **React/Vite** (served by nginx).

## 1. Start everything

```bash
docker compose up --build
```

First boot takes a minute or two (Keycloak has to start, connect to its DB, and import the realm).

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Keycloak admin console: http://localhost:8080 (user: `admin`, pass: `admin`)

## 2. One manual Keycloak step (required)

Registration works by having the backend call Keycloak's Admin API on your behalf, using the `anime-backend` service-account client. Keycloak's realm-import doesn't reliably wire up service-account role assignments from a plain JSON file, so do this once after first boot:

1. Open the admin console → select the **anime-mixtape** realm.
2. Go to **Clients → anime-backend → Service accounts roles**.
3. Under **Assign role**, filter by clients, pick **realm-management**, and assign **manage-users**.

Without this step, sign-up will fail with a 403 from Keycloak.

## 3. How the pieces fit together

1. **Sign up**: React → `POST /auth/register` (FastAPI) → FastAPI gets an admin token via `client_credentials` (using `anime-backend`) → creates the user in Keycloak via its Admin API.
2. **Log in**: React → Keycloak's token endpoint directly, using the `password` grant (Direct Access Grant) on the public `anime-frontend` client → gets back a JWT access token, stored in `localStorage`.
3. **Posting/liking a comment**: React sends the JWT in `Authorization: Bearer <token>` to FastAPI → FastAPI validates the token's signature against Keycloak's JWKS endpoint (`/realms/anime-mixtape/protocol/openid-connect/certs`), checks issuer + expiry, and pulls the user id (`sub`) and username off the token claims → writes the comment to Postgres with that user id attached.
4. **Top comment cache**: every time a like changes the ranking, FastAPI recomputes the most-liked comment for that anime and writes it to Redis (`top_comment:{anime_id}`). Reads check Redis first and only fall back to Postgres on a cache miss.

## 4. Things you should change before this is a real production deployment

- **Secrets**: `backend-service-secret`, the Postgres password, and the Keycloak admin password are all placeholders in `docker-compose.yml`. Move them to a `.env` file (not committed) and reference them with `${VAR}` in compose.
- **HTTPS**: everything here runs over plain HTTP for local dev. Put this behind a reverse proxy (nginx/Traefik/Caddy) with TLS in front of Keycloak, the API, and the frontend before exposing it publicly.
- **Direct Access Grant (ROPC)**: per your choice, the login form posts the password straight to Keycloac's token endpoint instead of redirecting to Keycloak's hosted login page. This keeps your custom UI, but means the frontend briefly handles the raw password. Keycloak itself recommends the redirect-based Authorization Code flow for public-facing apps — worth revisiting later if this becomes a real public site.
- **Migrations**: the backend calls `Base.metadata.create_all()` on startup for convenience. For a real deployment, switch to [Alembic](https://alembic.sqlalchemy.org/) migrations so schema changes are tracked and reversible.
- **Audience checks**: the backend currently doesn't enforce the JWT `aud` claim (Keycloak's default access-token audience is `account`, not your client id). If you want stricter validation, add a client scope/mapper in Keycloak that stamps a custom audience, then set it in `backend/app/auth.py`.
- **Real Google sign-in**: since Keycloak is now the identity provider, the correct way to add "Sign in with Google" is to configure it as a **Keycloak Identity Provider** (Keycloak admin console → Identity Providers → Google, using OAuth credentials from the Google Cloud Console). That gets you real Google login without the frontend or backend needing to know anything about Google directly. This is not wired up yet since it needs your own Google OAuth credentials.

## 5. Local dev without Docker (optional)

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
