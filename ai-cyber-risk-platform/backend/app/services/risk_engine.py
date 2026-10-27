from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.models import Asset, Vulnerability, ThreatIndicator, SecurityEvent, RiskAssessment, Recommendation

CRITICALITY_WEIGHTS = {
    "Low": 1.0,
    "Medium": 2.0,
    "High": 3.0,
    "Critical": 4.0
}

def calculate_asset_risk(db: Session, asset: Asset) -> Tuple[float, str, str, Dict[str, float], List[Dict[str, str]]]:
    """
    Computes multi-factor contextual cyber risk score (0-100) for an asset.
    Combines:
    1. Maximum CVSS score (up to 25 pts)
    2. Asset Business Criticality (up to 20 pts)
    3. Internet Exposure (15 pts)
    4. Exploit Availability (15 pts)
    5. Threat Intelligence correlation (up to 12.5 pts)
    6. Active ML Attack Activity / Anomalies (up to 12.5 pts)
    """
    # 1. Vulnerability Analysis
    vulns = asset.vulnerabilities
    max_cvss = max([v.cvss_score for v in vulns], default=0.0)
    has_exploit = any(v.exploit_available for v in vulns)
    
    cvss_component = min(25.0, (max_cvss / 10.0) * 25.0)
    exploit_component = 15.0 if has_exploit else 0.0
    
    # 2. Asset Criticality
    crit_weight = CRITICALITY_WEIGHTS.get(asset.criticality, 2.0)
    criticality_component = (crit_weight / 4.0) * 20.0
    
    # 3. Internet Exposure
    exposure_component = 15.0 if asset.is_internet_exposed else 0.0
    
    # 4. Threat Intelligence Check
    # Check if any IOCs match the asset IP or recent events
    recent_events = asset.security_events
    threat_intel_matches = 0
    max_ioc_confidence = 0
    
    for ev in recent_events[-20:]:  # check last 20 events
        ioc = db.query(ThreatIndicator).filter(ThreatIndicator.value == ev.source_ip).first()
        if ioc:
            threat_intel_matches += 1
            max_ioc_confidence = max(max_ioc_confidence, ioc.confidence)
            
    threat_intel_component = min(12.5, (max_ioc_confidence / 100.0) * 12.5) if threat_intel_matches > 0 else 0.0
    
    # 5. ML Attack Activity
    # Check for recent events flagged as Malicious or high anomaly
    malicious_events = [e for e in recent_events if e.ml_prediction in ["Malicious", "Suspicious"] or e.is_flagged_ml]
    high_anomalies = [e for e in recent_events if e.anomaly_score > 0.6]
    
    attack_ratio = min(1.0, (len(malicious_events) * 0.4 + len(high_anomalies) * 0.3))
    attack_activity_component = attack_ratio * 12.5
    
    # Calculate Total Score
    total_score = cvss_component + criticality_component + exposure_component + exploit_component + threat_intel_component + attack_activity_component
    risk_score = round(min(100.0, max(0.0, total_score)), 1)
    
    # Classify Risk Level
    if risk_score >= 71.0:
        risk_level = "Critical"
    elif risk_score >= 41.0:
        risk_level = "High"
    elif risk_score >= 21.0:
        risk_level = "Medium"
    else:
        risk_level = "Low"
        
    # Generate Evidence-backed Reasons
    reasons = []
    if max_cvss >= 7.0:
        top_cve = max(vulns, key=lambda v: v.cvss_score)
        reasons.append(f"Vulnerability {top_cve.cve_id} detected with CVSS {top_cve.cvss_score} ({top_cve.severity}).")
    if has_exploit:
        reasons.append("Known public exploit/PoC is actively available for installed software.")
    if asset.is_internet_exposed:
        reasons.append("Asset is directly internet-facing with open external ports.")
    if asset.criticality in ["High", "Critical"]:
        reasons.append(f"Asset is designated as business-critical ({asset.criticality}) by {asset.owner}.")
    if threat_intel_matches > 0:
        reasons.append(f"Threat intelligence feed correlated {threat_intel_matches} event(s) with known malicious IOCs (Confidence: {max_ioc_confidence}%).")
    if malicious_events:
        reasons.append(f"AI/ML detection flagged {len(malicious_events)} active malicious or suspicious event(s) targeting this asset.")
    if not reasons:
        reasons.append("No active vulnerabilities or suspicious anomalies detected. Standard baseline monitoring.")
        
    reason_text = " • " + "\n • ".join(reasons)
    
    # Generate Recommended Action Items
    recommendations = []
    if max_cvss >= 7.0 or has_exploit:
        top_cve = max(vulns, key=lambda v: v.cvss_score) if vulns else None
        cve_name = top_cve.cve_id if top_cve else "critical vulnerability"
        recommendations.append({
            "action": f"Patch {cve_name} on {asset.name} immediately or upgrade affected package.",
            "priority": "Critical" if has_exploit else "High",
            "category": "Patching"
        })
    if asset.is_internet_exposed:
        recommendations.append({
            "action": f"Restrict public ingress on {asset.ip_address} using firewall or Cloud Security Group; require VPN/Zero-Trust gateway.",
            "priority": "High",
            "category": "Network"
        })
    if threat_intel_matches > 0 or malicious_events:
        recommendations.append({
            "action": f"Quarantine or block malicious source IPs at perimeter firewall and review auth audit logs for {asset.name}.",
            "priority": "High",
            "category": "Investigation"
        })
    if asset.criticality in ["High", "Critical"]:
        recommendations.append({
            "action": f"Enforce Multi-Factor Authentication (MFA) and enable strict privilege-access monitoring for {asset.name}.",
            "priority": "Medium",
            "category": "Access Control"
        })
    if not recommendations:
        recommendations.append({
            "action": f"Maintain standard patch maintenance cycle and quarterly security audits for {asset.name}.",
            "priority": "Low",
            "category": "Maintenance"
        })
        
    components = {
        "cvss": round(cvss_component, 1),
        "criticality": round(criticality_component, 1),
        "exposure": round(exposure_component, 1),
        "exploit": round(exploit_component, 1),
        "threat_intel": round(threat_intel_component, 1),
        "attack_activity": round(attack_activity_component, 1)
    }
    
    return risk_score, risk_level, reason_text, components, recommendations


def evaluate_and_update_all_risks(db: Session) -> List[RiskAssessment]:
    """Recomputes risk scores across all assets in the system."""
    assets = db.query(Asset).all()
    assessments = []
    
    for asset in assets:
        score, level, reason, comp, recs = calculate_asset_risk(db, asset)
        asset.current_risk_score = score
        asset.current_risk_level = level
        
        assessment = RiskAssessment(
            asset_id=asset.id,
            risk_score=score,
            risk_level=level,
            reason=reason,
            cvss_component=comp["cvss"],
            criticality_component=comp["criticality"],
            exposure_component=comp["exposure"],
            exploit_component=comp["exploit"],
            threat_intel_component=comp["threat_intel"],
            attack_activity_component=comp["attack_activity"]
        )
        db.add(assessment)
        db.flush()
        
        # Clear old pending recommendations and write fresh ones
        db.query(Recommendation).filter(Recommendation.asset_id == asset.id).delete()
        for rec in recs:
            db.add(Recommendation(
                risk_id=assessment.id,
                asset_id=asset.id,
                action=rec["action"],
                priority=rec["priority"],
                category=rec["category"],
                status="Pending"
            ))
        assessments.append(assessment)
        
    db.commit()
    return assessments
