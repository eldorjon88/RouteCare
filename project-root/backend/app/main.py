"""Shared backend API entry point.

Exposes a single versioned REST API under /api/v1 that both mobile apps consume.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import API_V1_PREFIX, APP_NAME, CORS_ORIGINS
from .database import Base, engine
from . import models  # noqa: F401  (register models on Base.metadata)
from .routers import auth, data, users

# Create tables (fine for the SQLite demo; use migrations for production Postgres).
Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_NAME, version="1.0.0")

origins = ["*"] if CORS_ORIGINS == "*" else [o.strip() for o in CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "shared-backend"}


# All routes live under /api/v1
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
app.include_router(data.router, prefix=API_V1_PREFIX)
