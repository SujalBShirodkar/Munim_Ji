from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import utc_now

class SupplierTier(BaseModel):
    min_qty: float
    max_qty: float
    unit_price: int  # in paise

class SupplierBase(BaseModel):
    name: str
    rating: float = 4.8
    contact: str
    service_radius_km: float = 10.0
    created_at: datetime = Field(default_factory=utc_now)

class SupplierInDB(SupplierBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

class SupplierQuoteBase(BaseModel):
    supplier_id: str
    sku: str
    product_name: str
    unit: str = "kg"
    tiers: List[SupplierTier]
    delivery_fee: int  # in paise
    moq: float  # minimum order quantity
    valid_till: datetime
    serviceable_pincodes: List[str]
    created_at: datetime = Field(default_factory=utc_now)

class SupplierQuoteInDB(SupplierQuoteBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

