import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
import jwt
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

SECRET_KEY = os.getenv("SECRET_KEY", "dss301-secret-key-for-jwt-token-auth-secure-123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    """Hash password using PBKDF2 with SHA-256."""
    salt = secrets.token_bytes(16)
    iterations = 100000
    hash_bytes = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${hash_bytes.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against its PBKDF2 hash."""
    try:
        if not hashed_password:
            return False
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        original_hash = bytes.fromhex(parts[3])
        new_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
        return secrets.compare_digest(original_hash, new_hash)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[dict]:
    """Verify JWT access token and return its payload if valid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# ─── Role-Based Guard Dependencies ───────────────────────────────────────────

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_security = HTTPBearer()

def get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    """Extract and verify JWT payload; raise 401 if invalid."""
    payload = verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_any_user(payload: dict = Depends(get_token_payload)) -> dict:
    """Allow any authenticated user."""
    return payload


def require_dispatcher_or_admin(payload: dict = Depends(get_token_payload)) -> dict:
    """Allow only dispatcher or admin roles."""
    role = payload.get("role", "")
    if role not in ("dispatcher", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Dispatcher or Admin role required.",
        )
    return payload


def require_admin(payload: dict = Depends(get_token_payload)) -> dict:
    """Allow only admin role."""
    role = payload.get("role", "")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required.",
        )
    return payload
