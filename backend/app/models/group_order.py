from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import utc_now

GroupOrderState = Literal[
    "OPEN",
    "THRESHOLD_MET",
    "AWAITING_CONFIRMATION",
    "PAYMENT_PENDING",
    "CONFIRMED",
    "DISPATCHED",
    "DELIVERED",
    "SETTLED",
    "EXPIRED",
    "CANCELLED",
    "REFUNDING"
]

class StateHistoryEntry(BaseModel):
    from_state: Optional[str]
    to_state: str
    reason: Optional[str] = None
    at: datetime = Field(default_factory=utc_now)

class GroupOrderBase(BaseModel):
    sku: str
    product_name: str
    unit: str = "kg"
    supplier_id: str
    quote_id: str
    state: GroupOrderState = "OPEN"
    threshold_qty: float
    current_qty: float = 0.0
    deadline: datetime
    optimizer_result: Optional[Dict[str, Any]] = None
    state_history: List[StateHistoryEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)

class GroupOrderInDB(GroupOrderBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

MemberStatus = Literal["invited", "confirmed", "paid", "refunded", "received"]

class GroupOrderMemberBase(BaseModel):
    group_order_id: str
    merchant_id: str
    shop_name: Optional[str] = None
    qty: float
    unit_price: int  # in paise
    fee_share: int  # in paise
    total_payable: int  # in paise
    baseline_price: int  # in paise (prior individual cost)
    estimated_saving: int  # in paise (baseline - total)
    status: MemberStatus = "invited"
    consent_id: Optional[str] = None
    payment_id: Optional[str] = None
    paytm_order_id: Optional[str] = None
    actual_cost_after_delivery: Optional[int] = None
    created_at: datetime = Field(default_factory=utc_now)

class GroupOrderMemberInDB(GroupOrderMemberBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

