from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PaymentProvider(ABC):
    @abstractmethod
    async def initiate_transaction(
        self,
        order_id: str,
        amount_paise: int,
        customer_id: str,
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Initiates transaction and returns txnToken + checkout parameters."""
        pass

    @abstractmethod
    async def get_transaction_status(self, order_id: str) -> Dict[str, Any]:
        """Queries transaction status directly from the gateway."""
        pass

    @abstractmethod
    async def initiate_refund(
        self,
        order_id: str,
        ref_id: str,
        txn_id: str,
        amount_paise: int
    ) -> Dict[str, Any]:
        """Applies for a refund on a successful transaction."""
        pass

    @abstractmethod
    def verify_checksum(self, body_str: str, checksum: str) -> bool:
        """Verifies digital signature on callback/webhook payloads."""
        pass

