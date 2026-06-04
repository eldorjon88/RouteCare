"""Database models. Users and Items are both scoped by `app` so the two mobile
apps share one backend while keeping their own users and data."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    app = Column(String, nullable=False, default="app1")   # "app1" | "app2"
    role = Column(String, nullable=False, default="user")  # "user" | "admin"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Item(Base):
    """Generic data record used by the shared /data endpoint."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    app = Column(String, nullable=False)            # which app the item belongs to
    title = Column(String, nullable=False)
    content = Column(String, nullable=False, default="")
    done = Column(Boolean, nullable=False, default=False)  # used by app2 (tasks)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
