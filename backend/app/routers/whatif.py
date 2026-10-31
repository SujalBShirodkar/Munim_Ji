from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.deps import get_current_user_payload
from app.services.simulator.price import simulate_price_change
from app.services.simulator.hours import simulate_extended_hours

router = APIRouter(prefix="/whatif", tags=["simulator"])

class WhatIfRequest(BaseModel):
    scenario_type: str = "price_change"  # or "extended_hours"
    sku: Optional[str] = None
    product_name: Optional[str] = "chai"
    delta_rupees: Optional[float] = 2.0
    custom_elasticity: Optional[float] = None
    extra_hours: Optional[int] = 2
    shift: Optional[str] = "evening"

@router.post("/run")
async def run_simulation(body: WhatIfRequest, user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    if body.scenario_type == "extended_hours":
        return await simulate_extended_hours(
            merchant_id=merchant_id,
            extra_hours=body.extra_hours or 2,
            shift=body.shift or "evening"
        )
    else:
        return await simulate_price_change(
            merchant_id=merchant_id,
            sku=body.sku,
            product_name_query=body.product_name or "chai",
            delta_rupees=body.delta_rupees if body.delta_rupees is not None else 2.0,
            custom_elasticity=body.custom_elasticity
        )

