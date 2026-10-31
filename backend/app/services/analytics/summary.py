from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import pandas as pd
from app.db.mongo import get_database

def parse_period_dates(period: str):
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    
    if period == "today":
        return today_start, now
    elif period == "yesterday":
        yest_start = today_start - timedelta(days=1)
        yest_end = datetime(yest_start.year, yest_start.month, yest_start.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
        return yest_start, yest_end
    elif period == "last_7d":
        return today_start - timedelta(days=7), now
    elif period == "last_30d":
        return today_start - timedelta(days=30), now
    else:
        return today_start - timedelta(days=7), now

async def get_sales_summary(merchant_id: str, period: str = "today") -> Dict[str, Any]:
    db = get_database()
    start_date, end_date = parse_period_dates(period)
    
    cursor = db.transactions.find({
        "merchant_id": merchant_id,
        "status": "SUCCESS",
        "created_at": {"$gte": start_date, "$lte": end_date}
    })
    txns = await cursor.to_list(length=5000)
    
    if not txns:
        return {
            "period": period,
            "total_sales_rupees": 0.0,
            "total_sales_paise": 0,
            "transaction_count": 0,
            "avg_transaction_rupees": 0.0,
            "best_hour": None,
            "is_measured": True,
            "source": "database"
        }
    
    df = pd.DataFrame(txns)
    total_paise = int(df["amount"].sum())
    count = len(df)
    avg_rupees = round((total_paise / count) / 100, 2) if count > 0 else 0.0
    
    # Calculate best hour
    df["hour"] = pd.to_datetime(df["created_at"]).dt.hour
    best_hr_series = df.groupby("hour")["amount"].sum()
    best_hour = int(best_hr_series.idxmax()) if not best_hr_series.empty else 10
    
    return {
        "period": period,
        "total_sales_rupees": round(total_paise / 100, 2),
        "total_sales_paise": total_paise,
        "transaction_count": count,
        "avg_transaction_rupees": avg_rupees,
        "best_hour": f"{best_hour:02d}:00 - {(best_hour+1)%24:02d}:00",
        "is_measured": True,
        "source": "database"
    }

async def get_hourly_sales(merchant_id: str, date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    db = get_database()
    now = datetime.now(timezone.utc)
    if date_str == "yesterday":
        target = now - timedelta(days=1)
    else:
        target = now
    
    start = datetime(target.year, target.month, target.day, 0, 0, 0, tzinfo=timezone.utc)
    end = datetime(target.year, target.month, target.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    
    cursor = db.transactions.find({
        "merchant_id": merchant_id,
        "status": "SUCCESS",
        "created_at": {"$gte": start, "$lte": end}
    })
    txns = await cursor.to_list(length=2000)
    
    hourly = {h: 0 for h in range(6, 23)} # 6 AM to 10 PM
    for t in txns:
        h = t["created_at"].hour
        if h in hourly:
            hourly[h] += t["amount"]
            
    return [{"hour": f"{h:02d}:00", "sales_rupees": round(amt / 100, 2)} for h, amt in hourly.items()]

async def get_top_products(merchant_id: str, period: str = "last_7d", n: int = 5) -> List[Dict[str, Any]]:
    db = get_database()
    # Pull products catalogue for merchant
    cursor = db.products.find({"merchant_id": merchant_id})
    prods = await cursor.to_list(length=100)
    
    # Return top catalogue items sorted by sell price or simulated volume
    result = []
    for p in prods[:n]:
        result.append({
            "sku": p["sku"],
            "name": p["name"],
            "unit": p.get("unit", "kg"),
            "sell_price_rupees": round(p["sell_price"] / 100, 2),
            "stock_qty": p.get("stock_qty", 0.0)
        })
    return result

async def get_settlements(merchant_id: str, period: str = "last_7d") -> List[Dict[str, Any]]:
    db = get_database()
    cursor = db.settlements.find({"merchant_id": merchant_id}).sort("created_at", -1)
    settlements = await cursor.to_list(length=10)
    
    res = []
    for s in settlements:
        res.append({
            "amount_rupees": round(s["amount"] / 100, 2),
            "status": s["status"],
            "expected_date": s.get("expected_date"),
            "settled_at": s.get("settled_at")
        })
    return res

async def get_pending_settlement(merchant_id: str) -> Dict[str, Any]:
    db = get_database()
    s = await db.settlements.find_one({"merchant_id": merchant_id, "status": "PENDING"})
    if not s:
        return {"amount_rupees": 0.0, "status": "NONE"}
    return {
        "amount_rupees": round(s["amount"] / 100, 2),
        "status": "PENDING",
        "expected_date": s.get("expected_date")
    }

async def compare_periods(merchant_id: str, period_a: str, period_b: str) -> Dict[str, Any]:
    res_a = await get_sales_summary(merchant_id, period_a)
    res_b = await get_sales_summary(merchant_id, period_b)
    diff_rupees = round(res_a["total_sales_rupees"] - res_b["total_sales_rupees"], 2)
    pct_change = round((diff_rupees / res_b["total_sales_rupees"]) * 100, 1) if res_b["total_sales_rupees"] > 0 else 0.0
    
    return {
        "period_a": {"name": period_a, **res_a},
        "period_b": {"name": period_b, **res_b},
        "difference_rupees": diff_rupees,
        "percentage_change": pct_change
    }

