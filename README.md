# Anime Mixtape — Dockerized Stack

Services: **Keycloak** (identity/JWT) → **FastAPI** (validates JWT, talks to Postgres + Redis) → **Postgres** (comments/likes) → **Redis** (caches the most-liked comment per anime) → **React/Vite** (served by nginx).

## 1. Set up your secrets

```bash
cp .env.example .env
```

A real `.env` with strong, already-generated passwords is included for you to start from — open it and rotate the values if you want your own. **`.env` is gitignored** and will never be pushed to GitHub; `.env.example` (no real secrets) is what other people cloning the repo see.

## 2. Start everything

```bash
docker compose up --build
```

First boot takes a minute or two (Keycloak has to start, connect to its DB, and import the realm).

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Keycloak admin console: http://localhost:8080 (user: `admin`, password: whatever's in your `.env`)

## 3. Two manual Keycloak steps (required, one-time)

Keycloak's realm-import doesn't reliably wire up service-account role assignments or hand you back a generated client secret from a plain JSON file, so do these once after first boot:

**a) Assign the backend permission to create users**
1. Admin console → select the **anime-mixtape** realm.
2. **Clients → anime-backend → Service accounts roles**.
3. **Assign role** → filter by clients → **realm-management** → assign **manage-users**.

**b) Get the backend's client secret into your `.env`**
1. **Clients → anime-backend → Credentials tab**.
2. Copy the **Client secret** shown there (or click "Regenerate" for a fresh one).
3. Paste it into `.env` as `KEYCLOAK_ADMIN_CLIENT_SECRET=...`.
4. Restart just the backend so it picks up the new value: `docker compose up -d --build backend`.

Without both steps, sign-up will fail (403 from Keycloak, or an auth error creating the admin token).

## 4. If the Postgres container fails to start

The single most common cause: **port 5432 is already taken** by a Postgres install already running on your machine (very common on macOS/Linux dev boxes). This compose file no longer publishes Postgres or Redis to your host at all — they're only reachable from other containers on the compose network — specifically to avoid this. If you're still hitting a conflict:

```bash
docker compose down -v      # wipes the named volume too - fresh start
docker compose up --build
```

Other things worth checking if it still fails:
- `docker compose logs postgres` — the actual error is almost always in here; happy to help interpret it if you paste it.
- If you'd previously run an older version of this compose file and it partially initialized the database volume, `down -v` clears that out (the `-v` removes the `pgdata` volume, so you lose any existing comments/likes — fine for local dev, not for anything with real data in it).
- If you edited any of the `.sh` files on Windows, make sure your editor/git isn't converting line endings to CRLF (`git config core.autocrlf input` avoids this) — a `.sh` file with Windows line endings can fail with a cryptic `$'\r': command not found` error.

## 5. How the pieces fit together

1. **Sign up**: React → `POST /auth/register` (FastAPI) → FastAPI gets an admin token via `client_credentials` (using `anime-backend`) → creates the user in Keycloak via its Admin API.
2. **Log in**: React → Keycloak's token endpoint directly, using the `password` grant (Direct Access Grant) on the public `anime-frontend` client → gets back a JWT access token, stored in `localStorage`.
3. **Posting/liking a comment**: React sends the JWT in `Authorization: Bearer <token>` to FastAPI → FastAPI validates the token's signature against Keycloak's JWKS endpoint (`/realms/anime-mixtape/protocol/openid-connect/certs`), checks issuer + expiry, and pulls the user id (`sub`) and username off the token claims → writes the comment to Postgres with that user id attached.
4. **Top comment cache**: every time a like changes the ranking, FastAPI recomputes the most-liked comment for that anime and writes it to Redis (`top_comment:{anime_id}`). Reads check Redis first and only fall back to Postgres on a cache miss.

## 6. Database schema changes (Alembic)

The `comments`/`comment_likes` tables are no longer created by a one-off SQL script — they're managed by **Alembic migrations** in `backend/migrations/versions/`. The backend's `entrypoint.sh` runs `alembic upgrade head` automatically every time the container starts, before the API comes up. Postgres's `init.sh` now only creates the two *databases* themselves (`keycloak`, `animedb`) — something Alembic can't do, since a migration runs inside an already-existing database.

**When you change a model** (add a column, add a table, etc. in `backend/app/models.py`):

```bash
# Generate a new migration by diffing your models against the current DB schema
docker compose exec backend alembic revision --autogenerate -m "add likes_count to users"

# Review the generated file in backend/migrations/versions/ - autogenerate is
# good but not perfect (e.g. it won't always catch column renames correctly)

# Apply it
docker compose exec backend alembic upgrade head
```

From then on, that migration just runs automatically on every `docker compose up` (via the entrypoint) — for you and for anyone else who pulls the repo. No one has to manually drop/recreate the database or hand-run SQL again.

Other useful commands:
```bash
docker compose exec backend alembic current      # what migration is the DB currently at
docker compose exec backend alembic history       # list all migrations
docker compose exec backend alembic downgrade -1  # roll back one migration
```

## 7. Pushing this to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

`.env` won't be included (it's in `.gitignore`) — double check with `git status` before your first push that it isn't showing up as a tracked file. If you ever do accidentally commit it, rotating every password/secret it contained is the only real fix — removing it in a later commit doesn't remove it from git history.

## 8. Things worth changing before this is a real production deployment

- **HTTPS**: everything here runs over plain HTTP for local dev. Put this behind a reverse proxy (nginx/Traefik/Caddy) with TLS in front of Keycloak, the API, and the frontend before exposing it publicly.
- **Direct Access Grant (ROPC)**: per your earlier choice, the login form posts the password straight to Keycloak's token endpoint instead of redirecting to Keycloak's hosted login page. This keeps your custom UI, but means the frontend briefly handles the raw password. Keycloak itself recommends the redirect-based Authorization Code flow for public-facing apps — worth revisiting later if this becomes a real public site.
- **Audience checks**: the backend currently doesn't enforce the JWT `aud` claim (Keycloak's default access-token audience is `account`, not your client id). If you want stricter validation, add a client scope/mapper in Keycloak that stamps a custom audience, then set it in `backend/app/auth.py`.
- **Real Google sign-in**: since Keycloak is now the identity provider, the correct way to add "Sign in with Google" is to configure it as a **Keycloak Identity Provider** (admin console → Identity Providers → Google, using OAuth credentials from the Google Cloud Console). That gets you real Google login without the frontend or backend needing to know anything about Google directly. Not wired up yet since it needs your own Google OAuth credentials.

## 9. Local dev without Docker (optional)

Backend:
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
