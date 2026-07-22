from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth, comments

# Schema is managed by Alembic migrations now (see migrations/), applied by
# the container entrypoint before this app starts - not by create_all().

app = FastAPI(title="Anime Mixtape API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(comments.router)


@app.get("/health")
def health():
    return {"status": "ok"}
