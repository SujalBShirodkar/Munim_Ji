from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import GeoPoint, utc_now

class MerchantBase(BaseModel):
    phone: str
    shop_name: str
    category: str = "Kirana & General"
    language: str = "hi"
    location: GeoPoint
    pincode: str = "400069"
    kyc_status: str = "verified"
    source: str = "simulated"

class MerchantCreate(MerchantBase):
    pass

class MerchantInDB(MerchantBase):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True

