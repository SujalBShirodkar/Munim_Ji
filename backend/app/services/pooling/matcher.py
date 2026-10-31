from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.db.mongo import get_database

async def find_nearby_needs(
    sku: str,
    coords: List[float],
    radius_km: float = 5.0,
    exclude_merchant_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Finds open needs within radius_km for the same SKU using MongoDB $geoNear."""
    db = get_database()
    max_distance_meters = radius_km * 1000.0

    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": coords},
                "distanceField": "distance_meters",
                "maxDistance": max_distance_meters,
                "spherical": True,
                "query": {
                    "sku": sku,
                    "status": "OPEN"
                }
            }
        }
    ]

    cursor = db.needs.aggregate(pipeline)
    needs = await cursor.to_list(length=100)
    if exclude_merchant_id:
        needs = [n for n in needs if n["merchant_id"] != exclude_merchant_id]
    return needs

async def find_eligible_group_orders(
    merchant_id: str,
    product_query: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Returns active group orders that the merchant can join or view."""
    db = get_database()
    query: Dict[str, Any] = {"state": {"$in": ["OPEN", "THRESHOLD_MET", "AWAITING_CONFIRMATION"]}}
    if product_query:
        query["product_name"] = {"$regex": product_query, "$options": "i"}

    cursor = db.group_orders.find(query).sort("created_at", -1)
    orders = await cursor.to_list(length=20)

    # Decorate with whether the merchant is already a member
    result = []
    for o in orders:
        o["_id"] = str(o["_id"])
        member = await db.group_order_members.find_one({
            "group_order_id": o["_id"],
            "merchant_id": merchant_id
        })
        o["user_is_member"] = member is not None
        o["user_member_status"] = member.get("status") if member else None
        result.append(o)
    return result

