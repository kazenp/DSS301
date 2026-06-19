import os

class Settings:
    # API Configurations
    APP_NAME: str = "Drone Delivery DSS + ML System"
    API_V1_STR: str = "/api/v1"
    
    # Model Paths
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
    LOGISTIC_MODEL_PATH: str = os.path.join(MODEL_DIR, "logistic_model.pkl")
    RANDOM_FOREST_MODEL_PATH: str = os.path.join(MODEL_DIR, "random_forest_model.pkl")
    MODEL_METADATA_PATH: str = os.path.join(MODEL_DIR, "model_metadata.json")
    
    # DSS configurations
    # Weather limitations
    MAX_WIND_SPEED_MPS: float = 12.0  # limit in m/s
    MIN_BATTERY_PERCENT: float = 20.0 # safety battery limit
    MAX_PAYLOAD_KG: float = 5.0       # drone weight capacity

settings = Settings()
