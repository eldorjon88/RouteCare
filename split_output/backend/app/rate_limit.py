"""Rate limiter (replaces express-rate-limit).

A generous default limit is applied app-wide; auth routes add a stricter limit
to deter OTP/SMS abuse.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
