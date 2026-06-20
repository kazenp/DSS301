from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.drone import DroneModel
from backend.utils.auth import require_any_user, require_dispatcher_or_admin

router = APIRouter()


# ─── Full Drone Response Schema ───────────────────────────────────────────────

class DroneFullResponse(BaseModel):
    drone_id: int
    name: Optional[str] = None
    status: str
    battery: float
    location: Optional[str] = None
    max_payload: Optional[float] = None
    current_payload: Optional[float] = None

    class Config:
        from_attributes = True


def _drone_to_dict(d: DroneModel) -> dict:
    return {
        "drone_id": d.id,
        "name": d.name or f"Drone #{d.id}",
        "status": d.status or "idle",
        "battery": float(d.battery_capacity) if d.battery_capacity is not None else 0.0,
        "location": d.location or "Base",
        "max_payload": float(d.max_payload) if d.max_payload is not None else 5.0,
        "current_payload": float(d.current_payload) if d.current_payload is not None else None,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DroneFullResponse])
async def list_drones(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_any_user),
):
    """Get current status of all drones in the fleet from MySQL."""
    drones = db.query(DroneModel).all()
    return [_drone_to_dict(d) for d in drones]


@router.get("/{drone_id}", response_model=DroneFullResponse)
async def get_drone(
    drone_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_any_user),
):
    """Get detailed status of a specific drone by ID."""
    drone = db.query(DroneModel).filter(DroneModel.id == drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    return _drone_to_dict(drone)


@router.post("/{drone_id}/update-status")
async def update_drone_status(
    drone_id: int,
    status: str,
    battery: float,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_dispatcher_or_admin),
):
    """Update a drone's status in the database. Requires Dispatcher or Admin role."""
    drone = db.query(DroneModel).filter(DroneModel.id == drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")

    drone.status = status
    drone.battery_capacity = battery

    db.commit()
    db.refresh(drone)

    return {
        "message": "Status updated successfully",
        "drone": _drone_to_dict(drone),
    }