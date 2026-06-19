import pytest
from backend.model_loader import model_loader

def test_model_loader_initialization():
    # ModelLoader is initialized as singleton model_loader
    assert model_loader is not None
    assert isinstance(model_loader.metadata, dict)

def test_predict_real():
    # Ensure pkl files are loaded successfully
    assert model_loader.logistic_model is not None
    assert model_loader.rf_model is not None

    simulated_telemetry = {
        "wind_speed": 5.0,
        "battery_remaining": 85.0,
        "actual_carry_weight": 2.0,
        "payload_type": "food",
        "altitude": 120.0,
        "distance_flown": 4.5,
        "gps_accuracy": 1.5,
        "obstacles_encountered": 0
    }
    
    result = model_loader.predict(simulated_telemetry, model_type="logistic")
    assert result["success_probability"] > 0
    assert "prediction" in result
    assert result["model_used"] == "logistic"

    result_rf = model_loader.predict(simulated_telemetry, model_type="random_forest")
    assert result_rf["success_probability"] > 0
    assert "prediction" in result_rf
    assert result_rf["model_used"] == "random_forest"
