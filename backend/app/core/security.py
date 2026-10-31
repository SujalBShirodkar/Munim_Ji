import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt
from app.core.config import settings

def get_password_hash(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Generates a salted SHA-256 password hash and returns (hash, salt)."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt

def verify_password(plain_password: str, password_hash: str, salt: str) -> bool:
    """Verifies a plain password against stored hash and salt."""
    expected_hash, _ = get_password_hash(plain_password, salt)
    return secrets.compare_digest(expected_hash, password_hash)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None
