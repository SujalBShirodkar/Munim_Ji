from typing import Optional
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    merchant_id: str
    sku: str
    name: str
    category: str
    unit: str = "kg"
    sell_price: int = Field(..., description="Sell price in paise")
    cost_price: Optional[int] = Field(None, description="Cost price in paise")
    stock_qty: float
    reorder_level: float = 10.0

class ProductInDB(ProductBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

