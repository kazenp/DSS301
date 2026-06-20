from sqlalchemy import Column, Integer, String, Float
from backend.database import Base

class DroneModel(Base):
    __tablename__ = "drones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True)
    status = Column(String(20), default="idle")
    battery_capacity = Column(Integer)
    # Extended fields for full fleet monitoring
    location = Column(String(100), nullable=True, default="Base")
    max_payload = Column(Float, nullable=True, default=5.0)
    current_payload = Column(Float, nullable=True, default=None)