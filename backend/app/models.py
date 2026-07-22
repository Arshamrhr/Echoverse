from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint

from .db import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    anime_id = Column(String(64), index=True, nullable=False)
    user_id = Column(String(128), nullable=False)  # Keycloak "sub" claim
    username = Column(String(128), nullable=False)  # denormalized for display
    text = Column(Text, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class CommentLike(Base):
    __tablename__ = "comment_likes"
    __table_args__ = (UniqueConstraint("comment_id", "user_id", name="uq_comment_user_like"),)

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
