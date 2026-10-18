"""
API Integration Tests:
Tests authentication, transaction lifecycle, budget calculation,
overview aggregation, and report generation via TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.services.seed_data import seed_database

@pytest.fixture(scope="session")
def client():
    # Setup tables and seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_and_token(client):
    response = client.post("/api/v1/auth/login", data={"username": "demo@finsense.ai", "password": "finsense123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "demo@finsense.ai"

def test_get_current_user_me(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "demo@finsense.ai", "password": "finsense123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "demo@finsense.ai"

def test_overview_endpoint(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "demo@finsense.ai", "password": "finsense123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "liquid_balance" in data
    assert "total_income" in data
    assert "total_expenses" in data
    assert "recommendations" in data
    assert len(data["recent_transactions"]) > 0

def test_transactions_crud(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "demo@finsense.ai", "password": "finsense123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List
    list_res = client.get("/api/v1/transactions?limit=5", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["transactions"]) <= 5

    # 2. Create
    create_payload = {
        "account_id": 1,
        "date": "2026-10-18",
        "amount": 450.0,
        "transaction_type": "expense",
        "description": "Starbucks Coffee",
        "merchant": "Starbucks",
        "payment_method": "UPI"
    }
    create_res = client.post("/api/v1/transactions", json=create_payload, headers=headers)
    assert create_res.status_code == 200
    created_tx = create_res.json()
    assert created_tx["amount"] == 450.0
    tx_id = created_tx["id"]

    # 3. Update
    update_res = client.put(f"/api/v1/transactions/{tx_id}", json={"description": "Starbucks Iced Latte"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Starbucks Iced Latte"

    # 4. Delete
    del_res = client.delete(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert del_res.status_code == 200

def test_budgets_and_prolog(client):
    login_res = client.post("/api/v1/auth/login", data={"username": "demo@finsense.ai", "password": "finsense123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/budgets", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "budgets" in data
    assert "burn_rate" in data
    assert "prolog_findings" in data

def test_system_diagnostics(client):
    res = client.get("/api/v1/settings/system-diagnostics")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Operational"
    assert len(data["modules"]) == 10
