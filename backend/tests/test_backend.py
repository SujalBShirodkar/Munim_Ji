import pytest
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.payments.paytm import generate_checksum_sha256, verify_checksum_sha256
from app.services.pooling.optimizer import optimize_pooled_order
from app.services.pooling.state_machine import VALID_TRANSITIONS

def test_paytm_checksum_generation_and_verification():
    key = "TEST_MERCHANT_KEY_1234"
    payload = '{"mid":"TESTMID","orderId":"ORDER-001","amount":"100.00"}'
    
    checksum = generate_checksum_sha256(payload, key)
    assert checksum is not None
    assert len(checksum) > 20
    
    # Valid verification
    assert verify_checksum_sha256(payload, key, checksum) is True
    
    # Tampered payload fails
    tampered = '{"mid":"TESTMID","orderId":"ORDER-001","amount":"999.00"}'
    assert verify_checksum_sha256(tampered, key, checksum) is False

def test_or_tools_pooled_optimizer():
    demands = [
        {"merchant_id": "m1", "qty": 8.0, "baseline_unit_price": 215000},
        {"merchant_id": "m2", "qty": 12.0, "baseline_unit_price": 215000},
        {"merchant_id": "m3", "qty": 30.0, "baseline_unit_price": 215000},
    ] # Total 50 bags
    
    tiers = [
        {"min_qty": 1.0, "max_qty": 9.0, "unit_price": 215000},
        {"min_qty": 10.0, "max_qty": 49.0, "unit_price": 208000},
        {"min_qty": 50.0, "max_qty": 500.0, "unit_price": 200000}, # Should pick tier 2 (50+ bags at ₹2,000)
    ]
    delivery_fee = 30000 # ₹300 in paise
    moq = 10.0

    res = optimize_pooled_order(demands, tiers, delivery_fee, moq)
    assert res["success"] is True
    assert res["total_qty"] == 50.0
    assert res["allocated_unit_price"] == 200000
    assert len(res["member_allocations"]) == 3
    
    # Check fee split sum equals total delivery fee
    total_split_fee = sum(m["fee_share"] for m in res["member_allocations"])
    assert abs(total_split_fee - delivery_fee) <= 2 # within rounding tolerance
    
    # All members must have positive net savings vs individual baseline
    for m in res["member_allocations"]:
        assert m["net_saving"] > 0
        assert m["total_payable"] < m["baseline_cost"]

def test_group_order_state_machine_valid_transitions():
    assert "THRESHOLD_MET" in VALID_TRANSITIONS["OPEN"]
    assert "CONFIRMED" in VALID_TRANSITIONS["AWAITING_CONFIRMATION"]
    assert "DELIVERED" in VALID_TRANSITIONS["DISPATCHED"]
    assert "SETTLED" in VALID_TRANSITIONS["DELIVERED"]
    
    # Invalid transitions
    assert "DELIVERED" not in VALID_TRANSITIONS["OPEN"]
    assert "SETTLED" not in VALID_TRANSITIONS["OPEN"]

def test_auto_repayment_math():
    payment_amount_paise = 520000 # Customer pays ₹5,200
    rate = 0.20 # 20%
    repay_amount = int(round(payment_amount_paise * rate))
    assert repay_amount == 104000 # Exactly ₹1,040
    
    outstanding_before = 500000 # ₹5,000
    outstanding_after = outstanding_before - repay_amount
    assert outstanding_after == 396000 # Exactly ₹3,960

