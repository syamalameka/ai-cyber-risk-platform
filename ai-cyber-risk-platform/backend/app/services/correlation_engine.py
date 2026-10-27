import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import SecurityEvent, Asset, ThreatIndicator, Incident

MITRE_STAGE_MAP = {
    "Port Scan": {"tactic": "Discovery", "technique": "Network Service Scanning (T1046)"},
    "Directory Enumeration": {"tactic": "Reconnaissance", "technique": "Active Scanning (T1595)"},
    "Login Failed": {"tactic": "Credential Access", "technique": "Brute Force (T1110)"},
    "Impossible Travel": {"tactic": "Initial Access", "technique": "Valid Accounts (T1078)"},
    "SQLi Attempt": {"tactic": "Initial Access", "technique": "Exploit Public-Facing App (T1190)"},
    "CVE Exploit Attempt": {"tactic": "Execution", "technique": "Exploitation for Client Execution (T1203)"},
    "Privilege Escalation": {"tactic": "Privilege Escalation", "technique": "Exploitation for Privilege Escalation (T1068)"},
    "Lateral SSH Attempt": {"tactic": "Lateral Movement", "technique": "Remote Services: SSH (T1021.004)"},
    "Outbound C2 Beacon": {"tactic": "Command and Control", "technique": "Application Layer Protocol (T1071)"},
    "Sensitive File Exfiltration": {"tactic": "Exfiltration", "technique": "Exfiltration Over C2 Channel (T1041)"}
}

def correlate_events_to_attack_chains(db: Session) -> List[Incident]:
    """
    Correlates security events across temporal windows and assets
    to reconstruct multi-stage cyber attack kill chains.
    """
    # Group events by source_ip
    events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.asc()).all()
    events_by_ip: Dict[str, List[SecurityEvent]] = {}
    for ev in events:
        events_by_ip.setdefault(ev.source_ip, []).append(ev)
        
    created_incidents = []
    
    for ip, ip_events in events_by_ip.items():
        # Only analyze if there are 2 or more distinct event types or >= 3 events
        event_types = set(e.event_type for e in ip_events)
        if len(ip_events) < 2 and len(event_types) < 2:
            continue
            
        # Determine target assets
        asset_ids = set(e.asset_id for e in ip_events if e.asset_id is not None)
        target_assets = db.query(Asset).filter(Asset.id.in_(asset_ids)).all() if asset_ids else []
        asset_names = ", ".join([a.name for a in target_assets]) or "Internal Network"
        
        # Check if IOC exists
        ioc = db.query(ThreatIndicator).filter(ThreatIndicator.value == ip).first()
        is_known_threat = bool(ioc)
        
        # Extract MITRE tactics
        tactics = []
        nodes = [{"id": f"att-{ip}", "label": f"Attacker IP\n{ip}", "type": "attacker", "status": "Malicious" if is_known_threat else "Suspicious"}]
        edges = []
        
        prev_node_id = f"att-{ip}"
        
        for idx, ev in enumerate(ip_events):
            stage_info = MITRE_STAGE_MAP.get(ev.event_type, {"tactic": "Defense Evasion", "technique": "Generic Event"})
            if stage_info["tactic"] not in tactics:
                tactics.append(stage_info["tactic"])
                
            node_id = f"ev-{ev.id}"
            nodes.append({
                "id": node_id,
                "label": f"Step {idx+1}: {ev.event_type}\n({stage_info['technique']})",
                "type": "event",
                "severity": ev.severity,
                "time": ev.timestamp.strftime("%H:%M:%S") if ev.timestamp else ""
            })
            edges.append({
                "source": prev_node_id,
                "target": node_id,
                "label": stage_info["tactic"]
            })
            prev_node_id = node_id
            
        for a in target_assets:
            asset_node_id = f"asset-{a.id}"
            nodes.append({
                "id": asset_node_id,
                "label": f"Target: {a.name}\n({a.asset_tag} - {a.criticality})",
                "type": "target",
                "criticality": a.criticality
            })
            edges.append({
                "source": prev_node_id,
                "target": asset_node_id,
                "label": "Compromised / Targeted"
            })
            
        chain_graph = {"nodes": nodes, "edges": edges}
        
        # Determine overall incident severity
        if len(tactics) >= 4 or any(t in ["Privilege Escalation", "Exfiltration", "Command and Control"] for t in tactics):
            severity = "Critical"
        elif len(tactics) >= 2:
            severity = "High"
        else:
            severity = "Medium"
            
        title = f"Multi-Stage Attack Chain Detected from {ip} ({' -> '.join(tactics[:3])})"
        desc = (
            f"Automated correlation correlated {len(ip_events)} security events from {ip} "
            f"targeting {asset_names}. Identified attack progression through MITRE tactics: {', '.join(tactics)}. "
            f"{'Source is confirmed in Threat Intel Feed.' if is_known_threat else 'Source exhibited abnormal behavioral anomalies.'}"
        )
        
        # Check if already recorded in incidents
        existing = db.query(Incident).filter(Incident.attacker_ip == ip).first()
        if not existing:
            inc = Incident(
                title=title,
                description=desc,
                severity=severity,
                status="Open",
                target_asset=asset_names,
                attacker_ip=ip,
                attack_chain_json=json.dumps(chain_graph),
                mitre_tactics=", ".join(tactics)
            )
            db.add(inc)
            created_incidents.append(inc)
        else:
            existing.description = desc
            existing.severity = severity
            existing.attack_chain_json = json.dumps(chain_graph)
            existing.mitre_tactics = ", ".join(tactics)
            created_incidents.append(existing)
            
    db.commit()
    return created_incidents
