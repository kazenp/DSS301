import pandas as pd
from typing import Dict, Any, List

def preprocess_telemetry_features(features: Dict[str, Any], feature_cols: List[str]) -> pd.DataFrame:
    """
    Format telemetry input dictionary into a pandas DataFrame ready for ML pipeline.
    
    Parameters:
        features: Dictionary containing telemetry features
        feature_cols: Target feature names expected by the model
        
    Returns:
        pandas.DataFrame with correct alignment of features
    """
    # Create single row DataFrame
    df = pd.DataFrame([features])
    
    # Check if all required features exist, if not, fill with default values
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0.0
            
    # Reorder columns to match feature_cols
    df = df[feature_cols]
    
    return df
