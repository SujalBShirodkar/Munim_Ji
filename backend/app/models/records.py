from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import utc_now

# Consents
class ConsentBase(BaseModel):
    merchant_id: str
    type: Literal["group_join", "credit", "data_use"]
    text_version: str = "v1.0"
    details: Optional[Dict[str, Any]] = None
    accepted_at: datetime = Field(default_factory=utc_now)
    ip_or_device: Optional[str] = "web-client"

class ConsentInDB(ConsentBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

# Audit Logs
class AuditLogBase(BaseModel):
    actor: str  # merchant_id or "system" or "admin"
    action: str
    entity: str
    entity_id: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    at: datetime = Field(default_factory=utc_now)

class AuditLogInDB(AuditLogBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

# Savings
class SavingsRecordBase(BaseModel):
    merchant_id: str
    group_order_id: str
    product_name: str
    baseline_cost: int  # in paise
    actual_cost: int    # in paise
    net_saving: int     # in paise
    kind: Literal["illustrative", "measured"]
    created_at: datetime = Field(default_factory=utc_now)

class SavingsRecordInDB(SavingsRecordBase):
    id: Optional[str] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True

# Conversations
class TurnLatency(BaseModel):
    stt: float = 0.0
    llm: float = 0.0
    tts: float = 0.0
    total: float = 0.0

class ConversationTurn(BaseModel):
    transcript: str
    stt_conf: float = 0.95
    lang: str = "hi"
    tools_called: List[str] = Field(default_factory=list)
    response_spoken: str
    response_display: str
    latencies: TurnLatency = Field(default_factory=TurnLatency)
    at: datetime = Field(default_factory=utc_now)

class ConversationInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    merchant_id: str
    turns: List[ConversationTurn] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True

