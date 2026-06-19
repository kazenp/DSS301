from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from backend.database import Base

class OrderModel(Base):
    __tablename__ = "orders"

    # Sử dụng Integer tự tăng thay vì UUID để tối ưu truy vấn SQL
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(100))
    destination = Column(String(255))
    weight = Column(Float)
    payload_type = Column(String(50))
    distance = Column(Float)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, nullable=True)
    dss_decision = Column(String(50), nullable=True)
    reason = Column(String(255), nullable=True)
    assigned_drone_id = Column(Integer, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    timeline = Column(JSON, nullable=True)