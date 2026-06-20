from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from backend.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)  # 'customer', 'dispatcher', 'admin'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
