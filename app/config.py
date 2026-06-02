"""Application configuration, loaded from environment via python-dotenv."""
import os

from dotenv import load_dotenv

load_dotenv()

# --- Server ---
PORT = int(os.getenv("PORT", "8000"))
ENV = os.getenv("ENV", "development")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")

# --- Auth ---
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "1440"))  # 24h

# --- OTP ---
OTP_PROVIDER = os.getenv("OTP_PROVIDER", "console")


def _database_url() -> str:
    """Build a SQLAlchemy/psycopg2 URL from DATABASE_URL or the PG* variables."""
    url = os.getenv("DATABASE_URL")
    if url:
        # Normalize Node-style schemes to SQLAlchemy + psycopg2.
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD", "postgres")
    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    name = os.getenv("PGDATABASE", "routecare")
    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"


DATABASE_URL = _database_url()
