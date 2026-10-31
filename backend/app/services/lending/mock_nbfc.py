from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from app.db.mongo import get_database
from app.services.lending.base import LendingPartner

class MockNBFC(LendingPartner):
    partner_name = "MockNBFC (Simulated Partner)"

    async def get_eligibility_offer(self, merchant_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # Check if already has an account
        account = await db.credit_accounts.find_one({"merchant_id": merchant_id})
        
        # Pull 30 days average collections
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        cursor = db.transactions.find({
            "merchant_id": merchant_id,
            "status": "SUCCESS",
            "created_at": {"$gte": thirty_days_ago}
        })
        txns = await cursor.to_list(length=2000)
        total_30d = sum(t["amount"] for t in txns) if txns else 840000 * 30
        avg_daily_paise = int(total_30d / 30) if total_30d > 0 else 840000
        avg_daily_rupees = round(avg_daily_paise / 100, 2)

        # Standard pre-approved limit is ₹5,000 (500,000 paise)
        limit_paise = 500000
        repayment_rate = 0.20 # 20% auto-deduction
        
        # Illustrative payoff estimate: days_to_clear ≈ outstanding / (repayment_rate * avg_daily_collections)
        # e.g. 5,000 / (0.20 * 8,400) ≈ 2.98 ≈ ~3 days!
        daily_repayment_est = repayment_rate * avg_daily_rupees
        days_to_clear = round((limit_paise / 100) / daily_repayment_est, 1) if daily_repayment_est > 0 else 3.0

        outstanding_paise = account.get("outstanding", 0) if account else 0

        return {
            "eligible": True,
            "pre_approved_limit_rupees": round(limit_paise / 100, 2),
            "pre_approved_limit_paise": limit_paise,
            "outstanding_rupees": round(outstanding_paise / 100, 2),
            "outstanding_paise": outstanding_paise,
            "available_limit_rupees": round(max(0, limit_paise - outstanding_paise) / 100, 2),
            "repayment_rate": repayment_rate,
            "repayment_rate_pct": "20%",
            "avg_daily_sales_rupees": avg_daily_rupees,
            "days_to_clear_estimate": days_to_clear,
            "days_to_clear_label": f"~{int(round(days_to_clear))} days",
            "partner": self.partner_name,
            "is_demo": True,
            "demo_tag": "Demo — no real loan",
            "why_this_limit": [
                f"Consistent daily Paytm collections averaging ₹{avg_daily_rupees:,.0f}/day over 30 days.",
                "Stable tenure > 90 days with zero chargebacks.",
                "Repayment comfortably clears within ~3 business days with standard 20% auto-deduction."
            ]
        }

    async def generate_kfs(self, merchant_id: str, amount_paise: int = 500000) -> Dict[str, Any]:
        """Key Facts Statement according to digital lending norms."""
        offer = await self.get_eligibility_offer(merchant_id)
        amt_rupees = round(amount_paise / 100, 2)
        processing_fee = 100.0 # Flat ₹100
        disbursed_amt = amt_rupees - processing_fee

        return {
            "partner_name": self.partner_name,
            "loan_amount_rupees": amt_rupees,
            "net_disbursed_rupees": disbursed_amt,
            "processing_fee_rupees": processing_fee,
            "apr_equivalent": "18% p.a.",
            "repayment_model": "Auto-deduction of 20% on each customer QR/Paytm payment until balance clears",
            "illustrative_days_to_clear": offer["days_to_clear_label"],
            "grievance_officer": "Grievance Officer (MockNBFC), grievance@munimji.mock",
            "cooling_off_period": "3 days unconditional cancellation",
            "is_demo": True,
            "demo_tag": "Demo — no real loan"
        }

    async def disburse(self, merchant_id: str, amount_paise: int, consent_id: str) -> Dict[str, Any]:
        db = get_database()
        now = datetime.now(timezone.utc)
        
        account = await db.credit_accounts.find_one({"merchant_id": merchant_id})
        if not account:
            account_id = f"credit_{merchant_id}"
            await db.credit_accounts.insert_one({
                "_id": account_id,
                "merchant_id": merchant_id,
                "limit": 500000,
                "outstanding": amount_paise,
                "repayment_rate": 0.20,
                "status": "ACTIVE",
                "partner": self.partner_name,
                "disbursed_at": now,
                "created_at": now
            })
        else:
            await db.credit_accounts.update_one(
                {"merchant_id": merchant_id},
                {
                    "$inc": {"outstanding": amount_paise},
                    "$set": {"status": "ACTIVE", "disbursed_at": now}
                }
            )

        # Audit log
        await db.audit_logs.insert_one({
            "actor": merchant_id,
            "action": "credit_disbursed",
            "entity": "credit_account",
            "entity_id": merchant_id,
            "details": {"amount_paise": amount_paise, "consent_id": consent_id},
            "at": now
        })

        return {
            "success": True,
            "disbursed_rupees": round(amount_paise / 100, 2),
            "status": "ACTIVE",
            "partner": self.partner_name,
            "is_demo": True
        }

mock_nbfc = MockNBFC()

