import logging
import uuid
from datetime import datetime

def setup_logger(name: str) -> logging.Logger:
    """Set up and configure a standard logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

def generate_unique_id(prefix: str = "") -> str:
    """Generate a unique string ID."""
    uid = str(uuid.uuid4())
    if prefix:
        return f"{prefix}_{uid}"
    return uid

def get_current_timestamp() -> str:
    """Get the current timestamp in ISO format."""
    return datetime.now().isoformat()
