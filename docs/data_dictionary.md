# Data Dictionary - Telemetry and Dispatch Variables

This document defines the variables used inside the Machine Learning (ML) models and the Decision Support System (DSS) business logic.

| Variable Name | Data Type | Source | Definition / Measurement | DSS Constraint |
|---|---|---|---|---|
| `wind_speed` | float | Telemetry | Wind speed in meters per second (m/s). | Hard Reject if > 12.0 m/s |
| `battery_remaining` | float | Telemetry | Drone battery percentage remaining (0.0 to 100.0). | Hard Reject if < 20.0% (Normal)<br>Reject if < 30.0% (Busy Day) |
| `actual_carry_weight` | float | Order Specs | Weight of the package being transported in kilograms (kg). | Hard Reject if > 5.0 kg |
| `payload_type` | string | Order Specs | Category of item: `medical`, `food`, `standard`, `fragile`. | Evaluated in preprocessing pipeline |
| `altitude` | float | Telemetry | Flying altitude of the drone in meters (m). | - |
| `distance_flown` | float | Order Specs | Total flight distance required to complete delivery (km). | - |
| `gps_accuracy` | float | Telemetry | GPS accuracy measurement. Lower values indicate high accuracy. | - |
| `obstacles_encountered`| integer | Telemetry | Number of obstacles encountered during flight. | - |
| `busy_day` | boolean | Admin Config | Indicates peak demand periods. Adjusts DSS safety margins. | Activates stricter logic thresholds |
| `flight_outcome` | integer | Target | Binary target: 1 = Complete (Success), 0 = Non-complete (Failure). | Predicted by ML models |
| `success_probability` | float | ML Output | Predicted probability that flight will complete successfully. | Reject if < 60% (Normal)<br>Reject if < 75% (Busy Day) |
