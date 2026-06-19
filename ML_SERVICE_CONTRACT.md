# ML Service Contract - Drone Delivery DSS System

## 1. Purpose
Tài liệu này mô tả hợp đồng giữa backend chính và ML service riêng trong hệ thống drone delivery.

Mục tiêu:
- Backend chính biết cách gọi ML service.
- ML service biết phải nhận input nào và trả output nào.
- Dữ liệu prediction ổn định, có thể dùng cho DSS và dashboard.
- Sau này thay model mới vẫn giữ được giao tiếp ổn định.

## 2. Service Scope
ML service chỉ xử lý:
- Nhận input đã được chuẩn hóa từ backend.
- Chạy inference model.
- Trả prediction, score, risk, ETA, hoặc recommendation features.
- Không xử lý auth business, order CRUD, drone CRUD, assignment logic, hay dashboard logic.

## 3. General Rules
- Service phải trả response JSON.
- Mỗi request phải có `request_id`.
- Mỗi prediction phải có `model_version`.
- Không trả stack trace ra client.
- Có health check.
- Có timeout xử lý inference.
- Có structured error response.

## 4. Base URL
- Dev: `/ml-api/v1`
- All endpoints are under this base path.

## 5. Common Headers
- `Content-Type: application/json`
- `X-Request-Id: <uuid>` optional but recommended
- `Authorization` only if service is protected internally

## 6. Response Format

### Success
```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "string",
  "error_code": "string",
  "details": {}
}
```

## 7. Shared Enums

### Risk Level
- `low`
- `medium`
- `high`

### Prediction Status
- `ok`
- `fallback`
- `failed`

### Model Output Type
- `recommendation`
- `scoring`
- `eta`
- `risk_assessment`

## 8. Health APIs

### GET `/health`
Basic liveness check.

Response:
```json
{
  "success": true,
  "message": "Service is alive",
  "data": {
    "status": "ok"
  }
}
```

### GET `/ready`
Readiness check. Returns ready only when model is loaded.

Response:
```json
{
  "success": true,
  "message": "Service is ready",
  "data": {
    "status": "ready",
    "model_loaded": true,
    "model_version": "v1.0.0"
  }
}
```

### GET `/metrics`
Optional metrics endpoint.

Response:
```json
{
  "success": true,
  "message": "Metrics fetched",
  "data": {
    "prediction_count": 1200,
    "error_count": 12,
    "avg_latency_ms": 48
  }
}
```

## 9. Prediction Endpoint

### POST `/predict`
Main inference endpoint.

Purpose:
- Backend chính gửi order + drone context sang ML service.
- ML service trả recommendation features phục vụ DSS hoặc scoring.

Request:
```json
{
  "request_id": "uuid",
  "order": {
    "order_id": "uuid",
    "pickup_location": {
      "lat": 10.123,
      "lng": 106.123
    },
    "dropoff_location": {
      "lat": 10.125,
      "lng": 106.130
    },
    "package_weight": 1.5,
    "priority": "normal"
  },
  "candidate_drones": [
    {
      "drone_id": "uuid",
      "battery_level": 92,
      "payload_capacity": 3.0,
      "current_location": {
        "lat": 10.1,
        "lng": 106.1
      },
      "status": "available",
      "distance_to_dropoff_km": 2.4,
      "signal_strength": 87
    }
  ],
  "context": {
    "weather_score": 0.8,
    "traffic_score": 0.7,
    "no_fly_zone_score": 0.9
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Prediction completed",
  "data": {
    "request_id": "uuid",
    "model_version": "v1.0.0",
    "prediction_status": "ok",
    "recommended_drone_id": "uuid",
    "score": 0.91,
    "risk_level": "low",
    "estimated_eta_minutes": 18,
    "ranking": [
      {
        "drone_id": "uuid",
        "score": 0.91
      }
    ],
    "explanations": [
      "Battery level is sufficient",
      "Drone is closest to the destination",
      "Payload capacity is enough"
    ],
    "latency_ms": 42
  }
}
```

## 10. Batch Prediction Endpoint

### POST `/predict/batch`
Dùng cho testing, benchmark, hoặc dashboard nội bộ.

Request:
```json
{
  "request_id": "uuid",
  "items": []
}
```

## 11. Feature Contract
Backend gửi vào ML service phải đảm bảo:
- field names ổn định,
- numeric fields đã normalize nếu cần,
- không gửi dữ liệu thiếu bắt buộc,
- candidate drones đã được lọc sơ bộ bởi backend nếu có rule cứng.

ML service phải giả định rằng:
- order đã hợp lệ,
- drone input đã đúng format,
- feature values có thể được backend tính trước.

## 12. Output Contract
ML service nên trả tối thiểu:
- `recommended_drone_id`
- `score`
- `risk_level`
- `estimated_eta_minutes`
- `model_version`
- `latency_ms`
- `explanations`

Nếu model không thể chọn drone nào, trả:
```json
{
  "success": true,
  "message": "No suitable drone found",
  "data": {
    "request_id": "uuid",
    "model_version": "v1.0.0",
    "prediction_status": "fallback",
    "recommended_drone_id": null,
    "score": null,
    "risk_level": "high",
    "estimated_eta_minutes": null,
    "ranking": [],
    "explanations": [
      "No candidate drone passed minimum constraints"
    ]
  }
}
```

## 13. Error Handling

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "details": {
    "field": "package_weight",
    "issue": "must be greater than 0"
  }
}
```

### Model Load Error
```json
{
  "success": false,
  "message": "Model not available",
  "error_code": "MODEL_NOT_LOADED",
  "details": null
}
```

### Inference Error
```json
{
  "success": false,
  "message": "Inference failed",
  "error_code": "INFERENCE_ERROR",
  "details": {
    "request_id": "uuid"
  }
}
```

### Timeout Error
```json
{
  "success": false,
  "message": "Inference timeout",
  "error_code": "INFERENCE_TIMEOUT",
  "details": {
    "timeout_ms": 2000
  }
}
```

## 14. Performance Rules
- Load model once at startup.
- Do not reload model on every request.
- Keep response time low.
- Use timeout and fallback if inference is slow.
- Support concurrent requests safely.

## 15. Versioning Rules
- Every prediction response must include `model_version`.
- If model changes, increment version.
- Backend should store `model_version` with assignment decision.
- Frontend should never depend on model internals, only on returned fields.

## 16. Logging and Traceability
ML service should log:
- request_id
- model_version
- start_time
- latency_ms
- output status
- error reason if failed

Backend should log:
- request_id
- order_id
- selected drone
- DSS result
- model version used

## 17. Backend Expectations
Backend expects ML service to be:
- stable,
- deterministic when possible,
- compatible with OpenAPI/Pydantic-style schemas,
- safe for retry,
- easy to mock in test environment.

## 18. Deployment Expectations
ML service should be deployable independently.
Recommended:
- separate container,
- separate environment variables,
- separate health checks,
- separate scaling rules.

## 19. Done Criteria
This contract is complete when:
- backend can call ML service reliably,
- ML service returns structured prediction data,
- DSS can use ML outputs directly,
- frontend never talks directly to ML service,
- the service can be replaced without changing frontend contract.