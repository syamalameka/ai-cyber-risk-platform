from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ThreatIndicator

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])

class ThreatIndicatorCreateSchema(BaseModel):
    ioc_type: str  # IP, Domain, URL, Hash
    value: str
    threat_type: str = "Malware"
    confidence: int = 85
    source: str = "Threat Feed"
    mitre_tactic: str = "Initial Access"

@router.get("/")
def list_threat_indicators(ioc_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ThreatIndicator)
    if ioc_type:
        query = query.filter(ThreatIndicator.ioc_type.ilike(f"%{ioc_type}%"))
    indicators = query.order_by(ThreatIndicator.confidence.desc()).all()
    return indicators

@router.get("/lookup")
def lookup_ioc(value: str = Query(..., description="IP, domain, or hash to check"), db: Session = Depends(get_db)):
    match = db.query(ThreatIndicator).filter(ThreatIndicator.value == value).first()
    if not match:
        return {
            "matched": False,
            "value": value,
            "status": "Clean",
            "message": "No known threat intelligence indicators matched this value."
        }
    return {
        "matched": True,
        "value": match.value,
        "ioc_type": match.ioc_type,
        "threat_type": match.threat_type,
        "confidence": match.confidence,
        "source": match.source,
        "mitre_tactic": match.mitre_tactic,
        "first_seen": match.first_seen.isoformat() if match.first_seen else None,
        "last_seen": match.last_seen.isoformat() if match.last_seen else None
    }

@router.post("/", status_code=201)
def create_threat_indicator(data: ThreatIndicatorCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(ThreatIndicator).filter(ThreatIndicator.value == data.value).first()
    if existing:
        raise HTTPException(status_code=400, detail="Indicator already exists in threat intelligence database")
        
    ioc = ThreatIndicator(**data.dict())
    db.add(ioc)
    db.commit()
    db.refresh(ioc)
    return ioc
