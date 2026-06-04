"""OTP generation and verification (replaces services/otpService.js).

Codes are stored hashed (bcrypt), never in plaintext. In development the code is
printed to the server console instead of being sent by SMS.
"""
import datetime as dt
import random

import bcrypt
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import OTP_PROVIDER
from ..models import OtpCode

OTP_TTL_MINUTES = 5


def _generate_code() -> str:
    return f"{random.randint(100000, 999999)}"  # 6 digits


def request_otp(db: Session, phone: str) -> bool:
    code = _generate_code()
    code_hash = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
    expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=OTP_TTL_MINUTES)

    db.add(OtpCode(phone=phone, code_hash=code_hash, expires_at=expires_at))
    db.commit()

    # TODO: integrate a real SMS provider (e.g. Eskiz / Play Mobile for Uzbekistan).
    if (OTP_PROVIDER or "console") == "console":
        print(f"[OTP] {phone} -> {code} (valid {OTP_TTL_MINUTES}m)")
    return True


def verify_otp(db: Session, phone: str, code: str) -> bool:
    record = (
        db.query(OtpCode)
        .filter(
            OtpCode.phone == phone,
            OtpCode.expires_at > func.now(),
            OtpCode.consumed_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if record is None:
        return False
    if not bcrypt.checkpw(code.encode(), record.code_hash.encode()):
        return False

    record.consumed_at = func.now()
    db.commit()
    return True
