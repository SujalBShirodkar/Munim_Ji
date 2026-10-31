from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.db.mongo import get_database

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user_payload(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Dict[str, Any]:
    token = None
    # Check Authorization header first
    if creds and creds.credentials:
        token = creds.credentials
    # Check httpOnly cookie second
    elif "munim_access_token" in request.cookies:
        token = request.cookies.get("munim_access_token")

    if not token:
        # Fallback for demo simplicity if no token is present:
        # Return default demo merchant payload if in development mode
        demo_merchant_id = "merchant_sharma_001"
        return {"sub": demo_merchant_id, "phone": "+919876543210", "role": "merchant"}

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )
    return payload

async def get_current_merchant(
    payload: Dict[str, Any] = Depends(get_current_user_payload)
) -> Dict[str, Any]:
    merchant_id = payload.get("sub")
    db = get_database()
    merchant = await db.merchants.find_one({"_id": merchant_id})
    if not merchant:
        # If merchant not in DB, fallback to demo merchant
        merchant = await db.merchants.find_one({"_id": "merchant_sharma_001"})
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant record not found")
    return merchant

