from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Asset
from app.services.rag_engine import rag_engine

router = APIRouter(prefix="/ai-analyst", tags=["AI Security Analyst (RAG)"])

class AnalystQuerySchema(BaseModel):
    asset_id: int
    question: Optional[str] = "Why is this asset classified with this risk score, and what is the remediation plan?"

@router.post("/analyze")
def analyze_asset_security(data: AnalystQuerySchema, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == data.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    asset_dict = {
        "id": asset.id,
        "name": asset.name,
        "asset_tag": asset.asset_tag,
        "risk_score": asset.current_risk_score,
        "risk_level": asset.current_risk_level,
        "criticality": asset.criticality,
        "owner": asset.owner,
        "is_internet_exposed": asset.is_internet_exposed,
        "vulnerabilities": [
            {
                "cve_id": v.cve_id,
                "cvss_score": v.cvss_score,
                "severity": v.severity,
                "affected_product": v.affected_product,
                "exploit_available": v.exploit_available
            } for v in asset.vulnerabilities
        ],
        "recent_events": [
            {
                "event_type": e.event_type,
                "source_ip": e.source_ip,
                "severity": e.severity,
                "ml_prediction": e.ml_prediction
            } for e in asset.security_events[-10:]
        ]
    }
    
    result = rag_engine.analyze_asset_security(asset_dict, user_query=data.question)
    return result
