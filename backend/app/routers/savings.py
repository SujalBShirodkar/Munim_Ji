from fastapi import APIRouter, Depends
from app.core.deps import get_current_user_payload
from app.services.savings.measure import get_merchant_savings_report

router = APIRouter(prefix="/savings", tags=["savings"])

@router.get("/report")
async def get_savings_report(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await get_merchant_savings_report(merchant_id)

