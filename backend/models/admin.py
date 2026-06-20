from sqlalchemy import Column, Integer, String, Boolean
from backend.database import Base

class AdminStateModel(Base):
    __tablename__ = "admin_state"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(String(255), nullable=False)
