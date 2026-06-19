import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_list_drones():
    response = client.get("/api/v1/drones/")
    assert response.status_code == 200
    assert len(response.json()) > 0
    assert "drone_id" in response.json()[0]

def test_predict_mock():
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
    order_payload = {
        "client_name": "Test Client",
        "destination": "Location A",
        "weight": 2.0,
        "payload_type": "food",
        "distance": 3.5
    }
    response = client.post("/api/v1/orders/", json=order_payload)
    assert response.status_code == 200
    order_data = response.json()
    assert order_data["client_name"] == "Test Client"
    assert "id" in order_data
    assert order_data["status"] == "pending"

    # List orders
    list_response = client.get("/api/v1/orders/")
    assert list_response.status_code == 200
    orders = list_response.json()
    assert len(orders) > 0
    assert any(o["id"] == order_data["id"] for o in orders)

def test_admin_status():
    response = client.get("/api/v1/admin/status")
    assert response.status_code == 200
    data = response.json()
    assert "busy_day" in data
    assert "system_status" in data

    # Update state
    update_payload = {
        "busy_day": True,
        "system_status": "maintenance"
    }
    post_response = client.post("/api/v1/admin/status", json=update_payload)
    assert post_response.status_code == 200
    updated_data = post_response.json()
    assert updated_data["busy_day"] is True
    assert updated_data["system_status"] == "maintenance"

