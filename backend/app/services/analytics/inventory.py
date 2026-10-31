from typing import List, Dict, Any
from app.db.mongo import get_database

async def get_inventory_status(merchant_id: str) -> Dict[str, Any]:
    db = get_database()
    cursor = db.products.find({"merchant_id": merchant_id})
    prods = await cursor.to_list(length=100)
    
    low_stock = []
    normal_stock = []
    
    for p in prods:
        item = {
            "sku": p["sku"],
            "name": p["name"],
            "unit": p.get("unit", "kg"),
            "stock_qty": p.get("stock_qty", 0.0),
            "reorder_level": p.get("reorder_level", 10.0),
            "sell_price_rupees": round(p["sell_price"] / 100, 2),
            "cost_price_rupees": round(p.get("cost_price", 0) / 100, 2) if p.get("cost_price") else None
        }
        if item["stock_qty"] <= item["reorder_level"]:
            low_stock.append(item)
        else:
            normal_stock.append(item)
            
    return {
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock,
        "total_sku_count": len(prods),
        "alert": len(low_stock) > 0
    }

