"""Driver / ambulance routes (replaces routes/drivers.js)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import AmbulanceOut, DriverStatusIn
from ..security import require_roles

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

ALLOWED_STATUS = {"available", "on_call", "off_duty"}


@router.patch("/me/status", response_model=AmbulanceOut)
def set_my_status(
    body: DriverStatusIn,
    user: dict = Depends(require_roles("driver")),
    db: Session = Depends(get_db),
):
    if body.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")
    amb = crud.update_driver_ambulance(db, user["id"], body.status, body.lat, body.lng)
    if not amb:
        raise HTTPException(status_code=404, detail="No ambulance is linked to this driver")
    return amb


@router.get("", response_model=list[AmbulanceOut])
def list_ambulances(
    user: dict = Depends(require_roles("dispatcher")),
    db: Session = Depends(get_db),
):
    return crud.list_ambulances(db)
