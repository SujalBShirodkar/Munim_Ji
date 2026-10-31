import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from app.main import app
from app.core.security import get_password_hash, verify_password

def test_password_hashing():
    pwd = "mypassword123"
    pwd_hash, salt = get_password_hash(pwd)
    assert verify_password(pwd, pwd_hash, salt) is True
    assert verify_password("wrongpassword", pwd_hash, salt) is False

@pytest.mark.asyncio
async def test_register_and_login_flow():
    # In-memory mock database for isolated fast testing
    mock_merchants = {}
    mock_products = []
    mock_credit = []

    async def mock_find_one(query):
        if "$or" in query:
            for cond in query["$or"]:
                for m in mock_merchants.values():
                    match = True
                    for k, v in cond.items():
                        if k == "_id" and v is None:
                            match = False
                            break
                        if m.get(k) != v:
                            match = False
                            break
                    if match:
                        return m
            return None
        phone = query.get("phone")
        if phone:
            for m in mock_merchants.values():
                if m.get("phone") == phone:
                    return m
        _id = query.get("_id")
        if _id:
            return mock_merchants.get(_id)
        return None

    async def mock_insert_one(doc):
        mock_merchants[doc["_id"]] = doc
        return True

    async def mock_insert_many(docs):
        mock_products.extend(docs)
        return True

    mock_db = AsyncMock()
    mock_db.merchants.find_one = mock_find_one
    mock_db.merchants.insert_one = mock_insert_one
    mock_db.products.insert_many = mock_insert_many
    mock_db.credit_accounts.insert_one = AsyncMock(return_value=True)

    with patch("app.routers.auth.get_database", return_value=mock_db):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # 1. Register new merchant
            reg_payload = {
                "name": "Ramesh Gupta",
                "shop_name": "Gupta Kirana Store",
                "phone": "9812345678",
                "password": "guptapassword",
                "category": "Kirana & General Store"
            }
            res_reg = await ac.post("/auth/register", json=reg_payload)
            assert res_reg.status_code == 200
            data_reg = res_reg.json()
            assert data_reg["success"] is True
            assert "access_token" in data_reg
            assert data_reg["merchant"]["name"] == "Ramesh Gupta"
            assert data_reg["merchant"]["shop_name"] == "Gupta Kirana Store"

            # 2. Duplicate registration attempt should be rejected
            res_dup = await ac.post("/auth/register", json=reg_payload)
            assert res_dup.status_code == 400

            # 3. Login with correct password
            login_payload = {
                "phone": "9812345678",
                "password": "guptapassword"
            }
            res_login = await ac.post("/auth/login", json=login_payload)
            assert res_login.status_code == 200
            data_login = res_login.json()
            assert data_login["success"] is True
            assert data_login["merchant"]["name"] == "Ramesh Gupta"

            # 4. Login with incorrect password should be rejected
            wrong_login = {
                "phone": "9812345678",
                "password": "wrong_password"
            }
            res_wrong = await ac.post("/auth/login", json=wrong_login)
            assert res_wrong.status_code == 401

