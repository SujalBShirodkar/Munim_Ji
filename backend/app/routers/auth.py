import re
from datetime import datetime, timezone
from fastapi import APIRouter, Response, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.db.mongo import get_database
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.deps import get_current_user_payload

router = APIRouter(prefix="/auth", tags=["auth"])

def normalize_phone(raw: str) -> str:
    """Normalizes phone number to standard +91XXXXXXXXXX format."""
    digits = "".join(filter(str.isdigit, raw))
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    elif digits:
        return f"+{digits}"
    return raw.strip()

class RegisterRequest(BaseModel):
    name: str
    shop_name: str
    phone: str
    password: str
    category: Optional[str] = "Kirana & General Store"
    pincode: Optional[str] = "400069"
    language: Optional[str] = "hi"

class PasswordLoginRequest(BaseModel):
    phone: str
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: Optional[str] = "merchant"

@router.post("/register")
async def register_merchant(body: RegisterRequest, response: Response):
    """Registers a new merchant persistently in MongoDB Atlas."""
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Merchant name is required")
    if not body.shop_name.strip():
        raise HTTPException(status_code=400, detail="Shop name is required")
    if len(body.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    clean_phone = normalize_phone(body.phone)
    phone_digits = "".join(filter(str.isdigit, clean_phone))
    if len(phone_digits) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")

    db = get_database()
    
    # Check if merchant already exists
    existing = await db.merchants.find_one({
        "$or": [
            {"phone": clean_phone},
            {"phone": body.phone.strip()}
        ]
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A merchant with this mobile number already exists. Please login."
        )

    # Hash password
    pwd_hash, salt = get_password_hash(body.password.strip())
    merchant_id = f"merchant_{phone_digits[-10:]}"

    now = datetime.now(timezone.utc)
    merchant_doc = {
        "_id": merchant_id,
        "name": body.name.strip(),
        "owner_name": body.name.strip(),
        "shop_name": body.shop_name.strip(),
        "phone": clean_phone,
        "password_hash": pwd_hash,
        "salt": salt,
        "category": body.category or "Kirana & General Store",
        "pincode": body.pincode or "400069",
        "language": body.language or "hi",
        "location": {
            "type": "Point",
            "coordinates": [72.8697, 19.1136]  # Mumbai Andheri East default
        },
        "kyc_status": "verified",
        "source": "registered",
        "created_at": now
    }

    # Save to MongoDB Atlas
    await db.merchants.insert_one(merchant_doc)

    # Initialize starter inventory catalogue for the new merchant
    default_products = [
        {
            "sku": f"SKU-{merchant_id}-SUGAR",
            "merchant_id": merchant_id,
            "name": "Madhur Pure Sugar (50kg Bag)",
            "category": "Grains & Staples",
            "unit": "bag",
            "cost_price": 205000,
            "sell_price": 220000,
            "stock_qty": 6.0,
            "reorder_level": 10.0,
            "daily_avg_sales": 2.5
        },
        {
            "sku": f"SKU-{merchant_id}-TEA",
            "merchant_id": merchant_id,
            "name": "Wagh Bakri CTC Tea (1kg)",
            "category": "Beverages",
            "unit": "packet",
            "cost_price": 44000,
            "sell_price": 50000,
            "stock_qty": 4.0,
            "reorder_level": 8.0,
            "daily_avg_sales": 3.0
        },
        {
            "sku": f"SKU-{merchant_id}-OIL",
            "merchant_id": merchant_id,
            "name": "Fortune Sunflower Oil (15L Tin)",
            "category": "Edible Oils",
            "unit": "tin",
            "cost_price": 185000,
            "sell_price": 198000,
            "stock_qty": 5.0,
            "reorder_level": 5.0,
            "daily_avg_sales": 1.2
        },
        {
            "sku": f"SKU-{merchant_id}-ATTA",
            "merchant_id": merchant_id,
            "name": "Aashirvaad Sharbati Atta (10kg)",
            "category": "Grains & Staples",
            "unit": "bag",
            "cost_price": 38000,
            "sell_price": 42000,
            "stock_qty": 12.0,
            "reorder_level": 8.0,
            "daily_avg_sales": 4.0
        }
    ]
    await db.products.insert_many(default_products)

    # Initialize Instant Credit line for working capital
    credit_doc = {
        "merchant_id": merchant_id,
        "pre_approved_limit": 500000,
        "outstanding": 0,
        "repayment_rate": 0.20,
        "status": "APPROVED",
        "created_at": now
    }
    await db.credit_accounts.insert_one(credit_doc)

    # Create token & set cookie
    token_payload = {
        "sub": merchant_id,
        "phone": clean_phone,
        "role": "merchant"
    }
    token = create_access_token(token_payload)

    response.set_cookie(
        key="munim_access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7
    )

    return {
        "success": True,
        "message": f"Welcome to Munim Ji, {merchant_doc['name']}!",
        "access_token": token,
        "token_type": "bearer",
        "merchant": {
            "id": merchant_id,
            "name": merchant_doc["name"],
            "shop_name": merchant_doc["shop_name"],
            "phone": clean_phone,
            "category": merchant_doc["category"],
            "language": merchant_doc["language"]
        }
    }

@router.post("/login")
async def login_with_password(body: PasswordLoginRequest, response: Response):
    """Authenticates merchant via Mobile Number and Password."""
    clean_phone = normalize_phone(body.phone)
    raw_phone = body.phone.strip()
    digits = "".join(filter(str.isdigit, clean_phone))

    db = get_database()
    merchant = await db.merchants.find_one({
        "$or": [
            {"phone": clean_phone},
            {"phone": raw_phone},
            {"_id": f"merchant_{digits[-10:]}" if len(digits) >= 10 else "invalid"},
            {"_id": "merchant_sharma_001"} if clean_phone.endswith("9876543210") else {"_id": None}
        ]
    })

    if not merchant:
        raise HTTPException(
            status_code=401,
            detail="Merchant not found with this mobile number. Please register first."
        )

    # Password check
    valid = False
    if "password_hash" in merchant and "salt" in merchant:
        valid = verify_password(body.password, merchant["password_hash"], merchant["salt"])
    elif merchant.get("_id") == "merchant_sharma_001":
        # Legacy demo merchant allows password 'demo123' or '123456'
        valid = body.password.strip() in ["demo123", "123456", "admin", "password"]

    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please verify and try again."
        )

    merchant_id = merchant["_id"]
    token_payload = {
        "sub": merchant_id,
        "phone": merchant.get("phone", clean_phone),
        "role": "merchant"
    }
    token = create_access_token(token_payload)

    response.set_cookie(
        key="munim_access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=86400 * 7
    )

    return {
        "success": True,
        "message": f"Welcome back, {merchant.get('name', merchant.get('owner_name', 'Sharma ji'))}!",
        "access_token": token,
        "token_type": "bearer",
        "merchant": {
            "id": merchant_id,
            "name": merchant.get("name", merchant.get("owner_name", "")),
            "phone": merchant.get("phone", clean_phone),
            "shop_name": merchant.get("shop_name", "Aapki Dukaan"),
            "category": merchant.get("category", "Kirana & General"),
            "language": merchant.get("language", "hi")
        }
    }

@router.post("/otp/request")
async def request_otp(body: OTPRequest):
    return {
        "success": True,
        "message": "OTP sent successfully (Demo OTP: 123456)",
        "phone": body.phone
    }

@router.post("/otp/verify")
async def verify_otp(body: OTPVerify, response: Response):
    if body.otp not in ["123456", "000000"]:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please enter 123456 for demo.")

    clean_phone = normalize_phone(body.phone)
    db = get_database()
    merchant = await db.merchants.find_one({
        "$or": [
            {"phone": clean_phone},
            {"phone": body.phone}
        ]
    })
    if not merchant:
        merchant = await db.merchants.find_one({"_id": "merchant_sharma_001"})

    merchant_id = merchant["_id"] if merchant else "merchant_sharma_001"
    
    token_payload = {
        "sub": merchant_id,
        "phone": body.phone,
        "role": body.role or "merchant"
    }
    token = create_access_token(token_payload)

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
            "name": merchant.get("name", merchant.get("owner_name", "Sharma ji")),
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
        # Remove password hash and salt for security
        merchant.pop("password_hash", None)
        merchant.pop("salt", None)
        del merchant["_id"]
    return merchant
