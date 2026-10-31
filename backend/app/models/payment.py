from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import utc_now

PaymentPurpose = Literal["group_order", "customer_payment", "credit_repayment"]
PaymentStatus = Literal["INITIATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]

class PaymentBase(BaseModel):
    order_id: str  # Unique Paytm Order ID (e.g. GO-xxx or CUST-xxx)
    purpose: PaymentPurpose
    merchant_id: str
    amount: int  # in paise
    status: PaymentStatus = "INITIATED"
    paytm_txn_id: Optional[str] = None
    checksum_verified: bool = False
    refund_ids: List[str] = Field(default_factory=list)
    idempotency_key: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class PaymentInDB(PaymentBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

