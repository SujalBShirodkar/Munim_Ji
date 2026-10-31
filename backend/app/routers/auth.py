from fastapi import APIRouter, Response, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.db.mongo import get_database
from app.core.security import create_access_token
from app.core.deps import get_current_user_payload

router = APIRouter(prefix="/auth", tags=["auth"])

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: Optional[str] = "merchant"

@router.post("/otp/request")
async def request_otp(body: OTPRequest):
    # Mock OTP is always 123456 in demo/sandbox
    return {
        "success": True,
        "message": "OTP sent successfully (Demo OTP: 123456)",
        "phone": body.phone
    }

@router.post("/otp/verify")
async def verify_otp(body: OTPVerify, response: Response):
    # Allow 123456 as valid demo OTP
    if body.otp not in ["123456", "000000"]:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please enter 123456 for demo.")

    db = get_database()
    merchant = await db.merchants.find_one({"phone": body.phone})
    if not merchant:
        # Default fallback to primary demo merchant
        merchant = await db.merchants.find_one({"_id": "merchant_sharma_001"})

    merchant_id = merchant["_id"] if merchant else "merchant_sharma_001"
    
    token_payload = {
        "sub": merchant_id,
        "phone": body.phone,
        "role": body.role or "merchant"
    }
    token = create_access_token(token_payload)

    # Set httpOnly cookie
    response.set_cookie(
        key="munim_access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7
    )

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "merchant": {
            "id": merchant_id,
            "phone": merchant.get("phone", body.phone),
            "shop_name": merchant.get("shop_name", "Sharma Chai & General Store"),
            "category": merchant.get("category", "Kirana & Tea Stall"),
            "language": merchant.get("language", "hi")
        }
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("munim_access_token")
    return {"success": True, "message": "Logged out successfully"}

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user_payload)):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    merchant = await db.merchants.find_one({"_id": merchant_id})
    if not merchant:
        merchant = await db.merchants.find_one({"_id": "merchant_sharma_001"})
    
    if merchant:
        merchant["id"] = str(merchant["_id"])
        del merchant["_id"]
    return merchant

