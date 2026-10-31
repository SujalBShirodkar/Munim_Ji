from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.db.mongo import get_database
from app.core.logging import logger

VALID_TRANSITIONS = {
    "OPEN": ["THRESHOLD_MET", "AWAITING_CONFIRMATION", "EXPIRED", "CANCELLED"],
    "THRESHOLD_MET": ["AWAITING_CONFIRMATION", "CANCELLED", "EXPIRED"],
    "AWAITING_CONFIRMATION": ["PAYMENT_PENDING", "CONFIRMED", "CANCELLED", "REFUNDING"],
    "PAYMENT_PENDING": ["CONFIRMED", "REFUNDING", "CANCELLED"],
    "CONFIRMED": ["DISPATCHED", "REFUNDING", "CANCELLED"],
    "DISPATCHED": ["DELIVERED"],
    "DELIVERED": ["SETTLED"],
    "REFUNDING": ["CANCELLED"],
    "SETTLED": [],
    "EXPIRED": [],
    "CANCELLED": []
}

async def transition_group_order_state(
    group_order_id: str,
    new_state: str,
    actor: str = "system",
    reason: Optional[str] = None
) -> Dict[str, Any]:
    db = get_database()
    order = await db.group_orders.find_one({"_id": group_order_id})
    if not order:
        raise ValueError(f"Group order {group_order_id} not found")

    current_state = order.get("state", "OPEN")
    allowed = VALID_TRANSITIONS.get(current_state, [])
    if new_state not in allowed and new_state != current_state:
        raise ValueError(f"Invalid state transition from '{current_state}' to '{new_state}'. Allowed: {allowed}")

    now = datetime.now(timezone.utc)
    entry = {
        "from_state": current_state,
        "to_state": new_state,
        "reason": reason or f"Transitioned to {new_state} by {actor}",
        "at": now
    }

    # Update state and push history
    await db.group_orders.update_one(
        {"_id": group_order_id},
        {
            "$set": {"state": new_state},
            "$push": {"state_history": entry}
        }
    )

    # Write audit log
    await db.audit_logs.insert_one({
        "actor": actor,
        "action": "group_order_transition",
        "entity": "group_order",
        "entity_id": group_order_id,
        "before": {"state": current_state},
        "after": {"state": new_state},
        "at": now
    })

    # If new_state is DELIVERED, record measured savings for all paid members!
    if new_state == "DELIVERED":
        cursor = db.group_order_members.find({"group_order_id": group_order_id, "status": {"$in": ["paid", "confirmed"]}})
        members = await cursor.to_list(length=100)
        for m in members:
            # Baseline vs total payable
            baseline = m.get("baseline_price", 0)
            actual = m.get("total_payable", 0)
            net_saving = max(0, baseline - actual)
            await db.savings_records.insert_one({
                "merchant_id": m["merchant_id"],
                "group_order_id": group_order_id,
                "product_name": order.get("product_name", "Pooled Item"),
                "baseline_cost": baseline,
                "actual_cost": actual,
                "net_saving": net_saving,
                "kind": "measured",
                "created_at": now
            })
            # Mark member as received
            await db.group_order_members.update_one(
                {"_id": m["_id"]},
                {"$set": {"status": "received", "actual_cost_after_delivery": actual}}
            )

    logger.info(f"Group Order {group_order_id}: {current_state} -> {new_state} by {actor}")
    return {"group_order_id": group_order_id, "previous_state": current_state, "state": new_state}

