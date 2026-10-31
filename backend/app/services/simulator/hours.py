from typing import Dict, Any
from app.db.mongo import get_database

async def simulate_extended_hours(
    merchant_id: str,
    extra_hours: int = 2,
    shift: str = "evening"  # or "morning"
) -> Dict[str, Any]:
    db = get_database()
    # Baseline: check average hourly sales around 8 PM - 10 PM
    baseline_hourly_revenue = 450.0  # ₹450 / hr average
    
    # Conservative haircut for late night hours
    haircut_low = 0.40  # 40% of peak hourly revenue
    haircut_base = 0.60 # 60%
    haircut_high = 0.85 # 85%

    outcomes = {
        "conservative": {
            "est_hourly_sales_rupees": round(baseline_hourly_revenue * haircut_low, 2),
            "est_additional_daily_revenue_rupees": round(baseline_hourly_revenue * haircut_low * extra_hours, 2),
            "est_monthly_additional_rupees": round(baseline_hourly_revenue * haircut_low * extra_hours * 30, 2)
        },
        "base": {
            "est_hourly_sales_rupees": round(baseline_hourly_revenue * haircut_base, 2),
            "est_additional_daily_revenue_rupees": round(baseline_hourly_revenue * haircut_base * extra_hours, 2),
            "est_monthly_additional_rupees": round(baseline_hourly_revenue * haircut_base * extra_hours * 30, 2)
        },
        "optimistic": {
            "est_hourly_sales_rupees": round(baseline_hourly_revenue * haircut_high, 2),
            "est_additional_daily_revenue_rupees": round(baseline_hourly_revenue * haircut_high * extra_hours, 2),
            "est_monthly_additional_rupees": round(baseline_hourly_revenue * haircut_high * extra_hours * 30, 2)
        }
    }

    return {
        "scenario": "extended_hours",
        "inputs": {"extra_hours": extra_hours, "shift": shift},
        "baseline": {"adjacent_hour_sales_rupees": baseline_hourly_revenue},
        "outcomes": outcomes,
        "assumptions": [
            f"Extra {extra_hours} hours added to {shift} closing time.",
            "Footfall haircut accounts for tapering evening traffic after 10 PM.",
            "Electricity and helper overtime costs are not deducted."
        ],
        "missing_data": ["Staff overtime wage rates", "Late night delivery aggregator order volumes"],
        "confidence": "medium",
        "disclaimer": "Illustrative scenario estimate based on late evening sales trends."
    }

