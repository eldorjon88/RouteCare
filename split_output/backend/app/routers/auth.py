"""Authentication routes (replaces routes/auth.js)."""
import re

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..rate_limit import limiter
from ..schemas import RequestOtpIn, UserOut, VerifyOtpIn
from ..security import create_access_token
from ..services import otp_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

PHONE_RE = re.compile(r"^\+998\d{9}$")  # E.164 for Uzbekistan (see CLAUDE.md)
ROLES = {"patient", "driver", "dispatcher"}


@router.post("/request-otp")
@limiter.limit("10/minute")
def request_otp(request: Request, body: RequestOtpIn, db: Session = Depends(get_db)):
    if not PHONE_RE.match(body.phone or ""):
        raise HTTPException(status_code=400, detail="A valid +998XXXXXXXXX phone is required")
    otp_service.request_otp(db, body.phone)
    return {"ok": True, "message": "OTP sent"}


@router.post("/verify-otp")
@limiter.limit("10/minute")
def verify_otp(request: Request, body: VerifyOtpIn, db: Session = Depends(get_db)):
    if not PHONE_RE.match(body.phone or "") or not body.code:
        raise HTTPException(status_code=400, detail="phone and code are required")
    if not otp_service.verify_otp(db, body.phone, body.code):
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    role = body.role if body.role in ROLES else "patient"
    user = crud.find_or_create_user(db, body.phone, role, body.full_name)
    token = create_access_token(id=user.id, role=user.role, phone=user.phone)
    return {"token": token, "user": UserOut.model_validate(user).model_dump(mode="json")}
