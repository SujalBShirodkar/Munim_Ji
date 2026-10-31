from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.db.mongo import get_database
from app.services.pooling.state_machine import transition_group_order_state

router = APIRouter(prefix="/supplier", tags=["supplier"])

class QuoteCreateRequest(BaseModel):
    sku: str
    product_name: str
    unit: str = "bag"
    tiers: List[Dict[str, Any]]
    delivery_fee: int
    moq: float
    valid_days: int = 7
    serviceable_pincodes: List[str] = ["400069", "400059"]

@router.get("/quotes")
async def list_quotes():
    db = get_database()
    cursor = db.supplier_quotes.find().sort("created_at", -1)
    quotes = await cursor.to_list(length=50)
    for q in quotes:
        q["id"] = str(q["_id"])
    return quotes

@router.post("/quotes")
async def create_quote(body: QuoteCreateRequest):
    db = get_database()
    now = datetime.now(timezone.utc)
    quote_id = f"quote_{body.sku.lower()}_{int(now.timestamp())}"
    doc = {
        "_id": quote_id,
        "supplier_id": "supp_maha_agro",
        "sku": body.sku,
        "product_name": body.product_name,
        "unit": body.unit,
        "tiers": body.tiers,
        "delivery_fee": body.delivery_fee,
        "moq": body.moq,
        "valid_till": now + timedelta(days=body.valid_days),
        "serviceable_pincodes": body.serviceable_pincodes,
        "created_at": now
    }
    await db.supplier_quotes.insert_one(doc)
    return {"success": True, "quote_id": quote_id}

@router.get("/orders")
async def list_supplier_orders():
    db = get_database()
    cursor = db.group_orders.find().sort("created_at", -1)
    orders = await cursor.to_list(length=50)
    for o in orders:
        o["id"] = str(o["_id"])
    return orders

@router.post("/orders/{id}/dispatch")
async def dispatch_order(id: str):
    return await transition_group_order_state(
        group_order_id=id,
        new_state="DISPATCHED",
        actor="supplier",
        reason="Dispatched from wholesale warehouse"
    )

@router.post("/orders/{id}/deliver")
async def deliver_order(id: str):
    return await transition_group_order_state(
        group_order_id=id,
        new_state="DELIVERED",
        actor="supplier",
        reason="Delivered to all merchant destination shops"
    )

