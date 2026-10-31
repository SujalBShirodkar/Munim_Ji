from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import utc_now

class CreditAccountBase(BaseModel):
    merchant_id: str
    limit: int = 500000  # ₹5,000 in paise
    outstanding: int = 0  # in paise
    repayment_rate: float = 0.20  # 20%
    status: Literal["ACTIVE", "PAUSED", "CLOSED"] = "ACTIVE"
    partner: str = "MockNBFC (Simulated Partner)"
    disbursed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)

class CreditAccountInDB(CreditAccountBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

class CreditRepaymentBase(BaseModel):
    account_id: str
    merchant_id: str
    source_payment_id: str  # unique source customer payment ID
    amount: int  # in paise
    outstanding_before: int
    outstanding_after: int
    created_at: datetime = Field(default_factory=utc_now)

class CreditRepaymentInDB(CreditRepaymentBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

