"""Pydantic models for request validation and response serialization.

Inputs accept the frontend's camelCase keys (via aliases); outputs use the
snake_case column names the existing frontend already reads.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# --- Requests ---
class RequestOtpIn(BaseModel):
    phone: str


class VerifyOtpIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    phone: str
    code: str
    role: str | None = None
    full_name: str | None = Field(default=None, alias="fullName")


class CreateCallIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pickup_lat: float = Field(alias="pickupLat")
    pickup_lng: float = Field(alias="pickupLng")
    pickup_address: str | None = Field(default=None, alias="pickupAddress")
    notes: str | None = None


class CallStatusIn(BaseModel):
    status: str


class DriverStatusIn(BaseModel):
    status: str
    lat: float | None = None
    lng: float | None = None


# --- Responses ---
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    role: str
    full_name: str | None = None
    created_at: datetime


class CallOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    ambulance_id: int | None = None
    pickup_lat: float
    pickup_lng: float
    pickup_address: str | None = None
    notes: str | None = None
    status: str
    created_at: datetime
    assigned_at: datetime | None = None
    updated_at: datetime


class AmbulanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    driver_id: int | None = None
    plate_number: str | None = None
    status: str
    lat: float | None = None
    lng: float | None = None
    updated_at: datetime
    created_at: datetime
