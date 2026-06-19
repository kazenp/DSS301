# API Specifications

FastAPI automatically generates interactive documentation at `/docs` (Swagger UI) and `/redoc` (ReDoc) when the server is running. This document summarizes the core API endpoints.

## Base URL
`http://localhost:8000/api/v1`

---

## 1. Prediction Endpoints

### Run ML Inference Only
* **URL**: `/predict/`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "telemetry": {
      "wind_speed": 5.2,
      "battery_remaining": 85.0,
      "actual_carry_weight": 1.5,
      "payload_type": "medical",
      "altitude": 120.0,
      "distance_flown": 4.5,
      "gps_accuracy": 1.2,
      "obstacles_encountered": 0
    },
    "model_type": "logistic"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "model_used": "logistic",
    "success_probability": 0.92,
    "risk_score": 0.08,
    "prediction": 1
  }
  ```

### Evaluate DSS Decision (ML + Rules)
* **URL**: `/predict/dss-evaluate`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "telemetry": {
      "wind_speed": 5.2,
      "battery_remaining": 85.0,
      "actual_carry_weight": 1.5,
      "payload_type": "medical",
      "altitude": 120.0,
      "distance_flown": 4.5,
      "gps_accuracy": 1.2,
      "obstacles_encountered": 0
    },
    "busy_day": false,
    "model_type": "logistic"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "prediction": {
      "model_used": "logistic",
      "success_probability": 0.92,
      "risk_score": 0.08,
      "prediction": 1
    },
    "dss_approved": true,
    "final_status": "APPROVED",
    "decision_reason": "Order approved for drone dispatch."
  }
  ```

---

## 2. Order Management Endpoints

### Create Delivery Request
* **URL**: `/orders/`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "client_name": "Central Pharmacy",
    "destination": "Sector 4",
    "weight": 1.8,
    "payload_type": "medical",
    "distance": 3.5
  }
  ```

### List All Orders
* **URL**: `/orders/`
* **Method**: `GET`

---

## 3. Drone Fleet Endpoints

### List Drone Fleet Status
* **URL**: `/drones/`
* **Method**: `GET`

---

## 4. Admin Management Endpoints

### Get Admin Status
* **URL**: `/admin/status`
* **Method**: `GET`

### Update Admin Configuration
* **URL**: `/admin/status`
* **Method**: `POST`
  ```json
  {
    "busy_day": true,
    "system_status": "active"
  }
  ```
