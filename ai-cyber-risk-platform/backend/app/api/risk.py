from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Asset, Vulnerability, ThreatIndicator, SecurityEvent, Incident, Recommendation
from app.services.risk_engine import evaluate_and_update_all_risks

router = APIRouter(prefix="/risk", tags=["Cyber Risk Engine"])

@router.get("/overview")
def get_risk_overview(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    if not assets:
        return {"overall_risk_score": 0.0, "risk_level": "Low", "total_assets": 0}
        
    scores = [a.current_risk_score for a in assets]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    max_score = round(max(scores), 1) if scores else 0.0
    
    # Weighted overall enterprise risk (heavily emphasizes critical nodes)
    enterprise_risk = round(0.4 * max_score + 0.6 * avg_score, 1)
    
    if enterprise_risk >= 71.0:
        overall_level = "Critical"
    elif enterprise_risk >= 41.0:
        overall_level = "High"
    elif enterprise_risk >= 21.0:
        overall_level = "Medium"
    else:
        overall_level = "Low"
        
    # Distribution counts
    dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for a in assets:
        lvl = a.current_risk_level or "Low"
        dist[lvl] = dist.get(lvl, 0) + 1
        
    total_vulns = db.query(Vulnerability).count()
    critical_vulns = db.query(Vulnerability).filter(Vulnerability.severity == "Critical").count()
    active_iocs = db.query(ThreatIndicator).count()
    total_events = db.query(SecurityEvent).count()
    flagged_events = db.query(SecurityEvent).filter(SecurityEvent.is_flagged_ml == True).count()
    active_incidents = db.query(Incident).filter(Incident.status == "Open").count()
    
    top_critical_assets = [
        {
            "id": a.id,
            "asset_tag": a.asset_tag,
            "name": a.name,
            "ip_address": a.ip_address,
            "criticality": a.criticality,
            "is_internet_exposed": a.is_internet_exposed,
            "risk_score": a.current_risk_score,
            "risk_level": a.current_risk_level
        } for a in sorted(assets, key=lambda x: x.current_risk_score, reverse=True)[:5]
    ]
    
    recommendations = db.query(Recommendation).order_by(Recommendation.id.desc()).limit(10).all()
    
    return {
        "overall_risk_score": enterprise_risk,
        "overall_risk_level": overall_level,
        "max_asset_risk": max_score,
        "average_asset_risk": avg_score,
        "distribution": dist,
        "counts": {
            "total_assets": len(assets),
            "total_vulnerabilities": total_vulns,
            "critical_vulnerabilities": critical_vulns,
            "threat_indicators": active_iocs,
            "total_events": total_events,
            "flagged_events": flagged_events,
            "active_incidents": active_incidents
        },
        "top_critical_assets": top_critical_assets,
        "priority_recommendations": [
            {
                "id": r.id,
                "asset_id": r.asset_id,
                "asset_name": r.asset.name if r.asset else "Asset",
                "action": r.action,
                "priority": r.priority,
                "category": r.category,
                "status": r.status
            } for r in recommendations
        ]
    }

@router.post("/recalculate")
def recalculate_all_risks(db: Session = Depends(get_db)):
    """Triggers complete risk score recalculation across all assets."""
    assessments = evaluate_and_update_all_risks(db)
    return {
        "status": "success",
        "evaluated_assets_count": len(assessments),
        "message": "Risk engine successfully re-assessed all asset scores with latest telemetry."
    }
