import os
import json
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Paths
csv_path = "c:/Users/DELL/OneDrive/Desktop/DSS301/Data/telemetry/clean_telemetry.csv"
model_dir = "c:/Users/DELL/OneDrive/Desktop/DSS301/DSS301_Project/models"
os.makedirs(model_dir, exist_ok=True)

logistic_path = os.path.join(model_dir, "logistic_pipeline.pkl")
rf_path = os.path.join(model_dir, "random_forest_pipeline.pkl")
metadata_path = os.path.join(model_dir, "model_metadata.json")

print(f"Loading data from {csv_path}...")
df = pd.read_csv(csv_path)

# Convert flight_status to binary target: 1 if Completed, 0 otherwise
df['flight_target'] = df['flight_status'].apply(lambda x: 1 if x == "Completed" else 0)

# Define X and y using exactly the 8 telemetry fields matching TelemetryInput schema
telemetry_cols = [
    "wind_speed",
    "battery_remaining",
    "actual_carry_weight",
    "payload_type",
    "altitude",
    "distance_flown",
    "gps_accuracy",
    "obstacles_encountered"
]

X = df[telemetry_cols].copy()
y = df['flight_target']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

# Features classification
numeric_features = ["wind_speed", "battery_remaining", "actual_carry_weight", "altitude", "distance_flown", "gps_accuracy"]
categorical_features = ["payload_type", "obstacles_encountered"]

# Preprocessors
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# 1. Logistic Regression Model
print("Training Logistic Regression...")
log_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
])
log_pipeline.fit(X_train, y_train)

# 2. Random Forest Model
print("Training Random Forest...")
rf_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced"))
])
rf_pipeline.fit(X_train, y_train)

# Evaluate Logistic Regression
y_pred_log = log_pipeline.predict(X_test)
y_prob_log = log_pipeline.predict_proba(X_test)[:, 1]

log_metrics = {
    "accuracy": float(accuracy_score(y_test, y_pred_log)),
    "precision": float(precision_score(y_test, y_pred_log)),
    "recall": float(recall_score(y_test, y_pred_log)),
    "f1_score": float(f1_score(y_test, y_pred_log)),
    "auc_roc": float(roc_auc_score(y_test, y_prob_log))
}

# Evaluate Random Forest
y_pred_rf = rf_pipeline.predict(X_test)
y_prob_rf = rf_pipeline.predict_proba(X_test)[:, 1]

rf_metrics = {
    "accuracy": float(accuracy_score(y_test, y_pred_rf)),
    "precision": float(precision_score(y_test, y_pred_rf)),
    "recall": float(recall_score(y_test, y_pred_rf)),
    "f1_score": float(f1_score(y_test, y_pred_rf)),
    "auc_roc": float(roc_auc_score(y_test, y_prob_rf))
}

print("\nLogistic Regression Metrics:")
print(json.dumps(log_metrics, indent=2))
print("\nRandom Forest Metrics:")
print(json.dumps(rf_metrics, indent=2))

# Save models
print(f"Saving Logistic Regression pipeline to {logistic_path}...")
joblib.dump(log_pipeline, logistic_path)

print(f"Saving Random Forest pipeline to {rf_path}...")
joblib.dump(rf_pipeline, rf_path)

# Update metadata
metadata = {
    "system_info": {
        "project_name": "Drone Delivery DSS + ML System",
        "course_code": "DSS301",
        "last_updated": "2026-06-19"
    },
    "models": {
        "logistic_regression": {
            "model_file": "logistic_pipeline.pkl",
            "status": "trained",
            "best_hyperparameters": {
                "C": 1.0,
                "penalty": "l2",
                "solver": "lbfgs"
            },
            "performance_metrics": log_metrics
        },
        "random_forest": {
            "model_file": "random_forest_pipeline.pkl",
            "status": "trained",
            "best_hyperparameters": {
                "n_estimators": 200,
                "max_depth": None,
                "min_samples_split": 2,
                "class_weight": "balanced"
            },
            "performance_metrics": rf_metrics
        }
    },
    "features": {
        "numerical": numeric_features,
        "categorical": categorical_features,
        "target": "flight_target"
    }
}

print(f"Saving metadata to {metadata_path}...")
with open(metadata_path, "w") as f:
    json.dump(metadata, f, indent=2)

print("Training and serialization completed successfully!")
