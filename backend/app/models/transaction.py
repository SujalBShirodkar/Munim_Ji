from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import utc_now

class TransactionItem(BaseModel):
    sku: str
    name: Optional[str] = None
    qty: float
    price: int  # in paise

class TransactionBase(BaseModel):
    merchant_id: str
    paytm_order_id: Optional[str] = None
    txn_id: Optional[str] = None
    amount: int  # in paise
    status: Literal["SUCCESS", "PENDING", "FAILED"] = "SUCCESS"
    payment_mode: str = "UPI"
    items: Optional[List[TransactionItem]] = None
    customer_ref: Optional[str] = None  # SHA-256 hashed customer mobile/identifier
    source: Literal["paytm_sandbox", "simulated"] = "simulated"
    created_at: datetime = Field(default_factory=utc_now)

class TransactionInDB(TransactionBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

class SettlementBase(BaseModel):
    merchant_id: str
    amount: int  # in paise
    status: Literal["SETTLED", "PENDING", "FAILED"] = "SETTLED"
    expected_date: datetime
    settled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)

class SettlementInDB(SettlementBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

