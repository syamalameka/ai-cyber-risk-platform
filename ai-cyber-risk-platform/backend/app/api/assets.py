from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Asset, Vulnerability, SecurityEvent, RiskAssessment
from app.services.risk_engine import calculate_asset_risk

router = APIRouter(prefix="/assets", tags=["Assets"])

class AssetCreateSchema(BaseModel):
    asset_tag: str
    name: str
    ip_address: str
    asset_type: str = "Server"
    os: str = "Linux"
    criticality: str = "Medium"
    owner: str = "IT Operations"
    is_internet_exposed: bool = False

class AssetUpdateSchema(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    asset_type: Optional[str] = None
    os: Optional[str] = None
    criticality: Optional[str] = None
    owner: Optional[str] = None
    is_internet_exposed: Optional[bool] = None

@router.get("/")
def list_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).order_by(Asset.current_risk_score.desc()).all()
    results = []
    for a in assets:
        results.append({
            "id": a.id,
            "asset_tag": a.asset_tag,
            "name": a.name,
            "ip_address": a.ip_address,
            "asset_type": a.asset_type,
            "os": a.os,
            "criticality": a.criticality,
            "owner": a.owner,
            "is_internet_exposed": a.is_internet_exposed,
            "current_risk_score": a.current_risk_score,
            "current_risk_level": a.current_risk_level,
            "vulnerability_count": len(a.vulnerabilities),
            "event_count": len(a.security_events),
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return results

@router.get("/{asset_id}")
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    score, level, reason, components, recs = calculate_asset_risk(db, asset)
    
    return {
        "id": asset.id,
        "asset_tag": asset.asset_tag,
        "name": asset.name,
        "ip_address": asset.ip_address,
        "asset_type": asset.asset_type,
        "os": asset.os,
        "criticality": asset.criticality,
        "owner": asset.owner,
        "is_internet_exposed": asset.is_internet_exposed,
        "current_risk_score": score,
        "current_risk_level": level,
        "risk_reason": reason,
        "risk_components": components,
        "recommendations": recs,
        "vulnerabilities": [
            {
                "id": v.id,
                "cve_id": v.cve_id,
                "description": v.description,
                "cvss_score": v.cvss_score,
                "severity": v.severity,
                "affected_product": v.affected_product,
                "exploit_available": v.exploit_available
            } for v in asset.vulnerabilities
        ],
        "recent_events": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "source_ip": e.source_ip,
                "severity": e.severity,
                "ml_prediction": e.ml_prediction,
                "anomaly_score": e.anomaly_score,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None
            } for e in asset.security_events[-10:]
        ]
    }

@router.post("/", status_code=201)
def create_asset(data: AssetCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(Asset).filter(Asset.asset_tag == data.asset_tag).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset tag already exists")
        
    asset = Asset(**data.dict())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    # Calculate initial risk score
    score, level, reason, comp, _ = calculate_asset_risk(db, asset)
    asset.current_risk_score = score
    asset.current_risk_level = level
    db.commit()
    
    return asset

@router.patch("/{asset_id}")
def update_asset(asset_id: int, data: AssetUpdateSchema, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
        
    # Recalculate risk score immediately
    score, level, reason, comp, _ = calculate_asset_risk(db, asset)
    asset.current_risk_score = score
    asset.current_risk_level = level
    db.commit()
    db.refresh(asset)
    
    return asset

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted successfully"}
