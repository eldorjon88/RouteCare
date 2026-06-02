"""JWT creation/verification and auth dependencies (replaces middleware/auth.js)."""
import datetime as dt

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import JWT_EXPIRES_MINUTES, JWT_SECRET

ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def create_access_token(*, id: int, role: str, phone: str) -> str:
    now = dt.datetime.now(dt.timezone.utc)
    payload = {
        "id": id,
        "role": role,
        "phone": phone,
        "iat": now,
        "exp": now + dt.timedelta(minutes=JWT_EXPIRES_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """Verify the Bearer token and return {id, role, phone}."""
    if creds is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"id": payload.get("id"), "role": payload.get("role"), "phone": payload.get("phone")}


def require_roles(*roles: str):
    """Dependency factory restricting a route to the given roles (use after auth)."""

    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return checker
