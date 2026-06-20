# pyrefly: ignore [missing-import]
import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.database import SessionLocal
from backend.models.user import UserModel

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_api_test_users():
    # Setup: clean up any test users
    db = SessionLocal()
    try:
        for role in ["admin", "dispatcher", "customer"]:
            email = f"api_test_{role}@example.com"
            user = db.query(UserModel).filter(UserModel.email == email).first()
            if user:
                db.delete(user)
        db.commit()
    finally:
        db.close()
    
    yield
    
    # Teardown: clean up test users again
    db = SessionLocal()
    try:
        for role in ["admin", "dispatcher", "customer"]:
            email = f"api_test_{role}@example.com"
            user = db.query(UserModel).filter(UserModel.email == email).first()
            if user:
                db.delete(user)
        db.commit()
    finally:
        db.close()

def _get_auth_headers(role: str):
    email = f"api_test_{role}@example.com"
    # Register user
    client.post("/api/v1/auth/register", json={
        "username": f"API Test {role}",
        "email": email,
        "password": "testpassword123",
        "role": role
    })
    # Login user
    response = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "testpassword123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_list_drones():
    headers = _get_auth_headers("customer")
    response = client.get("/api/v1/drones/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0
    assert "drone_id" in response.json()[0]

def test_predict_mock():
    # Predict is public or doesn't have custom role-guards yet
    payload = {
        "telemetry": {
            "wind_speed": 4.5,
            "battery_remaining": 95.0,
            "actual_carry_weight": 1.5,
            "payload_type": "medical",
            "altitude": 120.0,
            "distance_flown": 3.2,
            "gps_accuracy": 1.2,
            "obstacles_encountered": 0
        },
        "model_type": "logistic"
    }
    response = client.post("/api/v1/predict/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "success_probability" in data
    assert "prediction" in data
    assert "risk_score" in data

def test_dss_evaluation():
    payload = {
        "telemetry": {
            "wind_speed": 15.0, # Exceeds limit
            "battery_remaining": 90.0,
            "actual_carry_weight": 1.0,
            "payload_type": "medical",
            "altitude": 100.0,
            "distance_flown": 2.0,
            "gps_accuracy": 1.0,
            "obstacles_encountered": 0
        },
        "busy_day": False
    }
    response = client.post("/api/v1/predict/dss-evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dss_approved"] is False
    assert "Rejected" in data["decision_reason"]

def test_create_and_list_orders():
    headers = _get_auth_headers("customer")
    order_payload = {
        "client_name": "Test Client",
        "destination": "Location A",
        "weight": 2.0,
        "payload_type": "food",
        "distance": 3.5
    }
    response = client.post("/api/v1/orders/", json=order_payload, headers=headers)
    assert response.status_code == 200
    order_data = response.json()
    assert order_data["client_name"] == "Test Client"
    assert "id" in order_data
    assert order_data["status"] == "pending"

    # List orders
    list_response = client.get("/api/v1/orders/", headers=headers)
    assert list_response.status_code == 200
    orders = list_response.json()
    assert len(orders) > 0
    assert any(o["id"] == order_data["id"] for o in orders)

def test_admin_status():
    customer_headers = _get_auth_headers("customer")
    admin_headers = _get_auth_headers("admin")
    
    # Get status is allowed for any user
    response = client.get("/api/v1/admin/status", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert "busy_day" in data
    assert "system_status" in data

    # Update state requires admin role
    update_payload = {
        "busy_day": True,
        "system_status": "maintenance"
    }
    # Customer should be rejected
    post_response_customer = client.post("/api/v1/admin/status", json=update_payload, headers=customer_headers)
    assert post_response_customer.status_code == 403
    
    # Admin should be allowed
    post_response_admin = client.post("/api/v1/admin/status", json=update_payload, headers=admin_headers)
    assert post_response_admin.status_code == 200
    updated_data = post_response_admin.json()
    assert updated_data["busy_day"] is True
    assert updated_data["system_status"] == "maintenance"

def test_get_and_update_drone():
    customer_headers = _get_auth_headers("customer")
    dispatcher_headers = _get_auth_headers("dispatcher")
    
    # Test GET single drone (drone_id=1 should exist from our database seed or fallback)
    response = client.get("/api/v1/drones/1", headers=customer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["drone_id"] == 1
    assert "status" in data
    assert "battery" in data

    # Test POST update status
    # Customer should be forbidden
    update_response_customer = client.post("/api/v1/drones/1/update-status?status=busy&battery=85.0", headers=customer_headers)
    assert update_response_customer.status_code == 403
    
    # Dispatcher should be allowed
    update_response_dispatcher = client.post("/api/v1/drones/1/update-status?status=busy&battery=85.0", headers=dispatcher_headers)
    assert update_response_dispatcher.status_code == 200
    update_data = update_response_dispatcher.json()
    assert update_data["message"] == "Status updated successfully"
    assert update_data["drone"]["drone_id"] == 1
    assert update_data["drone"]["status"] == "busy"
    assert update_data["drone"]["battery"] == 85.0



