from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Global admin state
class AdminState:
    def __init__(self):
        self.busy_day = False
        self.system_status = "active"

admin_state = AdminState()

class StateUpdate(BaseModel):
    busy_day: bool
    system_status: str

@router.get("/status")
async def get_admin_status():
    """
    Get the active admin operating status (busy day mode, system operations).
    """
    return {
        "busy_day": admin_state.busy_day,
        "system_status": admin_state.system_status
    }

@router.post("/status")
async def update_admin_status(update: StateUpdate):
    """
    Update global operational status settings.
    """
    admin_state.busy_day = update.busy_day
    admin_state.system_status = update.system_status
    return {
        "message": "Global system configurations updated.",
        "busy_day": admin_state.busy_day,
        "system_status": admin_state.system_status
    }
