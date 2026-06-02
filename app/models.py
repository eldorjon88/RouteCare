"""SQLAlchemy ORM models mapping the existing PostgreSQL tables.

The schema is defined canonically in database/schema.sql (preserved unchanged);
these models map onto those exact tables for type-safe access.
"""
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    phone = Column(String, unique=True, nullable=False)  # E.164, e.g. +998901234567
    role = Column(String, nullable=False, server_default="patient")
    full_name = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('patient','driver','dispatcher')", name="users_role_check"),
    )


class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True)
    driver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    plate_number = Column(String)
    status = Column(String, nullable=False, server_default="off_duty")
    lat = Column(Float)
    lng = Column(Float)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('available','on_call','off_duty')", name="ambulances_status_check"
        ),
    )


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id", ondelete="SET NULL"))
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    pickup_address = Column(Text)
    notes = Column(Text)
    status = Column(String, nullable=False, server_default="requested")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    assigned_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('requested','assigned','en_route','arrived','transporting','completed','cancelled')",
            name="calls_status_check",
        ),
    )


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True)
    phone = Column(String, nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
