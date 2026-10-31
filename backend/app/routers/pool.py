from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from app.db.mongo import get_database
from app.core.deps import get_current_user_payload
from app.services.pooling.matcher import find_eligible_group_orders
from app.services.pooling.optimizer import optimize_pooled_order
from app.services.pooling.state_machine import transition_group_order_state
from app.services.payments.paytm import paytm_provider

router = APIRouter(prefix="/pool", tags=["pooled buying"])

class PostNeedRequest(BaseModel):
    sku: str
    product_name: str
    qty: float
    unit: str = "bag"
    window: str = "2d"

class JoinGroupRequest(BaseModel):
    qty: float
    confirmed: bool = True
    device_info: Optional[str] = "web-client"

@router.get("/needs")
async def list_needs(user: dict = Depends(get_current_user_payload)):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    cursor = db.needs.find({"merchant_id": merchant_id}).sort("created_at", -1)
    needs = await cursor.to_list(length=50)
    for n in needs:
        n["id"] = str(n["_id"])
    return needs

@router.post("/needs")
async def post_need(body: PostNeedRequest, user: dict = Depends(get_current_user_payload)):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    merchant = await db.merchants.find_one({"_id": merchant_id})
    coords = merchant.get("location", {}).get("coordinates", [72.8697, 19.1136]) if merchant else [72.8697, 19.1136]

    doc = {
        "merchant_id": merchant_id,
        "sku": body.sku,
        "product_name": body.product_name,
        "qty": body.qty,
        "unit": body.unit,
        "window": body.window,
        "location": {"type": "Point", "coordinates": coords},
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.needs.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return {"success": True, "need": doc}

@router.get("/groups")
async def list_groups(
    product: Optional[str] = None,
    user: dict = Depends(get_current_user_payload)
):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await find_eligible_group_orders(merchant_id, product)

@router.get("/groups/{id}")
async def get_group_order(id: str, user: dict = Depends(get_current_user_payload)):
    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    order = await db.group_orders.find_one({"_id": id})
    if not order:
        raise HTTPException(status_code=404, detail="Group order not found")

    order["id"] = str(order["_id"])
    
    # Get members
    cursor_members = db.group_order_members.find({"group_order_id": id})
    members = await cursor_members.to_list(length=100)
    for m in members:
        m["id"] = str(m["_id"])
        m["total_payable_rupees"] = round(m["total_payable"] / 100, 2)
        m["estimated_saving_rupees"] = round(m.get("estimated_saving", 0) / 100, 2)

    # Get quote details with tiers
    quote = await db.supplier_quotes.find_one({"_id": order.get("quote_id")})
    supplier = await db.suppliers.find_one({"_id": order.get("supplier_id")})

    # Check if this merchant is joined
    user_member = next((m for m in members if m["merchant_id"] == merchant_id), None)

    return {
        "group_order": order,
        "members": members,
        "member_count": len(members),
        "quote": quote,
        "supplier": supplier,
        "user_member": user_member,
        "is_joined": user_member is not None
    }

@router.post("/groups/{id}/join")
async def join_group_order(id: str, body: JoinGroupRequest, user: dict = Depends(get_current_user_payload)):
    if not body.confirmed:
        raise HTTPException(status_code=400, detail="Explicit merchant confirmation is required to join a group order.")

    db = get_database()
    merchant_id = user.get("sub", "merchant_sharma_001")
    merchant = await db.merchants.find_one({"_id": merchant_id})
    shop_name = merchant.get("shop_name", "Sharma Chai & General Store") if merchant else "Sharma Chai"

    order = await db.group_orders.find_one({"_id": id})
    if not order:
        raise HTTPException(status_code=404, detail="Group order not found")

    quote = await db.supplier_quotes.find_one({"_id": order.get("quote_id")})
    if not quote:
        raise HTTPException(status_code=404, detail="Supplier quote not found")

    now = datetime.now(timezone.utc)
    
    # Record consent
    consent_id = f"consent_{merchant_id}_{id}_{int(now.timestamp())}"
    await db.consents.insert_one({
        "_id": consent_id,
        "merchant_id": merchant_id,
        "type": "group_join",
        "text_version": "v1.0",
        "details": {"group_order_id": id, "qty": body.qty},
        "accepted_at": now,
        "ip_or_device": body.device_info or "web"
    })

    # Pricing calculation
    unit_price = quote["tiers"][1]["unit_price"] if len(quote["tiers"]) > 1 else quote["tiers"][0]["unit_price"]
    delivery_fee_share = 2500 # ₹25 share
    total_payable = int(round(body.qty * unit_price)) + delivery_fee_share
    baseline_price = int(round(body.qty * 215000)) # e.g. ₹2,150/bag baseline
    saving = max(0, baseline_price - total_payable)

    # Unique Paytm Order ID for this member share
    paytm_order_id = f"GO-{id[:12]}-{merchant_id[-4:]}-{int(now.timestamp())%10000}"

    member_doc = {
        "group_order_id": id,
        "merchant_id": merchant_id,
        "shop_name": shop_name,
        "qty": body.qty,
        "unit_price": unit_price,
        "fee_share": delivery_fee_share,
        "total_payable": total_payable,
        "baseline_price": baseline_price,
        "estimated_saving": saving,
        "status": "confirmed",
        "consent_id": consent_id,
        "paytm_order_id": paytm_order_id,
        "created_at": now
    }

    # Upsert member
    await db.group_order_members.update_one(
        {"group_order_id": id, "merchant_id": merchant_id},
        {"$set": member_doc},
        upsert=True
    )

    # Update group order quantity
    await db.group_orders.update_one(
        {"_id": id},
        {"$inc": {"current_qty": body.qty}}
    )

    # Initiate Paytm Payment Order
    payment_init = await paytm_provider.initiate_transaction(
        order_id=paytm_order_id,
        amount_paise=total_payable,
        customer_id=merchant_id
    )

    # Record payment entry
    await db.payments.insert_one({
        "order_id": paytm_order_id,
        "purpose": "group_order",
        "merchant_id": merchant_id,
        "amount": total_payable,
        "status": "INITIATED",
        "metadata": {"group_order_id": id, "qty": body.qty},
        "created_at": now
    })

    return {
        "success": True,
        "group_order_id": id,
        "total_payable_rupees": round(total_payable / 100, 2),
        "estimated_saving_rupees": round(saving / 100, 2),
        "paytm_order_id": paytm_order_id,
        "payment": payment_init
    }

