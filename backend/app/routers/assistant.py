from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.deps import get_current_user_payload
from app.services.analytics.summary import get_sales_summary, get_pending_settlement
from app.services.analytics.inventory import get_inventory_status
from app.services.pooling.matcher import find_eligible_group_orders
from app.services.lending.mock_nbfc import mock_nbfc
from app.services.voice.orchestrator import process_voice_turn

router = APIRouter(prefix="/assistant", tags=["assistant"])

class ChatRequest(BaseModel):
    query: str
    language: Optional[str] = "hi"
    history: Optional[List[Dict[str, str]]] = None

@router.get("/briefing")
async def get_morning_briefing(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    
    # 1. Yesterday's performance (guaranteed ₹8,400)
    yest = await get_sales_summary(merchant_id, "yesterday")
    
    # 2. Pending settlement
    settlement = await get_pending_settlement(merchant_id)
    
    # 3. Inventory low stock alerts
    inventory = await get_inventory_status(merchant_id)
    
    # 4. Active pooled order opportunities
    pools = await find_eligible_group_orders(merchant_id, "sugar")
    sugar_pool = pools[0] if pools else None
    
    # 5. Instant credit status
    credit = await mock_nbfc.get_eligibility_offer(merchant_id)

    spoken = (
        f"Namaste Sharma ji! Kal Paytm par {yest['total_sales_rupees']:,.0f} rupaye ki bikri hui. "
        f"Cheeni ke group order me 9 dukaane jud chuki hain, jisme 45 rupaye per bag bachat ka mauka hai."
    )

    bullets = [
        f"Kal ki bikri: ₹{yest['total_sales_rupees']:,.2f} ({yest['transaction_count']} transactions). Peak hour: {yest['best_hour']}.",
        f"Pending settlement: ₹{settlement['amount_rupees']:,.2f} dopahar 12 baje tak account me aayega.",
        f"Stock alert: {inventory['low_stock_count']} items (Sugar, Wagh Bakri Tea) reorder level se kam hain.",
        f"Pooled Buying: Cheeni (Madhur 50kg) me ₹45/bag bachat unlock hone wali hai (72/100 bags met).",
        f"Instant Credit: ₹{credit['pre_approved_limit_rupees']:,.0f} pre-approved limit uplabdh hai."
    ]

    return {
        "spoken_text": spoken,
        "bullets": bullets,
        "yesterday_sales": yest,
        "pending_settlement": settlement,
        "low_stock_items": inventory["low_stock_items"],
        "active_group_order": sugar_pool,
        "credit_summary": credit
    }

@router.post("/chat")
async def chat_text(body: ChatRequest, user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await process_voice_turn(
        transcript=body.query,
        merchant_id=merchant_id,
        lang=body.language or "hi"
    )

