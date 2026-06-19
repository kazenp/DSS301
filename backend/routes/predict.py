from fastapi import APIRouter, HTTPException
from backend.schemas import PredictionRequest, PredictionResponse, DSSDecisionRequest, DSSDecisionResponse
from backend.model_loader import model_loader
from backend.dss_engine import dss_engine

router = APIRouter()

@router.post("/", response_model=PredictionResponse)
async def predict_telemetry(request: PredictionRequest):
    """
    Run ML inference on the incoming drone telemetry variables.
    """
    try:
        features = request.telemetry.dict()
        prediction_result = model_loader.predict(features, request.model_type)
        return prediction_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/dss-evaluate", response_model=DSSDecisionResponse)
async def evaluate_flight_decision(request: DSSDecisionRequest):
    """
    Evaluate flight feasibility by running ML inference and feeding the output into the DSS business rule engine.
    """
    try:
        features = request.telemetry.dict()
        ml_prediction = model_loader.predict(features, request.model_type)
        dss_decision = dss_engine.evaluate_decision(ml_prediction, features, request.busy_day)
        
        return {
            "prediction": ml_prediction,
            "dss_approved": dss_decision["dss_approved"],
            "final_status": dss_decision["final_status"],
            "decision_reason": dss_decision["decision_reason"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DSS evaluation error: {str(e)}")
