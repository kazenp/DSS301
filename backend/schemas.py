from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TelemetryInput(BaseModel):
    wind_speed: float = Field(..., description="Wind speed in m/s")
    battery_remaining: float = Field(..., description="Battery remaining percentage (0-100)")
    actual_carry_weight: float = Field(..., description="Payload weight in kg")
    payload_type: str = Field(..., description="Type of payload (e.g., medical, food, standard)")
    altitude: float = Field(..., description="Flight altitude in meters")
    distance_flown: float = Field(..., description="Flight distance in km")
    gps_accuracy: float = Field(..., description="GPS accuracy score (lower is better or standard indicator)")
    obstacles_encountered: int = Field(..., description="Number of obstacles encountered")

class OrderCreate(BaseModel):
    client_name: str
    destination: str
    weight: float
    payload_type: str
    distance: float
    status: Optional[str] = "pending"
    risk_score: Optional[float] = None
    dss_decision: Optional[str] = None
    reason: Optional[str] = None
    assigned_drone_id: Optional[int] = None
    eta_minutes: Optional[int] = None
    timeline: Optional[List[Dict[str, Any]]] = None

class OrderResponse(BaseModel):
    id: int
    client_name: str
    destination: str
    weight: float
    payload_type: str
    distance: float
    status: str  # pending, approved, rejected, delivering, completed
    created_at: datetime
    risk_score: Optional[float] = None
    dss_decision: Optional[str] = None
    reason: Optional[str] = None
    assigned_drone_id: Optional[int] = None
    eta_minutes: Optional[int] = None
    timeline: Optional[List[Dict[str, Any]]] = None

class OrderUpdate(BaseModel):
    status: str
    risk_score: Optional[float] = None
    dss_decision: Optional[str] = None
    reason: Optional[str] = None
    assigned_drone_id: Optional[int] = None
    eta_minutes: Optional[int] = None
    timeline: Optional[List[Dict[str, Any]]] = None


class DroneStatus(BaseModel):
    drone_id: int
    status: str  # idle, busy, charging, maintenance
    battery: float
    current_payload: Optional[float] = None

class PredictionRequest(BaseModel):
    telemetry: TelemetryInput
    model_type: Optional[str] = "logistic"  # logistic or random_forest

class PredictionResponse(BaseModel):
    model_used: str
    success_probability: float
    risk_score: float
    prediction: int  # 1 for success/completed, 0 for failed/non-completed

class DSSDecisionRequest(BaseModel):
    telemetry: TelemetryInput
    busy_day: bool = False
    model_type: Optional[str] = "logistic"

class DSSDecisionResponse(BaseModel):
    prediction: PredictionResponse
    dss_approved: bool
    final_status: str
    decision_reason: str
