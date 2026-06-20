import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.database import SessionLocal
from backend.models.user import UserModel

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_user():
    # Setup: clean up the test user if exists
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.email == "test_auth_user@example.com").first()
        if user:
            db.delete(user)
            db.commit()
    finally:
        db.close()
    
    yield
    
    # Teardown: clean up the test user again
    db = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.email == "test_auth_user@example.com").first()
        if user:
            db.delete(user)
            db.commit()
    finally:
        db.close()

def test_register_user():
    payload = {
        "username": "Test Auth User",
        "email": "test_auth_user@example.com",
        "password": "securepassword123",
        "role": "customer"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "Test Auth User"
    assert data["email"] == "test_auth_user@example.com"
    assert data["role"] == "customer"
    assert "id" in data
    assert "hashed_password" not in data

def test_register_duplicate_email():
    payload = {
        "username": "Test Auth User",
        "email": "test_auth_user@example.com",
        "password": "securepassword123",
        "role": "customer"
    }
    response1 = client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 201

    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Email already registered"

def test_register_invalid_role():
    payload = {
        "username": "Test Auth User",
        "email": "test_auth_user@example.com",
        "password": "securepassword123",
        "role": "invalid_role"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "Invalid role" in response.json()["detail"]

def test_login_and_get_me():
    # 1. Register
    reg_payload = {
        "username": "Test Auth User",
        "email": "test_auth_user@example.com",
        "password": "securepassword123",
        "role": "dispatcher"
    }
    reg_response = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_response.status_code == 201

    # 2. Login
    login_payload = {
        "email": "test_auth_user@example.com",
        "password": "securepassword123"
    }
    login_response = client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"

    token = login_data["access_token"]

    # 3. Get /me with valid token
    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "test_auth_user@example.com"
    assert me_data["role"] == "dispatcher"
    assert me_data["username"] == "Test Auth User"

def test_login_incorrect_password():
    reg_payload = {
        "username": "Test Auth User",
        "email": "test_auth_user@example.com",
        "password": "securepassword123",
        "role": "dispatcher"
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "test_auth_user@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_me_unauthorized():
    response = client.get("/api/v1/auth/me")
    assert response.status_code in [401, 403]


# ─── Role-based authorization tests ─────────────────────────────────────────

def _register_and_login(role: str) -> str:
    """Helper: register a test user with the given role and return the access token."""
    email = f"rbac_test_{role}@example.com"
    db = SessionLocal()
    try:
        existing = db.query(UserModel).filter(UserModel.email == email).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    client.post("/api/v1/auth/register", json={
        "username": f"RBAC {role}",
        "email": email,
        "password": "test1234!",
        "role": role,
    })
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "test1234!"})
    return login_res.json()["access_token"]


def test_admin_status_requires_admin_role():
    """Customer and dispatcher should get 403 on POST /admin/status."""
    for role in ("customer", "dispatcher"):
        token = _register_and_login(role)
        res = client.post(
            "/api/v1/admin/status",
            json={"busy_day": True, "system_status": "active"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403, f"Expected 403 for role={role}, got {res.status_code}"


def test_admin_status_allowed_for_admin():
    """Admin role should be able to update admin status."""
    token = _register_and_login("admin")
    res = client.post(
        "/api/v1/admin/status",
        json={"busy_day": False, "system_status": "active"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200


def test_orders_list_requires_login():
    """GET /orders should reject unauthenticated requests."""
    res = client.get("/api/v1/orders/")
    assert res.status_code in [401, 403]


def test_drones_list_requires_login():
    """GET /drones should reject unauthenticated requests."""
    res = client.get("/api/v1/drones/")
    assert res.status_code in [401, 403]


def test_orders_list_accessible_to_any_authenticated_user():
    """Any authenticated user should be able to read the orders list."""
    token = _register_and_login("customer")
    res = client.get("/api/v1/orders/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200


def test_drones_list_accessible_to_any_authenticated_user():
    """Any authenticated user should be able to read the drone list."""
    token = _register_and_login("dispatcher")
    res = client.get("/api/v1/drones/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
