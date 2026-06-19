# Model feature columns order
TELEMETRY_FEATURE_COLUMNS = [
    "wind_speed",
    "battery_remaining",
    "actual_carry_weight",
    "altitude",
    "distance_flown",
    "gps_accuracy",
    "obstacles_encountered"
]

# Drone operation states
DRONE_STATE_IDLE = "idle"
DRONE_STATE_BUSY = "busy"
DRONE_STATE_CHARGING = "charging"
DRONE_STATE_MAINTENANCE = "maintenance"

# Order states
ORDER_STATE_PENDING = "pending"
ORDER_STATE_APPROVED = "approved"
ORDER_STATE_REJECTED = "rejected"
ORDER_STATE_DELIVERING = "delivering"
ORDER_STATE_COMPLETED = "completed"
