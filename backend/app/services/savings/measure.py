from typing import Dict, Any, List
from app.db.mongo import get_database

async def get_merchant_savings_report(merchant_id: str) -> Dict[str, Any]:
    db = get_database()

    # Measured savings from delivered group orders
    cursor_measured = db.savings_records.find({"merchant_id": merchant_id, "kind": "measured"})
    measured_records = await cursor_measured.to_list(length=100)
    total_measured_paise = sum(r["net_saving"] for r in measured_records)

    # Illustrative savings from active/open group orders where merchant is a member
    cursor_active_members = db.group_order_members.find({
        "merchant_id": merchant_id,
        "status": {"$in": ["confirmed", "paid"]}
    })
    active_members = await cursor_active_members.to_list(length=100)
    total_illustrative_paise = sum(m.get("estimated_saving", 0) for m in active_members)

    # Detailed orders breakdown
    breakdown = []
    for r in measured_records:
        breakdown.append({
            "group_order_id": r.get("group_order_id"),
            "product_name": r.get("product_name"),
            "kind": "measured",
            "net_saving_rupees": round(r["net_saving"] / 100, 2),
            "baseline_cost_rupees": round(r["baseline_cost"] / 100, 2),
            "actual_cost_rupees": round(r["actual_cost"] / 100, 2),
            "date": r.get("created_at")
        })

    for m in active_members:
        # Fetch group order product name
        go = await db.group_orders.find_one({"_id": m["group_order_id"]})
        prod_name = go.get("product_name", "Pooled Item") if go else "Pooled Item"
        breakdown.append({
            "group_order_id": m.get("group_order_id"),
            "product_name": prod_name,
            "kind": "illustrative",
            "net_saving_rupees": round(m.get("estimated_saving", 0) / 100, 2),
            "baseline_cost_rupees": round(m.get("baseline_price", 0) / 100, 2),
            "actual_cost_rupees": round(m.get("total_payable", 0) / 100, 2),
            "date": m.get("created_at")
        })

    return {
        "total_savings_rupees": round((total_measured_paise + total_illustrative_paise) / 100, 2),
        "measured_savings_rupees": round(total_measured_paise / 100, 2),
        "measured_savings_paise": total_measured_paise,
        "illustrative_savings_rupees": round(total_illustrative_paise / 100, 2),
        "illustrative_savings_paise": total_illustrative_paise,
        "measured_orders_count": len(measured_records),
        "active_orders_count": len(active_members),
        "breakdown": breakdown
    }

