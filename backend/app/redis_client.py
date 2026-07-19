import json

import redis

from .config import settings

r = redis.from_url(settings.REDIS_URL, decode_responses=True)

_TTL_SECONDS = 3600  # backstop expiry; we also actively invalidate/update on writes


def _key(anime_id: str) -> str:
    return f"top_comment:{anime_id}"


def get_cached_top_comment(anime_id: str) -> dict | None:
    raw = r.get(_key(anime_id))
    return json.loads(raw) if raw else None


def set_cached_top_comment(anime_id: str, comment: dict) -> None:
    r.set(_key(anime_id), json.dumps(comment), ex=_TTL_SECONDS)


def invalidate_top_comment(anime_id: str) -> None:
    r.delete(_key(anime_id))
