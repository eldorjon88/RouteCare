"""Pydantic request/response models."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# --- Auth ---
class RegisterIn(BaseModel):
    username: str
    password: str
    app: str = "app1"
    role: str = "user"


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    app: str
    role: str
    created_at: datetime


# --- Data ---
class ItemIn(BaseModel):
    title: str
    content: str = ""


class ItemUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    done: bool | None = None


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    app: str
    title: str
    content: str
    done: bool
    created_at: datetime
