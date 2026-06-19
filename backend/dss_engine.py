import logging
from typing import Dict, Any
from backend.config import settings

logger = logging.getLogger(__name__)

class DSSEngine:
    def __init__(self):
        # We can dynamically configure DSS rules here
        pass

    def evaluate_decision(self, ml_prediction: Dict[str, Any], telemetry: Dict[str, Any], busy_day: bool = False) -> Dict[str, Any]:
        """
        Evaluate flight decision using ML prediction outputs and business rules.
        
        Rules:
        1. Hard constraint: If wind speed > settings.MAX_WIND_SPEED_MPS -> REJECT
        2. Hard constraint: If battery remaining < settings.MIN_BATTERY_PERCENT -> REJECT
        3. Hard constraint: If actual carry weight > settings.MAX_PAYLOAD_KG -> REJECT
        4. ML constraint: If prediction success_probability < 0.6 -> REJECT
        5. Business constraint (Busy Day): 
           If busy_day is True, we apply stricter criteria.
           - Stricter battery limit (must be > 30% instead of 20%)
           - Stricter probability threshold (must be > 0.75 instead of 0.6)
        """
        wind_speed = telemetry.get("wind_speed", 0.0)
        battery = telemetry.get("battery_remaining", 100.0)
        weight = telemetry.get("actual_carry_weight", 0.0)
        
        prob = ml_prediction.get("success_probability", 0.0)
        
        dss_approved = True
        reason = "Order approved for drone dispatch."
        
        # 1. Weather check
        if wind_speed > settings.MAX_WIND_SPEED_MPS:
            dss_approved = False
            reason = f"Rejected: Wind speed ({wind_speed} m/s) exceeds maximum allowed limit ({settings.MAX_WIND_SPEED_MPS} m/s)."
        
        # 2. Battery check
        elif busy_day and battery < 30.0:
            dss_approved = False
            reason = f"Rejected: Battery ({battery}%) is too low for a busy day (minimum 30% required)."
        elif battery < settings.MIN_BATTERY_PERCENT:
            dss_approved = False
            reason = f"Rejected: Battery ({battery}%) is below safety limit ({settings.MIN_BATTERY_PERCENT}%)."
            
        # 3. Payload check
        elif weight > settings.MAX_PAYLOAD_KG:
            dss_approved = False
            reason = f"Rejected: Payload weight ({weight} kg) exceeds drone capacity ({settings.MAX_PAYLOAD_KG} kg)."
            
        # 4. ML uncertainty check
        elif busy_day and prob < 0.75:
            dss_approved = False
            reason = f"Rejected: ML success probability ({prob:.2f}) is too low for operation during busy day peak hours (minimum 0.75 required)."
        elif prob < 0.60:
            dss_approved = False
            reason = f"Rejected: ML predicts high risk of flight failure. Success probability is {prob:.2f}."
            
        return {
            "dss_approved": dss_approved,
            "final_status": "APPROVED" if dss_approved else "REJECTED",
            "decision_reason": reason
        }

# Singleton instance
dss_engine = DSSEngine()
