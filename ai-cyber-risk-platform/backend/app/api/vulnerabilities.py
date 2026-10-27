from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Vulnerability, Asset
from app.services.risk_engine import evaluate_and_update_all_risks

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])

class VulnerabilityCreateSchema(BaseModel):
    cve_id: str
    description: str
    cvss_score: float
    severity: str = "High"
    affected_product: str
    exploit_available: bool = False
    asset_id: Optional[int] = None

@router.get("/")
def list_vulnerabilities(db: Session = Depends(get_db)):
    vulns = db.query(Vulnerability).order_by(Vulnerability.cvss_score.desc()).all()
    results = []
    for v in vulns:
        results.append({
            "id": v.id,
            "cve_id": v.cve_id,
            "description": v.description,
            "cvss_score": v.cvss_score,
            "severity": v.severity,
            "affected_product": v.affected_product,
            "exploit_available": v.exploit_available,
            "asset_id": v.asset_id,
            "asset_name": v.asset.name if v.asset else "Unassigned",
            "asset_tag": v.asset.asset_tag if v.asset else "N/A"
        })
    return results

@router.post("/", status_code=201)
def create_vulnerability(data: VulnerabilityCreateSchema, db: Session = Depends(get_db)):
    vuln = Vulnerability(**data.dict())
    db.add(vuln)
    db.commit()
    db.refresh(vuln)
    
    # Recalculate risks across assets
    evaluate_and_update_all_risks(db)
    return vuln
