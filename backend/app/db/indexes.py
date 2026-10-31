import pymongo
from app.db.mongo import get_database
from app.core.logging import logger

async def create_indexes():
    """Create all required MongoDB indexes (2dsphere, unique, compound)."""
    db = get_database()
    logger.info("Initializing MongoDB indexes...")

    # Merchants
    await db.merchants.create_index([("location", pymongo.GEOSPHERE)], name="idx_merchant_location_2dsphere")
    await db.merchants.create_index([("phone", pymongo.ASCENDING)], unique=True, name="idx_merchant_phone_unique")

    # Products
    await db.products.create_index([("merchant_id", pymongo.ASCENDING), ("sku", pymongo.ASCENDING)], unique=True, name="idx_product_merchant_sku")

    # Transactions
    await db.transactions.create_index([("merchant_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)], name="idx_txn_merchant_created")
    await db.transactions.create_index([("paytm_order_id", pymongo.ASCENDING)], unique=True, sparse=True, name="idx_txn_order_id_unique")

    # Needs
    await db.needs.create_index([("location", pymongo.GEOSPHERE)], name="idx_needs_location_2dsphere")
    await db.needs.create_index([("merchant_id", pymongo.ASCENDING), ("status", pymongo.ASCENDING)], name="idx_needs_merchant_status")

    # Group Orders
    await db.group_orders.create_index([("sku", pymongo.ASCENDING), ("state", pymongo.ASCENDING)], name="idx_group_orders_sku_state")

    # Group Order Members
    await db.group_order_members.create_index(
        [("group_order_id", pymongo.ASCENDING), ("merchant_id", pymongo.ASCENDING)],
        unique=True,
        name="idx_group_members_unique"
    )

    # Payments
    await db.payments.create_index([("order_id", pymongo.ASCENDING)], unique=True, name="idx_payments_order_id_unique")
    await db.payments.create_index([("merchant_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)], name="idx_payments_merchant_created")

    # Credit Accounts & Repayments
    await db.credit_accounts.create_index([("merchant_id", pymongo.ASCENDING)], unique=True, name="idx_credit_account_merchant_unique")
    await db.credit_repayments.create_index([("source_payment_id", pymongo.ASCENDING)], unique=True, name="idx_repayment_source_unique")

    # Consents & Audits
    await db.consents.create_index([("merchant_id", pymongo.ASCENDING), ("type", pymongo.ASCENDING)], name="idx_consents_merchant_type")
    await db.audit_logs.create_index([("entity", pymongo.ASCENDING), ("entity_id", pymongo.ASCENDING)], name="idx_audit_entity")

    logger.info("All MongoDB indexes initialized successfully.")

