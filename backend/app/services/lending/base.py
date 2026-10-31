from abc import ABC, abstractmethod
from typing import Dict, Any

class LendingPartner(ABC):
    @abstractmethod
    async def get_eligibility_offer(self, merchant_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def generate_kfs(self, merchant_id: str, amount_paise: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def disburse(self, merchant_id: str, amount_paise: int, consent_id: str) -> Dict[str, Any]:
        pass

