from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas import DroneStatus

router = APIRouter()

# Mock drone database
drones_db = [
    {"drone_id": "drone_01", "status": "idle", "battery": 95.0, "current_payload": None},
    {"drone_id": "drone_02", "status": "busy", "battery": 62.0, "current_payload": 2.5},
    {"drone_id": "drone_03", "status": "charging", "battery": 15.0, "current_payload": None},
    {"drone_id": "drone_04", "status": "idle", "battery": 88.0, "current_payload": None},
    {"drone_id": "drone_05", "status": "maintenance", "battery": 50.0, "current_payload": None}
]

@router.get("/", response_model=List[DroneStatus])
async def list_drones():
    """
    Get current status of all drones in the fleet.
    """
    return drones_db

@router.get("/{drone_id}", response_model=DroneStatus)
async def get_drone(drone_id: str):
    """
    Get detailed status of a specific drone.
    """
    for drone in drones_db:
        if drone["drone_id"] == drone_id:
            return drone
    raise HTTPException(status_code=404, detail="Drone not found")

@router.post("/{drone_id}/update-status")
async def update_drone_status(drone_id: str, status: str, battery: float, current_payload: float = None):
    """
    Update a drone's status.
    """
    for drone in drones_db:
        if drone["drone_id"] == drone_id:
            drone["status"] = status
            drone["battery"] = battery
            drone["current_payload"] = current_payload
            return {"message": "Status updated successfully", "drone": drone}
    raise HTTPException(status_code=404, detail="Drone not found")
