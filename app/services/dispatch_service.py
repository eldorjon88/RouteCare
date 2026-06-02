"""Dispatch logic (replaces services/dispatchService.js).

find_nearest_ambulance uses the haversine formula in SQL (distance in km). For
higher volumes, switch lat/lng to a PostGIS geography column with a GiST index
and order by KNN (<->).
"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..models import Ambulance

_NEAREST_SQL = text(
    """
    SELECT a.id, a.driver_id, a.plate_number, a.lat, a.lng,
           (6371 * acos(least(1, greatest(-1,
               cos(radians(:lat)) * cos(radians(a.lat)) *
               cos(radians(a.lng) - radians(:lng)) +
               sin(radians(:lat)) * sin(radians(a.lat))
           )))) AS distance_km
      FROM ambulances a
     WHERE a.status = 'available' AND a.lat IS NOT NULL AND a.lng IS NOT NULL
     ORDER BY distance_km ASC
     LIMIT 1
    """
)


def find_nearest_ambulance(db: Session, lat: float, lng: float) -> dict | None:
    row = db.execute(_NEAREST_SQL, {"lat": lat, "lng": lng}).fetchone()
    return dict(row._mapping) if row else None


def set_ambulance_status(db: Session, ambulance_id: int, status: str) -> None:
    amb = db.get(Ambulance, ambulance_id)
    if amb:
        amb.status = status
        db.commit()
