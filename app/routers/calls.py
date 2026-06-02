"""Call / dispatch routes (replaces routes/calls.js)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import CallOut, CallStatusIn, CreateCallIn
from ..security import require_roles
from ..services import dispatch_service
from ..websocket import manager

router = APIRouter(prefix="/api/calls", tags=["calls"])

ALLOWED_STATUS = {"assigned", "en_route", "arrived", "transporting", "completed", "cancelled"}


def _call_dict(call) -> dict:
    """Serialize a Call ORM object to a JSON-safe dict for WebSocket broadcasts."""
    return CallOut.model_validate(call).model_dump(mode="json")


@router.post("", response_model=CallOut, status_code=201)
async def create_call(
    body: CreateCallIn,
    user: dict = Depends(require_roles("patient")),
    db: Session = Depends(get_db),
):
    call = crud.create_call(
        db,
        patient_id=user["id"],
        pickup_lat=body.pickup_lat,
        pickup_lng=body.pickup_lng,
        pickup_address=body.pickup_address,
        notes=body.notes,
    )
    await manager.broadcast("call:new", _call_dict(call))  # notify dispatch dashboards
    return call


@router.get("", response_model=list[CallOut])
async def list_calls(
    status: str | None = Query(default=None),
    user: dict = Depends(require_roles("dispatcher")),
    db: Session = Depends(get_db),
):
    return crud.list_calls(db, status=status)


@router.post("/{call_id}/auto-assign")
async def auto_assign(
    call_id: int,
    user: dict = Depends(require_roles("dispatcher")),
    db: Session = Depends(get_db),
):
    call = crud.get_call(db, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    ambulance = dispatch_service.find_nearest_ambulance(db, call.pickup_lat, call.pickup_lng)
    if not ambulance:
        raise HTTPException(status_code=409, detail="No available ambulance")

    updated = crud.assign_call(db, call.id, ambulance["id"])
    dispatch_service.set_ambulance_status(db, ambulance["id"], "on_call")

    await manager.send_to_room(f"call:{call.id}", "call:status", _call_dict(updated))
    await manager.broadcast("call:assigned", {"call": _call_dict(updated), "ambulance": ambulance})
    return {"call": _call_dict(updated), "ambulance": ambulance}


@router.patch("/{call_id}/status", response_model=CallOut)
async def update_status(
    call_id: int,
    body: CallStatusIn,
    user: dict = Depends(require_roles("driver", "dispatcher")),
    db: Session = Depends(get_db),
):
    if body.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")
    updated = crud.update_call_status(db, call_id, body.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Call not found")

    await manager.send_to_room(f"call:{call_id}", "call:status", _call_dict(updated))
    return updated
