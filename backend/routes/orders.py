from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.order import OrderModel
from backend.schemas import OrderCreate, OrderResponse, OrderUpdate
from backend.utils.auth import require_any_user, require_dispatcher_or_admin

router = APIRouter()


@router.post("/", response_model=OrderResponse)
async def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_any_user),
):
    """Create a new delivery request and save to MySQL. Requires login."""
    init_timeline = order.timeline
    if not init_timeline:
        init_timeline = [{"label": "Request created", "at": datetime.utcnow().isoformat() + "Z"}]

    new_order = OrderModel(
        client_name=order.client_name,
        destination=order.destination,
        weight=order.weight,
        payload_type=order.payload_type,
        distance=order.distance,
        status=order.status or "pending",
        risk_score=order.risk_score,
        dss_decision=order.dss_decision,
        reason=order.reason,
        assigned_drone_id=order.assigned_drone_id,
        eta_minutes=order.eta_minutes,
        timeline=init_timeline,
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order


@router.post("/{order_id}/update-status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    update: OrderUpdate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_dispatcher_or_admin),
):
    """Update order status. Requires Dispatcher or Admin role."""
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = update.status
    if update.risk_score is not None:
        order.risk_score = update.risk_score
    if update.dss_decision is not None:
        order.dss_decision = update.dss_decision
    if update.reason is not None:
        order.reason = update.reason
    if update.assigned_drone_id is not None:
        order.assigned_drone_id = update.assigned_drone_id
    if update.eta_minutes is not None:
        order.eta_minutes = update.eta_minutes
    if update.timeline is not None:
        order.timeline = update.timeline

    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_any_user),
):
    """Retrieve all orders from MySQL. Requires login."""
    return db.query(OrderModel).all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_any_user),
):
    """Get details of a specific order. Requires login."""
    order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order