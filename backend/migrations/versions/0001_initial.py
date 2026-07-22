"""initial schema - comments and comment_likes

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("anime_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("username", sa.String(length=128), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_comments_anime_id", "comments", ["anime_id"])
    op.create_index("idx_comments_anime_likes", "comments", ["anime_id", "likes"])

    op.create_table(
        "comment_likes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "comment_id",
            sa.Integer(),
            sa.ForeignKey("comments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("comment_id", "user_id", name="uq_comment_user_like"),
    )


def downgrade() -> None:
    op.drop_table("comment_likes")
    op.drop_index("idx_comments_anime_likes", table_name="comments")
    op.drop_index("idx_comments_anime_id", table_name="comments")
    op.drop_table("comments")
