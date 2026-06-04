"""/api/v1/data — the shared data endpoint used by BOTH mobile apps.

Items are isolated by the requester's app (from their JWT), so app1 and app2
share the same code/endpoints but never see each other's data.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Item, User
from ..schemas import ItemIn, ItemOut, ItemUpdate
from ..security import get_current_user

router = APIRouter(prefix="/data", tags=["data"])


@router.get("", response_model=list[ItemOut])
def list_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Item)
        .filter(Item.app == user.app)
        .order_by(Item.created_at.desc())
        .all()
    )


@router.post("", response_model=ItemOut, status_code=201)
def create_data(body: ItemIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = Item(owner_id=user.id, app=user.app, title=body.title, content=body.content, done=False)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ItemOut)
def update_data(item_id: int, body: ItemUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(Item, item_id)
    if item is None or item.app != user.app:
        raise HTTPException(status_code=404, detail="Item not found")
    if body.title is not None:
        item.title = body.title
    if body.content is not None:
        item.content = body.content
    if body.done is not None:
        item.done = body.done
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_data(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(Item, item_id)
    if item is None or item.app != user.app:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
