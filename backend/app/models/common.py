from typing import List, Literal, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class GeoPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

