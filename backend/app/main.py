from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routers import auth, comments

# For a real production system, use Alembic migrations instead of create_all.
Base.metadata.create_all(bind=engine)

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
