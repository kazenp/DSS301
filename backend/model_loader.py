import os
import joblib
import json
import logging
from typing import Dict, Any, Optional
import pandas as pd
from backend.config import settings

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self):
        self.logistic_model = None
        self.rf_model = None
        self.metadata = {}
        self.load_all_models()

    def load_all_models(self):
        """Load trained models and metadata from files."""
        # Load logistic model
        if os.path.exists(settings.LOGISTIC_MODEL_PATH):
            try:
                self.logistic_model = joblib.load(settings.LOGISTIC_MODEL_PATH)
                logger.info("Logistic model loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading Logistic model: {e}")
        else:
            logger.warning(f"Logistic model file not found at {settings.LOGISTIC_MODEL_PATH}")

        # Load random forest model
        if os.path.exists(settings.RANDOM_FOREST_MODEL_PATH):
            try:
                self.rf_model = joblib.load(settings.RANDOM_FOREST_MODEL_PATH)
                logger.info("Random Forest model loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading Random Forest model: {e}")
        else:
            logger.warning(f"Random Forest model file not found at {settings.RANDOM_FOREST_MODEL_PATH}")

        # Load metadata
        if os.path.exists(settings.MODEL_METADATA_PATH):
            try:
                with open(settings.MODEL_METADATA_PATH, 'r') as f:
                    self.metadata = json.load(f)
                logger.info("Model metadata loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading metadata: {e}")
        else:
            logger.warning(f"Metadata file not found at {settings.MODEL_METADATA_PATH}")

    def predict(self, features: Dict[str, Any], model_type: str = "logistic") -> Dict[str, Any]:
        """
        Run inference using the selected model.
        Returns:
            Dict containing success_probability, risk_score, prediction (1/0)
        """
        # Select model
        model = self.logistic_model if model_type == "logistic" else self.rf_model
        if model is None:
            # Fallback mock logic if models are not generated/trained yet
            logger.warning(f"Model {model_type} is not loaded. Using mock inference.")
            return self._mock_predict(features, model_type)

        try:
            # Preprocess features: obstacles_encountered is int in schema, but trained as string 'Yes'/'No'
            processed_features = features.copy()
            obstacles = processed_features.get("obstacles_encountered", 0)
            processed_features["obstacles_encountered"] = "Yes" if int(obstacles) > 0 else "No"

            # Create DataFrame with exact column names and expected types
            df = pd.DataFrame([processed_features])
            
            # Predict
            prob_success = float(model.predict_proba(df)[0][1])
            prediction_label = int(model.predict(df)[0])
            risk_score = 1.0 - prob_success

            return {
                "model_used": model_type,
                "success_probability": prob_success,
                "risk_score": risk_score,
                "prediction": prediction_label
            }
        except Exception as e:
            logger.error(f"Error during model inference: {e}")
            return self._mock_predict(features, model_type)

    def _mock_predict(self, features: Dict[str, Any], model_type: str) -> Dict[str, Any]:
        """Mock prediction for testing when models are not loaded."""
        # A simple rule-based mock for testing
        wind = features.get("wind_speed", 0)
        battery = features.get("battery_remaining", 100)
        weight = features.get("actual_carry_weight", 0)
        
        # Simple probability calc
        prob = 1.0 - (wind * 0.03) - ((100 - battery) * 0.003) - (weight * 0.05)
        prob = max(0.1, min(0.99, prob))
        
        prediction = 1 if prob >= 0.6 else 0
        
        return {
            "model_used": f"{model_type}_mock",
            "success_probability": prob,
            "risk_score": 1.0 - prob,
            "prediction": prediction
        }

# Singleton instance
model_loader = ModelLoader()
