from fastapi import APIRouter, Depends, Query
from typing import Optional, List, Dict, Any
from app.db.mongo import get_database
from app.core.deps import get_current_user_payload
from app.services.analytics.summary import (
    get_sales_summary,
    get_hourly_sales,
    get_settlements,
    get_pending_settlement,
    compare_periods
)
from app.services.analytics.inventory import get_inventory_status

router = APIRouter(tags=["transactions & analytics"])

@router.get("/transactions")
async def list_transactions(
    limit: int = Query(50, le=200),
    user: dict = Depends(get_current_user_payload)
):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    cursor = db.transactions.find({"merchant_id": merchant_id}).sort("created_at", -1).limit(limit)
    txns = await cursor.to_list(length=limit)
    for t in txns:
        t["id"] = str(t.get("_id", t.get("paytm_order_id")))
        t["amount_rupees"] = round(t["amount"] / 100, 2)
    return txns

@router.get("/analytics/summary")
async def sales_summary(
    period: str = Query("today"),
    user: dict = Depends(get_current_user_payload)
):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await get_sales_summary(merchant_id, period)

@router.get("/analytics/hourly")
async def hourly_sales(
    date: str = Query("today"),
    user: dict = Depends(get_current_user_payload)
):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await get_hourly_sales(merchant_id, date)

@router.get("/analytics/inventory")
async def inventory_status(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await get_inventory_status(merchant_id)

@router.get("/analytics/settlements")
async def settlements(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return {
        "pending": await get_pending_settlement(merchant_id),
        "history": await get_settlements(merchant_id, "last_7d")
    }

@router.get("/analytics/compare")
async def compare(
    period_a: str = Query("today"),
    period_b: str = Query("yesterday"),
    user: dict = Depends(get_current_user_payload)
):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await compare_periods(merchant_id, period_a, period_b)
