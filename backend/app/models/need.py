from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import GeoPoint, utc_now

class NeedBase(BaseModel):
    merchant_id: str
    sku: str
    product_name: Optional[str] = None
    qty: float
    unit: str = "kg"
    window: str = "2d"  # e.g. "today", "2d", "next_week"
    location: GeoPoint
    status: Literal["OPEN", "POOLED", "FULFILLED", "EXPIRED", "CANCELLED"] = "OPEN"
    created_at: datetime = Field(default_factory=utc_now)

class NeedInDB(NeedBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

