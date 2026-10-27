from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SecurityEvent, Asset, ThreatIndicator
from app.services.ml_engine import ml_engine
from app.services.risk_engine import calculate_asset_risk
from app.services.correlation_engine import correlate_events_to_attack_chains

router = APIRouter(prefix="/events", tags=["Security Events & Logs"])

class EventIngestSchema(BaseModel):
    asset_id: int
    event_type: str
    source_ip: str
    user_account: str = "anonymous"
    raw_log: str
    severity: str = "Medium"
    # Optional features for ML evaluation
    failed_login_count: Optional[int] = 0
    login_frequency: Optional[float] = 1.0
    country_change: Optional[int] = 0
    request_frequency: Optional[float] = 10.0
    port_activity_entropy: Optional[float] = 0.5

@router.get("/")
def list_events(limit: int = 50, asset_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(SecurityEvent)
    if asset_id:
        query = query.filter(SecurityEvent.asset_id == asset_id)
    events = query.order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": e.id,
            "asset_id": e.asset_id,
            "asset_name": e.asset.name if e.asset else "Unknown Asset",
            "asset_tag": e.asset.asset_tag if e.asset else "N/A",
            "event_type": e.event_type,
            "source_ip": e.source_ip,
            "user_account": e.user_account,
            "raw_log": e.raw_log,
            "severity": e.severity,
            "ml_prediction": e.ml_prediction,
            "anomaly_score": e.anomaly_score,
            "is_flagged_ml": e.is_flagged_ml,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None
        } for e in events
    ]

@router.post("/ingest", status_code=201)
def ingest_event(data: EventIngestSchema, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == data.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Target asset not found")
        
    # Check Threat Intelligence reputation for source IP
    ioc = db.query(ThreatIndicator).filter(ThreatIndicator.value == data.source_ip).first()
    ip_reputation = 20.0 if ioc else 85.0
    
    # Run through dual-model ML detection engine
    ml_features = {
        "failed_login_count": data.failed_login_count,
        "login_frequency": data.login_frequency,
        "source_ip_reputation": ip_reputation,
        "country_change": data.country_change,
        "request_frequency": data.request_frequency,
        "port_activity_entropy": data.port_activity_entropy
    }
    
    ml_result = ml_engine.predict_event(ml_features)
    
    # Ingest event record
    event = SecurityEvent(
        asset_id=asset.id,
        event_type=data.event_type,
        source_ip=data.source_ip,
        user_account=data.user_account,
        raw_log=data.raw_log,
        severity=data.severity if ml_result["prediction"] != "Malicious" else "Critical",
        anomaly_score=ml_result["anomaly_score"],
        ml_prediction=ml_result["prediction"],
        is_flagged_ml=(ml_result["prediction"] in ["Suspicious", "Malicious"] or ml_result["is_anomalous"]),
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Recalculate dynamic risk on target asset
    score, level, reason, comp, _ = calculate_asset_risk(db, asset)
    asset.current_risk_score = score
    asset.current_risk_level = level
    db.commit()
    
    # Update attack chain correlations
    correlate_events_to_attack_chains(db)
    
    return {
        "event_id": event.id,
        "ml_classification": ml_result["prediction"],
        "anomaly_score": ml_result["anomaly_score"],
        "confidence": ml_result["confidence"],
        "asset_updated_risk": score,
        "asset_risk_level": level
    }

@router.post("/simulate-attack")
def simulate_attack_chain(attack_type: str = "brute_force_c2", db: Session = Depends(get_db)):
    """
    Demonstration helper: injects an instant realistic attack chain into the system
    to showcase real-time detection, attack chain correlation, and risk elevation.
    """
    srv01 = db.query(Asset).filter(Asset.asset_tag == "SRV-001").first()
    db01 = db.query(Asset).filter(Asset.asset_tag == "DB-001").first()
    if not srv01:
        raise HTTPException(status_code=400, detail="Seed assets missing")
        
    attacker_ip = "185.220.101.45"
    now = datetime.now(timezone.utc)
    
    simulated = [
        SecurityEvent(
            asset_id=srv01.id,
            event_type="Port Scan",
            source_ip=attacker_ip,
            user_account="root",
            raw_log="[SIMULATED] Rapid port sweep 22, 80, 443, 3306 from Tor Exit Node",
            severity="Medium",
            anomaly_score=0.72,
            ml_prediction="Suspicious",
            is_flagged_ml=True,
            timestamp=now
        ),
        SecurityEvent(
            asset_id=srv01.id,
            event_type="Login Failed",
            source_ip=attacker_ip,
            user_account="admin",
            raw_log="[SIMULATED] Hydra automated SSH credential stuffing burst (55 attempts/min)",
            severity="High",
            anomaly_score=0.91,
            ml_prediction="Malicious",
            is_flagged_ml=True,
            timestamp=now
        ),
        SecurityEvent(
            asset_id=srv01.id,
            event_type="CVE Exploit Attempt",
            source_ip=attacker_ip,
            user_account="root",
            raw_log="[SIMULATED] Triggered CVE-2024-21626 runc escape payload executing unauthorized shell",
            severity="Critical",
            anomaly_score=0.98,
            ml_prediction="Malicious",
            is_flagged_ml=True,
            timestamp=now
        )
    ]
    db.add_all(simulated)
    db.commit()
    
    # Recalculate risk on srv01
    score, level, reason, comp, _ = calculate_asset_risk(db, srv01)
    srv01.current_risk_score = score
    srv01.current_risk_level = level
    db.commit()
    
    correlate_events_to_attack_chains(db)
    
    return {
        "status": "success",
        "message": f"Simulated 3-stage attack chain against {srv01.name}.",
        "target_asset_risk": score,
        "target_asset_level": level
    }
