from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .. import models, redis_client, schemas
from ..auth import get_current_user
from ..db import get_db

router = APIRouter(prefix="/animes/{anime_id}/comments", tags=["comments"])


def _to_cache_dict(comment: models.Comment) -> dict:
    return {
        "id": comment.id,
        "username": comment.username,
        "text": comment.text,
        "likes": comment.likes,
    }


def _recompute_top(anime_id: str, db: Session) -> None:
    top = (
        db.query(models.Comment)
        .filter(models.Comment.anime_id == anime_id, models.Comment.likes > 0)
        .order_by(desc(models.Comment.likes), models.Comment.created_at.asc())
        .first()
    )
    if top:
        redis_client.set_cached_top_comment(anime_id, _to_cache_dict(top))
    else:
        redis_client.invalidate_top_comment(anime_id)


@router.get("", response_model=list[schemas.CommentOut])
def list_comments(anime_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.Comment)
        .filter(models.Comment.anime_id == anime_id)
        .order_by(models.Comment.created_at.asc())
        .all()
    )


@router.post("", response_model=schemas.CommentOut)
def post_comment(
    anime_id: str,
    body: schemas.CommentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    comment = models.Comment(
        anime_id=anime_id,
        user_id=user["sub"],
        username=user["username"],
        text=body.text,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.post("/{comment_id}/like", response_model=schemas.CommentOut)
def like_comment(
    anime_id: str,
    comment_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    comment = (
        db.query(models.Comment)
        .filter(models.Comment.id == comment_id, models.Comment.anime_id == anime_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    already_liked = (
        db.query(models.CommentLike)
        .filter(models.CommentLike.comment_id == comment_id, models.CommentLike.user_id == user["sub"])
        .first()
    )
    if already_liked:
        raise HTTPException(status_code=400, detail="You already liked this comment")

    db.add(models.CommentLike(comment_id=comment_id, user_id=user["sub"]))
    comment.likes += 1
    db.commit()
    db.refresh(comment)

    # This like might have changed who's #1 - recompute and refresh the cache
    _recompute_top(anime_id, db)

    return comment


@router.get("/top")
def get_top_comment(anime_id: str, db: Session = Depends(get_db)):
    cached = redis_client.get_cached_top_comment(anime_id)
    if cached is not None:
        return {"source": "cache", **cached}

    top = (
        db.query(models.Comment)
        .filter(models.Comment.anime_id == anime_id, models.Comment.likes > 0)
        .order_by(desc(models.Comment.likes), models.Comment.created_at.asc())
        .first()
    )
    if not top:
        return None

    result = _to_cache_dict(top)
    redis_client.set_cached_top_comment(anime_id, result)
    return {"source": "db", **result}
