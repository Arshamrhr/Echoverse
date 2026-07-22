from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class CommentOut(BaseModel):
    id: int
    anime_id: str
    user_id: str
    username: str
    text: str
    likes: int
    created_at: datetime

    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=6)
