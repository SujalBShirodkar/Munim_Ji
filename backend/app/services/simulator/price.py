import os
import yaml
from typing import Dict, Any, Optional
from app.db.mongo import get_database

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config", "elasticity.yaml")

def load_elasticity_config() -> Dict[str, Any]:
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception:
        return {
            "categories": {
                "Beverages": {"low": -0.8, "base": -0.5, "high": -0.3},
                "Staples": {"low": -0.5, "base": -0.35, "high": -0.2},
                "Snacks": {"low": -0.9, "base": -0.6, "high": -0.4},
            }
        }

async def simulate_price_change(
    merchant_id: str,
    sku: Optional[str] = None,
    product_name_query: Optional[str] = "chai",
    delta_rupees: float = 2.0,
    custom_elasticity: Optional[float] = None
) -> Dict[str, Any]:
    db = get_database()
    
    # Locate product
    product = None
    if sku:
        product = await db.products.find_one({"merchant_id": merchant_id, "sku": sku})
    if not product and product_name_query:
        # Regex search on name
        product = await db.products.find_one({
            "merchant_id": merchant_id,
            "name": {"$regex": product_name_query, "$options": "i"}
        })
    if not product:
        # Fallback to default chai product
        product = await db.products.find_one({"merchant_id": merchant_id, "sku": "SKU-CHAI-CUP"})
    if not product:
        product = {
            "sku": "SKU-CHAI-CUP",
            "name": "Cutting Masala Chai",
            "category": "Beverages",
            "sell_price": 1200, # ₹12
            "cost_price": 450,  # ₹4.50
            "unit": "cup"
        }

    current_price_rupees = product["sell_price"] / 100
    cost_price_rupees = (product.get("cost_price") or int(product["sell_price"] * 0.4)) / 100
    new_price_rupees = current_price_rupees + delta_rupees
    
    # Baseline daily volume estimate (e.g. 150 cups of chai, or 10 units for staple)
    category = product.get("category", "Beverages")
    baseline_volume = 150.0 if "chai" in product["name"].lower() else 15.0
    
    # Percentage price change
    pct_price_change = (delta_rupees / current_price_rupees)
    
    # Elasticity ranges
    elasticity_cfg = load_elasticity_config()
    cat_cfg = elasticity_cfg.get("categories", {}).get(category, {"low": -0.7, "base": -0.45, "high": -0.25})
    
    e_low = cat_cfg["low"]   # highest volume drop
    e_base = custom_elasticity if custom_elasticity is not None else cat_cfg["base"]
    e_high = cat_cfg["high"] # lowest volume drop (most loyal)
    
    def compute_scenario(elasticity: float):
        # pct_volume_change = elasticity * pct_price_change
        pct_vol_change = elasticity * pct_price_change
        new_volume = max(1.0, baseline_volume * (1.0 + pct_vol_change))
        daily_revenue = new_volume * new_price_rupees
        daily_cost = new_volume * cost_price_rupees
        daily_margin = daily_revenue - daily_cost
        return {
            "elasticity": round(elasticity, 2),
            "volume": round(new_volume, 1),
            "volume_change_pct": round(pct_vol_change * 100, 1),
            "daily_revenue_rupees": round(daily_revenue, 2),
            "revenue_change_rupees": round(daily_revenue - (baseline_volume * current_price_rupees), 2),
            "daily_gross_margin_rupees": round(daily_margin, 2),
            "margin_change_rupees": round(daily_margin - (baseline_volume * (current_price_rupees - cost_price_rupees)), 2)
        }

    outcomes = {
        "conservative": compute_scenario(e_low),
        "base": compute_scenario(e_base),
        "optimistic": compute_scenario(e_high)
    }

    baseline = {
        "product_name": product["name"],
        "sku": product["sku"],
        "current_price_rupees": current_price_rupees,
        "cost_price_rupees": cost_price_rupees,
        "baseline_daily_volume": baseline_volume,
        "baseline_daily_revenue_rupees": round(baseline_volume * current_price_rupees, 2),
        "baseline_daily_margin_rupees": round(baseline_volume * (current_price_rupees - cost_price_rupees), 2)
    }

    assumptions = [
        f"Category price elasticity benchmark for {category} is between {e_low} and {e_high}.",
        "Baseline sales calculated from average peak hour transaction frequencies.",
        "Nearby competing vendors are assumed to keep their current pricing unchanged.",
        "Supplier raw material unit cost remains constant."
    ]

    missing_data = [
        "Competitor stall pricing on the same street (Andheri East).",
        "Weather/rain impact on daily walk-in tea drinkers.",
        "Exact count of repeat customer loyalty cards."
    ]

    return {
        "scenario": "product_price_change",
        "inputs": {
            "sku": product["sku"],
            "product_name": product["name"],
            "delta_rupees": delta_rupees,
            "new_price_rupees": new_price_rupees
        },
        "baseline": baseline,
        "outcomes": outcomes,
        "assumptions": assumptions,
        "missing_data": missing_data,
        "confidence": "medium",
        "disclaimer": "Illustrative estimate based on category price elasticity. Real merchant results depend on footfall and competitor actions."
    }

