from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.db.mongo import get_database
from app.core.logging import logger

async def process_auto_repayment(
    merchant_id: str,
    source_payment_id: str,
    payment_amount_paise: int
) -> Optional[Dict[str, Any]]:
    """
    Auto-deducts 20% of successful customer payment toward merchant's outstanding credit.
    Idempotent by source_payment_id.
    """
    db = get_database()
    
    # Check if this payment was already processed for auto-repayment
    existing = await db.credit_repayments.find_one({"source_payment_id": source_payment_id})
    if existing:
        logger.info(f"Payment {source_payment_id} already processed for repayment.")
        return None

    # Check merchant's credit account
    account = await db.credit_accounts.find_one({"merchant_id": merchant_id, "status": "ACTIVE"})
    if not account or account.get("outstanding", 0) <= 0:
        return None

    rate = account.get("repayment_rate", 0.20)
    outstanding_before = account["outstanding"]
    
    # Calculate 20%
    repay_amount = int(round(payment_amount_paise * rate))
    repay_amount = min(repay_amount, outstanding_before)

    if repay_amount <= 0:
        return None

    outstanding_after = outstanding_before - repay_amount
    now = datetime.now(timezone.utc)

    # Insert repayment ledger record
    repayment_doc = {
        "account_id": str(account.get("_id", f"credit_{merchant_id}")),
        "merchant_id": merchant_id,
        "source_payment_id": source_payment_id,
        "amount": repay_amount,
        "outstanding_before": outstanding_before,
        "outstanding_after": outstanding_after,
        "created_at": now
    }
    await db.credit_repayments.insert_one(repayment_doc)

    # Update account balance
    await db.credit_accounts.update_one(
        {"_id": account["_id"]},
        {"$set": {"outstanding": outstanding_after}}
    )

    logger.info(
        f"Auto-repaid ₹{repay_amount/100:.2f} from txn {source_payment_id} "
        f"for merchant {merchant_id}. Outstanding: ₹{outstanding_before/100:.2f} -> ₹{outstanding_after/100:.2f}"
    )

    return {
        "repayment_rupees": round(repay_amount / 100, 2),
        "outstanding_before_rupees": round(outstanding_before / 100, 2),
        "outstanding_after_rupees": round(outstanding_after / 100, 2),
        "is_cleared": outstanding_after == 0
    }

