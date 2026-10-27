from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.ml_engine import ml_engine

router = APIRouter(prefix="/ml", tags=["Machine Learning Threat Engine"])

class MLPredictTestSchema(BaseModel):
    failed_login_count: int = 0
    login_frequency: float = 1.0
    source_ip_reputation: float = 85.0
    country_change: int = 0
    request_frequency: float = 10.0
    port_activity_entropy: float = 0.5

@router.get("/metrics")
def get_ml_metrics():
    """Returns academic evaluation metrics: accuracy, precision, recall, F1, confusion matrix, ROC-AUC."""
    if not ml_engine.metrics:
        ml_engine.load_or_train()
    return ml_engine.metrics

@router.post("/retrain")
def retrain_models():
    """Retrains Random Forest and Isolation Forest models on synthetic dataset."""
    metrics = ml_engine.train_models()
    return {
        "status": "success",
        "message": "Models retrained successfully.",
        "metrics": metrics
    }

@router.post("/test-predict")
def test_predict_event(data: MLPredictTestSchema):
    """Interactive real-time tester for user/professor demonstrations."""
    features = data.dict()
    result = ml_engine.predict_event(features)
    return {
        "input_features": features,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "anomaly_score": result["anomaly_score"],
        "is_anomalous": result["is_anomalous"],
        "probabilities": result["probabilities"]
    }
