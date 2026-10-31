import os
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import random
from datetime import datetime, timedelta, timezone

# Ensure backend app is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from pymongo import MongoClient
from app.core.config import settings

def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.MONGO_DB_NAME]

    print("Dropping existing collections...")
    collections = [
        "merchants", "products", "transactions", "settlements",
        "needs", "suppliers", "supplier_quotes", "group_orders",
        "group_order_members", "payments", "credit_accounts",
        "credit_repayments", "consents", "audit_logs", "savings_records", "conversations"
    ]
    for coll in collections:
        db[coll].drop()

    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    yesterday_date = yesterday.date()

    print("Creating primary demo merchant: Sharma Chai & General Store...")
    # Mumbai Andheri East coordinates: [longitude, latitude]
    primary_coords = [72.8697, 19.1136]
    primary_merchant_id = "merchant_sharma_001"

    primary_merchant = {
        "_id": primary_merchant_id,
        "phone": "+919876543210",
        "shop_name": "Sharma Chai & General Store",
        "category": "Kirana & Tea Stall",
        "language": "hi",
        "location": {
            "type": "Point",
            "coordinates": primary_coords
        },
        "pincode": "400069",
        "kyc_status": "verified",
        "source": "simulated",
        "created_at": now - timedelta(days=120)
    }
    db.merchants.insert_one(primary_merchant)

    # 25 Neighbouring merchants
    neighbour_names = [
        ("Gupta Provision Store", "Kirana", [72.8710, 19.1142]),
        ("Sai Krupa Dairy & Grocery", "Dairy & Grocery", [72.8680, 19.1120]),
        ("Maruti Snacks & Chai", "Tea Stall", [72.8725, 19.1150]),
        ("Om Namoh Supermarket", "Supermarket", [72.8665, 19.1110]),
        ("A-One Kirana Store", "Kirana", [72.8740, 19.1165]),
        ("Mahalaxmi General Store", "General Store", [72.8650, 19.1100]),
        ("Shree Ganesh Sweets & Farsan", "Sweets & Snacks", [72.8705, 19.1128]),
        ("New Bombay Grocery", "Kirana", [72.8688, 19.1148]),
        ("Jai Hind Pan & Cold Drinks", "Kiosk", [72.8730, 19.1130]),
        ("Andheri Chai Corner", "Tea Stall", [72.8672, 19.1140]),
        ("Bharat Provision", "Kirana", [72.8715, 19.1115]),
        ("Shubh Labh Kirana", "Kirana", [72.8690, 19.1160]),
        ("Kothari Brothers Mart", "Grocery", [72.8660, 19.1155]),
        ("Vaibhav Stores", "General Store", [72.8750, 19.1125]),
        ("Sujal Enterprise & Kirana", "Kirana", [72.8645, 19.1135]),
        ("Vansh Tea & Refreshments", "Tea Stall", [72.8700, 19.1170]),
        ("Metro Kirana Bhandar", "Kirana", [72.8678, 19.1105]),
        ("Royal General Store", "General Store", [72.8720, 19.1160]),
        ("Laxmi Narayan Daily Mart", "Grocery", [72.8655, 19.1125]),
        ("Kisan Super Store", "Kirana", [72.8735, 19.1145]),
        ("Chai Sutta & Kirana Bar", "Tea Stall", [72.8692, 19.1118]),
        ("Prabhat Provision", "Kirana", [72.8682, 19.1152]),
        ("Riddhi Siddhi Mart", "General Store", [72.8712, 19.1138]),
        ("Balaji Super Market", "Supermarket", [72.8640, 19.1140]),
        ("National Grocery Hub", "Wholesale/Retail", [72.8745, 19.1158]),
    ]

    neighbour_docs = []
    for idx, (name, cat, coords) in enumerate(neighbour_names, start=2):
        m_id = f"merchant_nbr_{idx:03d}"
        phone = f"+919876543{idx:03d}"
        neighbour_docs.append({
            "_id": m_id,
            "phone": phone,
            "shop_name": name,
            "category": cat,
            "language": "hi",
            "location": {"type": "Point", "coordinates": coords},
            "pincode": "400069",
            "kyc_status": "verified",
            "source": "simulated",
            "created_at": now - timedelta(days=random.randint(60, 180))
        })
    db.merchants.insert_many(neighbour_docs)
    print(f"Inserted 1 primary merchant + {len(neighbour_docs)} neighbouring merchants.")

    # Products for Sharma Chai & General Store
    products = [
        {"sku": "SKU-SUGAR-50K", "name": "Madhur Pure Sugar (50kg Bag)", "category": "Staples", "unit": "bag", "sell_price": 215000, "cost_price": 195000, "stock_qty": 3.0, "reorder_level": 8.0}, # Low stock
        {"sku": "SKU-TEA-WAGH", "name": "Wagh Bakri Premium CTC Tea (1kg)", "category": "Beverages", "unit": "kg", "sell_price": 52000, "cost_price": 45000, "stock_qty": 4.0, "reorder_level": 10.0}, # Low stock
        {"sku": "SKU-ATTA-AASH", "name": "Aashirvaad Shudh Chakki Atta (10kg)", "category": "Staples", "unit": "bag", "sell_price": 44000, "cost_price": 39500, "stock_qty": 14.0, "reorder_level": 10.0},
        {"sku": "SKU-OIL-FORT", "name": "Fortune Refined Sunflower Oil (15L Tin)", "category": "Edible Oil", "unit": "tin", "sell_price": 185000, "cost_price": 172000, "stock_qty": 2.0, "reorder_level": 5.0}, # Low stock
        {"sku": "SKU-RICE-KOLAM", "name": "Wada Kolam Rice Grade A (25kg Bag)", "category": "Staples", "unit": "bag", "sell_price": 145000, "cost_price": 130000, "stock_qty": 18.0, "reorder_level": 10.0},
        {"sku": "SKU-MILK-AMUL", "name": "Amul Taaza Milk Toned (500ml)", "category": "Dairy", "unit": "pouch", "sell_price": 2700, "cost_price": 2400, "stock_qty": 25.0, "reorder_level": 15.0},
        {"sku": "SKU-PARLE-G", "name": "Parle-G Glucose Biscuits (800g)", "category": "Snacks", "unit": "pack", "sell_price": 8500, "cost_price": 7200, "stock_qty": 35.0, "reorder_level": 20.0},
        {"sku": "SKU-CHAI-CUP", "name": "Cutting Masala Chai (Fresh)", "category": "Beverages", "unit": "cup", "sell_price": 1200, "cost_price": 450, "stock_qty": 500.0, "reorder_level": 50.0},
        {"sku": "SKU-SPECIAL-CHAI", "name": "Special Adrak Elaichi Chai (Kulhad)", "category": "Beverages", "unit": "cup", "sell_price": 2000, "cost_price": 750, "stock_qty": 300.0, "reorder_level": 30.0},
        {"sku": "SKU-BUN-MASKA", "name": "Butter Maska Bun", "category": "Snacks", "unit": "piece", "sell_price": 3000, "cost_price": 1200, "stock_qty": 45.0, "reorder_level": 15.0},
    ]

    for p in products:
        p["merchant_id"] = primary_merchant_id
    db.products.insert_many(products)
    print("Inserted product catalogue for primary merchant.")

    # 90 Days of transactions for primary merchant
    # STRICT REQUIREMENT: Yesterday's total must equal EXACTLY ₹8,400 (840000 paise)
    print("Generating 90 days of transactions (yesterday exactly ₹8,400)...")
    transactions = []
    settlements = []

    # 1. Yesterday's transactions (total = 840,000 paise)
    # We will generate 34 realistic transactions on yesterday that sum to exactly 840,000 paise
    yesterday_amounts = [
        1200, 1200, 2400, 3000, 1200, 4400, 2700, 8500, 1200, 2000,
        3000, 52000, 1200, 2400, 4400, 1200, 2000, 2700, 1200, 44000,
        1200, 2000, 3000, 1200, 2400, 1200, 145000, 1200, 2000, 3000,
        52000, 185000, 215000
    ]
    # Current sum of above:
    current_subtotal = sum(yesterday_amounts) # e.g. 748,000
    needed_remainder = 840000 - current_subtotal
    yesterday_amounts.append(needed_remainder)
    assert sum(yesterday_amounts) == 840000, f"Sum must be 840000 paise, got {sum(yesterday_amounts)}"

    # Distribute over morning, peak, afternoon, evening
    hours_dist = [7, 7, 8, 8, 8, 9, 9, 10, 10, 11, 11, 12, 13, 14, 15, 16, 17, 17, 18, 18, 18, 19, 19, 20, 20, 20, 21, 21, 21, 22, 10, 14, 18, 20]
    for idx, (amt, hr) in enumerate(zip(yesterday_amounts, hours_dist)):
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        txn_time = datetime(yesterday.year, yesterday.month, yesterday.day, hr, minute, second, tzinfo=timezone.utc)
        transactions.append({
            "merchant_id": primary_merchant_id,
            "paytm_order_id": f"TXN-YEST-{idx:03d}",
            "txn_id": f"PAYTM-YEST-{idx:04d}",
            "amount": amt,
            "status": "SUCCESS",
            "payment_mode": "UPI" if random.random() < 0.85 else "QR_SOUNDBOX",
            "source": "simulated",
            "created_at": txn_time
        })

    # Today's morning transactions (so far ₹3,240)
    today_amounts = [1200, 2400, 3000, 1200, 2000, 52000, 2700, 8500, 1200, 2400, 44000, 1200, 3000, 2000, 200000]
    for idx, amt in enumerate(today_amounts):
        hr = random.randint(7, 11)
        minute = random.randint(0, 59)
        txn_time = datetime(now.year, now.month, now.day, hr, minute, random.randint(0, 59), tzinfo=timezone.utc)
        transactions.append({
            "merchant_id": primary_merchant_id,
            "paytm_order_id": f"TXN-TODAY-{idx:03d}",
            "txn_id": f"PAYTM-TODAY-{idx:04d}",
            "amount": amt,
            "status": "SUCCESS",
            "payment_mode": "UPI",
            "source": "simulated",
            "created_at": txn_time
        })

    # Past 2 to 90 days
    for day_offset in range(2, 91):
        d = now - timedelta(days=day_offset)
        # Average daily sales between ₹6,500 and ₹11,000 (weekends slightly higher)
        is_weekend = d.weekday() >= 5
        base_target = random.randint(7800, 10800) if is_weekend else random.randint(6200, 8800)
        daily_target_paise = base_target * 100

        curr_day_sum = 0
        txns_count = random.randint(25, 42)
        for t_idx in range(txns_count):
            if t_idx == txns_count - 1:
                t_amt = max(1200, daily_target_paise - curr_day_sum)
            else:
                t_amt = random.choice([1200, 2000, 2400, 3000, 4400, 8500, 21500, 44000, 52000])
            curr_day_sum += t_amt
            hr = random.choice([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22])
            txn_time = datetime(d.year, d.month, d.day, hr, random.randint(0, 59), random.randint(0, 59), tzinfo=timezone.utc)
            transactions.append({
                "merchant_id": primary_merchant_id,
                "paytm_order_id": f"TXN-D{day_offset}-{t_idx:03d}",
                "txn_id": f"PAYTM-D{day_offset}-{t_idx:04d}",
                "amount": t_amt,
                "status": "SUCCESS",
                "payment_mode": "UPI" if random.random() < 0.8 else "CARD",
                "source": "simulated",
                "created_at": txn_time
            })

        # Add a settlement for this day
        settlements.append({
            "merchant_id": primary_merchant_id,
            "amount": curr_day_sum,
            "status": "SETTLED",
            "expected_date": d + timedelta(days=1),
            "settled_at": d + timedelta(days=1, hours=6),
            "created_at": d
        })

    # Pending settlement for yesterday
    settlements.append({
        "merchant_id": primary_merchant_id,
        "amount": 840000, # ₹8,400
        "status": "PENDING",
        "expected_date": now + timedelta(hours=6),
        "settled_at": None,
        "created_at": yesterday
    })

    db.transactions.insert_many(transactions)
    db.settlements.insert_many(settlements)
    print(f"Inserted {len(transactions)} transactions and {len(settlements)} settlements.")

    # 4 Suppliers with tiered quotes
    suppliers = [
        {"_id": "supp_maha_agro", "name": "Maharashtra Agro Wholesale Ltd", "rating": 4.9, "contact": "+919820011223", "service_radius_km": 15.0, "created_at": now},
        {"_id": "supp_mumbai_kirana_dist", "name": "Mumbai Central Kirana Distributors", "rating": 4.7, "contact": "+919820022334", "service_radius_km": 12.0, "created_at": now},
        {"_id": "supp_western_sugar", "name": "Western India Sugar Syndicate", "rating": 4.8, "contact": "+919820033445", "service_radius_km": 20.0, "created_at": now},
        {"_id": "supp_golden_grains", "name": "Golden Grains & Oil Mills", "rating": 4.6, "contact": "+919820044556", "service_radius_km": 10.0, "created_at": now},
    ]
    db.suppliers.insert_many(suppliers)

    # Supplier quotes with tiered volume pricing
    # Notice: Sugar baseline price for a single shop is ₹2,150/bag.
    # Group tier: 1-9 bags ₹2,150, 10-49 bags ₹2,050, 50+ bags ₹1,980.
    # Delivery fee split across 12 shops brings total per bag to ~₹2,105, yielding ₹45/bag saving!
    quotes = [
        {
            "_id": "quote_sugar_001",
            "supplier_id": "supp_western_sugar",
            "sku": "SKU-SUGAR-50K",
            "product_name": "Madhur Pure Sugar (50kg Bag)",
            "unit": "bag",
            "tiers": [
                {"min_qty": 1.0, "max_qty": 9.0, "unit_price": 215000},
                {"min_qty": 10.0, "max_qty": 49.0, "unit_price": 208000},
                {"min_qty": 50.0, "max_qty": 500.0, "unit_price": 200000}, # Save ₹150/bag on large pool
            ],
            "delivery_fee": 30000, # ₹300 total delivery fee split among participants
            "moq": 10.0,
            "valid_till": now + timedelta(days=5),
            "serviceable_pincodes": ["400069", "400059", "400093", "400099"],
            "created_at": now
        },
        {
            "_id": "quote_tea_001",
            "supplier_id": "supp_mumbai_kirana_dist",
            "sku": "SKU-TEA-WAGH",
            "product_name": "Wagh Bakri Premium CTC Tea (1kg)",
            "unit": "kg",
            "tiers": [
                {"min_qty": 1.0, "max_qty": 19.0, "unit_price": 52000},
                {"min_qty": 20.0, "max_qty": 99.0, "unit_price": 47500},
                {"min_qty": 100.0, "max_qty": 1000.0, "unit_price": 44000},
            ],
            "delivery_fee": 15000,
            "moq": 20.0,
            "valid_till": now + timedelta(days=7),
            "serviceable_pincodes": ["400069", "400059", "400093"],
            "created_at": now
        },
        {
            "_id": "quote_oil_001",
            "supplier_id": "supp_golden_grains",
            "sku": "SKU-OIL-FORT",
            "product_name": "Fortune Refined Sunflower Oil (15L Tin)",
            "unit": "tin",
            "tiers": [
                {"min_qty": 1.0, "max_qty": 9.0, "unit_price": 185000},
                {"min_qty": 10.0, "max_qty": 39.0, "unit_price": 175000},
                {"min_qty": 40.0, "max_qty": 200.0, "unit_price": 168000},
            ],
            "delivery_fee": 25000,
            "moq": 10.0,
            "valid_till": now + timedelta(days=4),
            "serviceable_pincodes": ["400069", "400059", "400093"],
            "created_at": now
        },
        {
            "_id": "quote_atta_001",
            "supplier_id": "supp_maha_agro",
            "sku": "SKU-ATTA-AASH",
            "product_name": "Aashirvaad Shudh Chakki Atta (10kg)",
            "unit": "bag",
            "tiers": [
                {"min_qty": 1.0, "max_qty": 19.0, "unit_price": 44000},
                {"min_qty": 20.0, "max_qty": 59.0, "unit_price": 39000},
                {"min_qty": 60.0, "max_qty": 300.0, "unit_price": 36000},
            ],
            "delivery_fee": 20000,
            "moq": 20.0,
            "valid_till": now + timedelta(days=6),
            "serviceable_pincodes": ["400069", "400059"],
            "created_at": now
        }
    ]
    db.supplier_quotes.insert_many(quotes)
    print("Inserted 4 suppliers and tiered wholesale quotes.")

    # 1 Active Group Order: Sugar Pool (9 of 12 shops joined, 72 of 100 bags met)
    active_pool_id = "go_sugar_active_001"
    active_group_order = {
        "_id": active_pool_id,
        "sku": "SKU-SUGAR-50K",
        "product_name": "Madhur Pure Sugar (50kg Bag)",
        "unit": "bag",
        "supplier_id": "supp_western_sugar",
        "quote_id": "quote_sugar_001",
        "state": "OPEN",
        "threshold_qty": 100.0, # Target 100 bags to unlock ₹2,000/bag tier
        "current_qty": 72.0,
        "deadline": now + timedelta(hours=28),
        "optimizer_result": {
            "allocated_tier": "50+ bags",
            "unit_price": 200000,
            "delivery_fee_total": 30000,
            "avg_saving_per_bag": 4500 # ₹45 saving per bag!
        },
        "state_history": [
            {"from_state": None, "to_state": "OPEN", "reason": "Pooled order initialized", "at": now - timedelta(hours=14)}
        ],
        "created_at": now - timedelta(hours=14)
    }
    db.group_orders.insert_one(active_group_order)

    # Insert 9 joined member shops for this active sugar pool
    sugar_members = []
    # Pick 9 neighbouring merchants
    for i in range(2, 11):
        m_id = f"merchant_nbr_{i:03d}"
        shop = neighbour_names[i-2][0]
        qty = 8.0 # 9 * 8 = 72 bags
        unit_price = 200000 # ₹2,000
        fee_share = 3300 # ₹33
        total = int((qty * unit_price) + fee_share) # ₹16,033
        baseline = int(qty * 215000) # ₹17,200
        saving = baseline - total # ~₹1,167 total (~₹145/bag saving)
        sugar_members.append({
            "group_order_id": active_pool_id,
            "merchant_id": m_id,
            "shop_name": shop,
            "qty": qty,
            "unit_price": unit_price,
            "fee_share": fee_share,
            "total_payable": total,
            "baseline_price": baseline,
            "estimated_saving": saving,
            "status": "confirmed",
            "consent_id": f"consent_{m_id}_{active_pool_id}",
            "payment_id": f"pay_{m_id}_{active_pool_id}",
            "created_at": now - timedelta(hours=12 - i)
        })
    db.group_order_members.insert_many(sugar_members)

    # 1 Completed Group Order for tea to populate Measured Savings
    past_pool_id = "go_tea_completed_001"
    past_group_order = {
        "_id": past_pool_id,
        "sku": "SKU-TEA-WAGH",
        "product_name": "Wagh Bakri Premium CTC Tea (1kg)",
        "unit": "kg",
        "supplier_id": "supp_mumbai_kirana_dist",
        "quote_id": "quote_tea_001",
        "state": "DELIVERED",
        "threshold_qty": 100.0,
        "current_qty": 115.0,
        "deadline": now - timedelta(days=12),
        "optimizer_result": {
            "allocated_tier": "100+ kg",
            "unit_price": 44000,
            "delivery_fee_total": 15000,
            "total_saving": 920000
        },
        "state_history": [
            {"from_state": "OPEN", "to_state": "CONFIRMED", "at": now - timedelta(days=14)},
            {"from_state": "CONFIRMED", "to_state": "DISPATCHED", "at": now - timedelta(days=13)},
            {"from_state": "DISPATCHED", "to_state": "DELIVERED", "at": now - timedelta(days=12)},
        ],
        "created_at": now - timedelta(days=16)
    }
    db.group_orders.insert_one(past_group_order)

    # Sharma store participated in this completed group order
    sharma_past_member = {
        "group_order_id": past_pool_id,
        "merchant_id": primary_merchant_id,
        "shop_name": "Sharma Chai & General Store",
        "qty": 25.0,
        "unit_price": 44000,
        "fee_share": 3200,
        "total_payable": 1103200, # ₹11,032
        "baseline_price": 1300000, # ₹13,000 (would have paid ₹520/kg)
        "estimated_saving": 196800, # ₹1,968
        "status": "received",
        "consent_id": f"consent_{primary_merchant_id}_{past_pool_id}",
        "payment_id": f"PAYTM-DELIV-001",
        "actual_cost_after_delivery": 1103200,
        "created_at": now - timedelta(days=14)
    }
    db.group_order_members.insert_one(sharma_past_member)

    # Measured savings record for Sharma store
    db.savings_records.insert_one({
        "merchant_id": primary_merchant_id,
        "group_order_id": past_pool_id,
        "product_name": "Wagh Bakri Premium CTC Tea (1kg)",
        "baseline_cost": 1300000, # ₹13,000
        "actual_cost": 1103200,   # ₹11,032
        "net_saving": 196800,     # ₹1,968 Measured
        "kind": "measured",
        "created_at": now - timedelta(days=12)
    })

    # Instant Credit Account for Sharma Store
    # Limit: ₹5,000 (500,000 paise).
    # Pre-existing outstanding balance of ₹3,320 (332,000 paise) to match the UX brief example!
    # "progress bar ₹5,000 → ₹3,320 outstanding"
    credit_account = {
        "_id": "credit_sharma_001",
        "merchant_id": primary_merchant_id,
        "limit": 500000, # ₹5,000
        "outstanding": 332000, # ₹3,320
        "repayment_rate": 0.20, # 20%
        "status": "ACTIVE",
        "partner": "MockNBFC (Simulated Partner)",
        "disbursed_at": now - timedelta(days=3),
        "created_at": now - timedelta(days=15)
    }
    db.credit_accounts.insert_one(credit_account)

    # Repayment ledger records showing earlier auto-repayments
    db.credit_repayments.insert_many([
        {
            "account_id": "credit_sharma_001",
            "merchant_id": primary_merchant_id,
            "source_payment_id": "TXN-YEST-031",
            "amount": 104000, # ₹1,040 (20% of ₹5,200)
            "outstanding_before": 500000,
            "outstanding_after": 396000,
            "created_at": yesterday - timedelta(hours=4)
        },
        {
            "account_id": "credit_sharma_001",
            "merchant_id": primary_merchant_id,
            "source_payment_id": "TXN-YEST-032",
            "amount": 64000, # ₹640 (20% of ₹3,200)
            "outstanding_before": 396000,
            "outstanding_after": 332000,
            "created_at": yesterday - timedelta(hours=1)
        }
    ])
    print("Inserted Instant Credit account (limit ₹5,000, outstanding ₹3,320).")

    print("\n================ SEED COMPLETE ================")
    print("Primary Merchant: Sharma Chai & General Store (phone: +919876543210)")
    # Verify yesterday's sales total
    yest_txns = list(db.transactions.find({
        "merchant_id": primary_merchant_id,
        "created_at": {
            "$gte": datetime(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0, tzinfo=timezone.utc),
            "$lt": datetime(yesterday.year, yesterday.month, yesterday.day, 23, 59, 59, 999999, tzinfo=timezone.utc),
        }
    }))
    total_yest = sum(t["amount"] for t in yest_txns)
    print(f"VERIFIED: Yesterday's sales total = ₹{total_yest / 100:,.2f} ({total_yest} paise). EXACT MATCH: {total_yest == 840000}!")
    print("===============================================\n")

if __name__ == "__main__":
    seed_database()
