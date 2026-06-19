import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas import OrderCreate, OrderResponse

router = APIRouter()

# Mock database
orders_db = []

@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate):
    """
    Create a new delivery request (Client-side).
    """
    new_order = {
        "id": str(uuid.uuid4()),
        "client_name": order.client_name,
        "destination": order.destination,
        "weight": order.weight,
        "payload_type": order.payload_type,
        "distance": order.distance,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "risk_score": None,
        "dss_decision": None,
        "reason": None
    }
    orders_db.append(new_order)
    return new_order

@router.get("/", response_model=List[OrderResponse])
async def list_orders():
    """
    Retrieve all orders (Admin-side).
    """
    return orders_db

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    """
    Get details of a specific order.
    """
    for order in orders_db:
        if order["id"] == order_id:
            return order
    raise HTTPException(status_code=404, detail="Order not found")
