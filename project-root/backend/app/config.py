"""Configuration loaded from environment variables (.env via python-dotenv)."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load ONLY this backend's .env (do not search parent directories, which could
# accidentally pick up another project's .env).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

APP_NAME = "Shared Backend API"
API_V1_PREFIX = "/api/v1"

PORT = int(os.getenv("PORT", "8000"))
ENV = os.getenv("ENV", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# SQLite by default (zero-config). Override with a Postgres URL in .env.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# The two mobile apps this backend serves (used to scope users/data).
KNOWN_APPS = {"app1", "app2"}
