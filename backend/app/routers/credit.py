from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.db.mongo import get_database
from app.core.deps import get_current_user_payload
from app.services.lending.mock_nbfc import mock_nbfc

router = APIRouter(prefix="/credit", tags=["instant credit"])

class AcceptCreditRequest(BaseModel):
    amount_rupees: float = 5000.0
    confirmed_kfs: bool = True
    otp_code: Optional[str] = "123456"

class PrepayRequest(BaseModel):
    amount_rupees: float

@router.get("/offer")
async def get_offer(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await mock_nbfc.get_eligibility_offer(merchant_id)

@router.get("/kfs")
async def get_key_facts_statement(
    amount: float = 5000.0,
    user: dict = Depends(get_current_user_payload)
):
    merchant_id = user.get("sub", "merchant_sharma_001")
    return await mock_nbfc.generate_kfs(merchant_id, int(round(amount * 100)))

@router.post("/accept")
async def accept_credit(body: AcceptCreditRequest, user: dict = Depends(get_current_user_payload)):
    if not body.confirmed_kfs:
        raise HTTPException(status_code=400, detail="Merchant must accept the Key Facts Statement.")

    merchant_id = user.get("sub", "merchant_sharma_001")
    db = get_database()
    now = datetime.now(timezone.utc)

    # Consent record
    consent_id = f"consent_credit_{merchant_id}_{int(now.timestamp())}"
    await db.consents.insert_one({
        "_id": consent_id,
        "merchant_id": merchant_id,
        "type": "credit",
        "text_version": "v1.0",
        "details": {"amount_rupees": body.amount_rupees, "otp": body.otp_code},
        "accepted_at": now
    })

    # Disburse
    amount_paise = int(round(body.amount_rupees * 100))
    result = await mock_nbfc.disburse(merchant_id, amount_paise, consent_id)
    return result

@router.get("/ledger")
async def get_credit_ledger(user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    db = get_database()
    
    account = await db.credit_accounts.find_one({"merchant_id": merchant_id})
    cursor = db.credit_repayments.find({"merchant_id": merchant_id}).sort("created_at", -1)
    repayments = await cursor.to_list(length=100)
    
    for r in repayments:
        r["id"] = str(r["_id"])
        r["amount_rupees"] = round(r["amount"] / 100, 2)
        r["outstanding_before_rupees"] = round(r["outstanding_before"] / 100, 2)
        r["outstanding_after_rupees"] = round(r["outstanding_after"] / 100, 2)

    return {
        "account": account,
        "outstanding_rupees": round(account.get("outstanding", 0) / 100, 2) if account else 0,
        "limit_rupees": round(account.get("limit", 500000) / 100, 2) if account else 5000,
        "repayment_rate": "20% of every customer payment",
        "repayments": repayments
    }

@router.post("/prepay")
async def prepay_credit(body: PrepayRequest, user: dict = Depends(get_current_user_payload)):
    merchant_id = user.get("sub", "merchant_sharma_001")
    db = get_database()
    amount_paise = int(round(body.amount_rupees * 100))
    
    account = await db.credit_accounts.find_one({"merchant_id": merchant_id})
    if not account or account.get("outstanding", 0) <= 0:
        return {"success": True, "message": "No outstanding balance"}

    curr_out = account["outstanding"]
    deduct = min(amount_paise, curr_out)
    new_out = curr_out - deduct

    now = datetime.now(timezone.utc)
    await db.credit_accounts.update_one(
        {"merchant_id": merchant_id},
        {"$set": {"outstanding": new_out}}
    )

    await db.credit_repayments.insert_one({
        "account_id": str(account.get("_id", f"credit_{merchant_id}")),
        "merchant_id": merchant_id,
        "source_payment_id": f"PREPAY-{int(now.timestamp())}",
        "amount": deduct,
        "outstanding_before": curr_out,
        "outstanding_after": new_out,
        "created_at": now
    })

    return {
        "success": True,
        "prepaid_rupees": round(deduct / 100, 2),
        "outstanding_rupees": round(new_out / 100, 2)
    }

