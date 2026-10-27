from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Asset, Incident, Recommendation
from app.services.report_generator import generate_pdf_security_report

router = APIRouter(prefix="/reports", tags=["Reports & Audits"])

@router.get("/download-pdf")
def download_pdf_report(organization: str = "Enterprise Cyber Defense Corp", db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    incidents = db.query(Incident).all()
    recommendations = db.query(Recommendation).limit(10).all()
    
    asset_dicts = [
        {
            "id": a.id,
            "asset_tag": a.asset_tag,
            "name": a.name,
            "ip_address": a.ip_address,
            "asset_type": a.asset_type,
            "criticality": a.criticality,
            "is_internet_exposed": a.is_internet_exposed,
            "current_risk_score": a.current_risk_score,
            "current_risk_level": a.current_risk_level
        } for a in assets
    ]
    
    incident_dicts = [
        {
            "id": i.id,
            "title": i.title,
            "severity": i.severity,
            "target_asset": i.target_asset,
            "attacker_ip": i.attacker_ip,
            "description": i.description
        } for i in incidents
    ]
    
    rec_dicts = [
        {
            "id": r.id,
            "action": r.action,
            "priority": r.priority,
            "category": r.category
        } for r in recommendations
    ]
    
    scores = [a.current_risk_score for a in assets]
    overall_score = round(max(scores) * 0.4 + (sum(scores)/len(scores)) * 0.6, 1) if scores else 0.0
    
    pdf_bytes = generate_pdf_security_report(
        organization_name=organization,
        overall_risk=overall_score,
        assets=asset_dicts,
        incidents=incident_dicts,
        top_recommendations=rec_dicts
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Cyber_Risk_Report_{organization.replace(' ', '_')}.pdf"}
    )
