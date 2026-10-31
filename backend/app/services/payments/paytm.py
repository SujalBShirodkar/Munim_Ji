import hmac
import hashlib
import base64
import json
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger
from app.services.payments.base import PaymentProvider

def generate_checksum_sha256(payload_str: str, key: str) -> str:
    """Generates standard Paytm HMAC-SHA256 signature encoded as base64."""
    h = hmac.new(key.encode("utf-8"), payload_str.encode("utf-8"), hashlib.sha256)
    return base64.b64encode(h.digest()).decode("utf-8")

def verify_checksum_sha256(payload_str: str, key: str, checksum: str) -> bool:
    expected = generate_checksum_sha256(payload_str, key)
    return hmac.compare_digest(expected, checksum)

class PaytmProvider(PaymentProvider):
    def __init__(self):
        self.mid = settings.PAYTM_MID
        self.key = settings.PAYTM_MERCHANT_KEY
        self.host = settings.PAYTM_HOST
        self.website = settings.PAYTM_WEBSITE
        self.mode = settings.PAYMENTS_MODE

    def verify_checksum(self, body_str: str, checksum: str) -> bool:
        if self.mode == "mock":
            return True
        return verify_checksum_sha256(body_str, self.key, checksum)

    async def initiate_transaction(
        self,
        order_id: str,
        amount_paise: int,
        customer_id: str,
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        amount_rupees = f"{amount_paise / 100:.2f}"
        cb_url = callback_url or settings.PAYTM_CALLBACK_URL

        # Handle Mock Mode for offline testing/demo
        if self.mode == "mock" or "YOUR_STAGING" in self.mid:
            logger.info(f"[PAYTM MOCK] Initiating payment order {order_id} for ₹{amount_rupees}")
            mock_token = f"MOCK_TXN_TOKEN_{order_id}"
            return {
                "success": True,
                "txn_token": mock_token,
                "order_id": order_id,
                "mid": self.mid,
                "amount": amount_rupees,
                "amount_paise": amount_paise,
                "callback_url": cb_url,
                "is_mock": True
            }

        # Real Sandbox Flow
        body = {
            "requestType": "Payment",
            "mid": self.mid,
            "websiteName": self.website,
            "orderId": order_id,
            "callbackUrl": cb_url,
            "txnAmount": {
                "value": amount_rupees,
                "currency": "INR"
            },
            "userInfo": {
                "custId": customer_id
            }
        }
        body_json = json.dumps(body)
        signature = generate_checksum_sha256(body_json, self.key)

        paytm_params = {
            "body": body,
            "head": {
                "signature": signature
            }
        }

        url = f"{self.host}/theia/api/v1/initiateTransaction?mid={self.mid}&orderId={order_id}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=paytm_params)
            data = resp.json()

        result_info = data.get("body", {}).get("resultInfo", {})
        if result_info.get("resultStatus") == "S":
            txn_token = data["body"]["txnToken"]
            return {
                "success": True,
                "txn_token": txn_token,
                "order_id": order_id,
                "mid": self.mid,
                "amount": amount_rupees,
                "amount_paise": amount_paise,
                "callback_url": cb_url,
                "is_mock": False
            }
        else:
            msg = result_info.get("resultMsg", "Initiate transaction failed")
            logger.error(f"Paytm initiateTransaction error: {msg}")
            return {
                "success": False,
                "error": msg,
                "order_id": order_id,
                "is_mock": False
            }

    async def get_transaction_status(self, order_id: str) -> Dict[str, Any]:
        if self.mode == "mock" or "YOUR_STAGING" in self.mid:
            return {
                "status": "TXN_SUCCESS",
                "order_id": order_id,
                "txn_id": f"MOCK_TXN_{order_id}",
                "result_code": "01",
                "result_msg": "Txn Successful (Mock Mode)",
                "is_mock": True
            }

        body = {
            "mid": self.mid,
            "orderId": order_id
        }
        body_json = json.dumps(body)
        signature = generate_checksum_sha256(body_json, self.key)

        paytm_params = {
            "body": body,
            "head": {"signature": signature}
        }

        url = f"{self.host}/v3/order/status"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=paytm_params)
            data = resp.json()

        b = data.get("body", {})
        r_info = b.get("resultInfo", {})
        return {
            "status": r_info.get("resultStatus"),
            "order_id": order_id,
            "txn_id": b.get("txnId"),
            "txn_amount": b.get("txnAmount"),
            "result_code": r_info.get("resultCode"),
            "result_msg": r_info.get("resultMsg"),
            "is_mock": False
        }

    async def initiate_refund(
        self,
        order_id: str,
        ref_id: str,
        txn_id: str,
        amount_paise: int
    ) -> Dict[str, Any]:
        amount_rupees = f"{amount_paise / 100:.2f}"
        if self.mode == "mock" or "YOUR_STAGING" in self.mid:
            logger.info(f"[PAYTM MOCK] Refund processed for order {order_id}, amount ₹{amount_rupees}")
            return {
                "success": True,
                "refund_id": f"MOCK_REF_{ref_id}",
                "status": "TXN_SUCCESS",
                "amount": amount_rupees,
                "is_mock": True
            }

        body = {
            "mid": self.mid,
            "txnType": "REFUND",
            "orderId": order_id,
            "txnId": txn_id,
            "refId": ref_id,
            "refundAmount": amount_rupees
        }
        body_json = json.dumps(body)
        signature = generate_checksum_sha256(body_json, self.key)

        paytm_params = {
            "body": body,
            "head": {"signature": signature}
        }

        url = f"{self.host}/refund/apply"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=paytm_params)
            data = resp.json()

        b = data.get("body", {})
        r_info = b.get("resultInfo", {})
        is_success = r_info.get("resultStatus") == "TXN_SUCCESS"
        return {
            "success": is_success,
            "refund_id": b.get("refundId"),
            "status": r_info.get("resultStatus"),
            "result_msg": r_info.get("resultMsg"),
            "is_mock": False
        }

paytm_provider = PaytmProvider()

