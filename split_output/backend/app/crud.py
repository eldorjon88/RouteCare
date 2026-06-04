"""SQLAlchemy data access (replaces backend/models/*.js)."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Ambulance, Call, User


# --- Users ---
def get_user_by_phone(db: Session, phone: str) -> User | None:
    return db.query(User).filter(User.phone == phone).first()


def create_user(db: Session, phone: str, role: str, full_name: str | None = None) -> User:
    user = User(phone=phone, role=role, full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def find_or_create_user(
    db: Session, phone: str, role: str, full_name: str | None = None
) -> User:
    return get_user_by_phone(db, phone) or create_user(db, phone, role, full_name)


# --- Calls ---
def create_call(
    db: Session,
    *,
    patient_id: int,
    pickup_lat: float,
    pickup_lng: float,
    pickup_address: str | None = None,
    notes: str | None = None,
) -> Call:
    call = Call(
        patient_id=patient_id,
        pickup_lat=pickup_lat,
        pickup_lng=pickup_lng,
        pickup_address=pickup_address,
        notes=notes,
        status="requested",
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call


def get_call(db: Session, call_id: int) -> Call | None:
    return db.get(Call, call_id)


def list_calls(db: Session, status: str | None = None) -> list[Call]:
    query = db.query(Call)
    if status:
        query = query.filter(Call.status == status)
    return query.order_by(Call.created_at.desc()).all()


def assign_call(db: Session, call_id: int, ambulance_id: int) -> Call | None:
    call = db.get(Call, call_id)
    if not call:
        return None
    call.ambulance_id = ambulance_id
    call.status = "assigned"
    call.assigned_at = func.now()
    call.updated_at = func.now()
    db.commit()
    db.refresh(call)
    return call


def update_call_status(db: Session, call_id: int, status: str) -> Call | None:
    call = db.get(Call, call_id)
    if not call:
        return None
    call.status = status
    call.updated_at = func.now()
    db.commit()
    db.refresh(call)
    return call


# --- Ambulances ---
def update_driver_ambulance(
    db: Session, driver_id: int, status: str, lat: float | None = None, lng: float | None = None
) -> Ambulance | None:
    amb = db.query(Ambulance).filter(Ambulance.driver_id == driver_id).first()
    if not amb:
        return None
    amb.status = status
    if lat is not None:
        amb.lat = lat
    if lng is not None:
        amb.lng = lng
    amb.updated_at = func.now()
    db.commit()
    db.refresh(amb)
    return amb


def list_ambulances(db: Session) -> list[Ambulance]:
    return db.query(Ambulance).order_by(Ambulance.status, Ambulance.id).all()
