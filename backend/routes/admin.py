from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.admin import AdminStateModel
from backend.utils.auth import require_admin, require_any_user

router = APIRouter()


class StateUpdate(BaseModel):
    busy_day: bool
    system_status: str


def _get_setting(db: Session, key: str, default: str) -> str:
    """Read a setting from admin_state table, returning default if missing."""
    row = db.query(AdminStateModel).filter(AdminStateModel.key == key).first()
    return row.value if row else default


def _set_setting(db: Session, key: str, value: str) -> None:
    """Upsert a setting in admin_state table."""
    row = db.query(AdminStateModel).filter(AdminStateModel.key == key).first()
    if row:
        row.value = value
    else:
        row = AdminStateModel(key=key, value=value)
        db.add(row)
    db.commit()


@router.get("/status")
async def get_admin_status(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_any_user),
):
    """Get the active admin operating status. Requires login."""
    busy_day = _get_setting(db, "busy_day", "false") == "true"
    system_status = _get_setting(db, "system_status", "active")
    return {"busy_day": busy_day, "system_status": system_status}


@router.post("/status")
async def update_admin_status(
    update: StateUpdate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_admin),
):
    """Update global operational status. Requires Admin role."""
    _set_setting(db, "busy_day", "true" if update.busy_day else "false")
    _set_setting(db, "system_status", update.system_status)
    return {
        "message": "Global system configurations updated.",
        "busy_day": update.busy_day,
        "system_status": update.system_status,
    }
