from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from app.db.mongo import get_database
from app.core.deps import get_current_user_payload

router = APIRouter(prefix="/merchants", tags=["merchants"])

@router.get("/me")
async def get_merchant_profile(user: dict = Depends(get_current_user_payload)):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    merchant = await db.merchants.find_one({"_id": merchant_id})
    if not merchant:
        merchant = await db.merchants.find_one({"_id": "merchant_sharma_001"})
    
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
        
    merchant["id"] = str(merchant["_id"])
    return merchant

@router.get("/catalogue")
async def get_catalogue(user: dict = Depends(get_current_user_payload)):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    cursor = db.products.find({"merchant_id": merchant_id})
    products = await cursor.to_list(length=100)
    for p in products:
        p["id"] = str(p.get("_id", p["sku"]))
        p["sell_price_rupees"] = round(p["sell_price"] / 100, 2)
        if p.get("cost_price"):
            p["cost_price_rupees"] = round(p["cost_price"] / 100, 2)
        p["is_low_stock"] = p.get("stock_qty", 0) <= p.get("reorder_level", 10)
    return products

