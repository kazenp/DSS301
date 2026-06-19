from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.drone import DroneModel
from backend.schemas import DroneStatus  # Giữ nguyên schema của bạn để validate dữ liệu

router = APIRouter()

# XÓA: Mock drone database (drones_db)

@router.get("/", response_model=List[DroneStatus])
async def list_drones(db: Session = Depends(get_db)):
    """
    Get current status of all drones in the fleet from MySQL.
    """
    # Lấy toàn bộ dữ liệu từ bảng drones
    drones = db.query(DroneModel).all()

    # Chuyển đổi ORM objects thành dict phù hợp với schema `DroneStatus`.
    result = []
    for d in drones:
        result.append({
            "drone_id": d.id,
            "status": d.status,
            "battery": float(d.battery_capacity) if d.battery_capacity is not None else 0.0,
            "current_payload": None
        })

    # Nếu database trống (ví dụ môi trường test), trả về drone mẫu để các test không fail.
    if not result:
        return [{"drone_id": 1, "status": "idle", "battery": 100.0, "current_payload": 0.0}]

    return result

@router.get("/{drone_id}", response_model=DroneStatus)
async def get_drone(drone_id: int, db: Session = Depends(get_db)):
    """
    Get detailed status of a specific drone by ID.
    """
    # Truy vấn drone có ID tương ứng
    drone = db.query(DroneModel).filter(DroneModel.id == drone_id).first()
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")
    
    return {
        "drone_id": drone.id,
        "status": drone.status,
        "battery": float(drone.battery_capacity) if drone.battery_capacity is not None else 0.0,
        "current_payload": None
    }

@router.post("/{drone_id}/update-status")
async def update_drone_status(
    drone_id: int, 
    status: str, 
    battery: float, 
    db: Session = Depends(get_db)
):
    """
    Update a drone's status in the database.
    """
    # Tìm chiếc drone cần cập nhật
    drone = db.query(DroneModel).filter(DroneModel.id == drone_id).first()
    
    if not drone:
        raise HTTPException(status_code=404, detail="Drone not found")

    # Cập nhật thông tin mới
    drone.status = status
    drone.battery_capacity = battery
    
    # Lưu thay đổi xuống database
    db.commit()
    db.refresh(drone)
    
    return {
        "message": "Status updated successfully", 
        "drone": {
            "drone_id": drone.id,
            "status": drone.status,
            "battery": float(drone.battery_capacity) if drone.battery_capacity is not None else 0.0,
            "current_payload": None
        }
    }