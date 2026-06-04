"""/api/v1/users — profile and (admin-only) user listing, scoped per app."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserOut
from ..security import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def my_profile(user: User = Depends(get_current_user)):
    return user


@router.get("", response_model=list[UserOut])
def list_users(
    admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    # Admins only see users belonging to THEIR OWN app (per-app isolation).
    return db.query(User).filter(User.app == admin.app).order_by(User.id).all()
