import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Incident
from app.services.correlation_engine import correlate_events_to_attack_chains

router = APIRouter(prefix="/correlation", tags=["Attack Correlation"])

@router.get("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    # Trigger fresh correlation on read
    correlate_events_to_attack_chains(db)
    incidents = db.query(Incident).order_by(Incident.detected_at.desc()).all()
    
    results = []
    for inc in incidents:
        try:
            graph_data = json.loads(inc.attack_chain_json)
        except Exception:
            graph_data = {"nodes": [], "edges": []}
            
        results.append({
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "severity": inc.severity,
            "status": inc.status,
            "target_asset": inc.target_asset,
            "attacker_ip": inc.attacker_ip,
            "mitre_tactics": inc.mitre_tactics.split(", ") if inc.mitre_tactics else [],
            "detected_at": inc.detected_at.isoformat() if inc.detected_at else None,
            "graph": graph_data
        })
    return results

@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    try:
        graph_data = json.loads(inc.attack_chain_json)
    except Exception:
        graph_data = {"nodes": [], "edges": []}
        
    return {
        "id": inc.id,
        "title": inc.title,
        "description": inc.description,
        "severity": inc.severity,
        "status": inc.status,
        "target_asset": inc.target_asset,
        "attacker_ip": inc.attacker_ip,
        "mitre_tactics": inc.mitre_tactics.split(", ") if inc.mitre_tactics else [],
        "detected_at": inc.detected_at.isoformat() if inc.detected_at else None,
        "graph": graph_data
    }
