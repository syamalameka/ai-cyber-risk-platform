from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.models import User, Asset, Vulnerability, ThreatIndicator, SecurityEvent
from app.core.security import get_password_hash

def seed_database(db: Session):
    """Populates realistic initial cybersecurity datasets if tables are empty."""
    if db.query(User).first():
        return  # already seeded
        
    print("[+] Seeding users...")
    users = [
        User(name="Chief Security Officer", email="admin@cyberrisk.local", password_hash=get_password_hash("admin123"), role="Admin"),
        User(name="Lead Threat Analyst", email="analyst@cyberrisk.local", password_hash=get_password_hash("analyst123"), role="Analyst"),
        User(name="Executive Auditor", email="viewer@cyberrisk.local", password_hash=get_password_hash("viewer123"), role="Viewer"),
    ]
    db.add_all(users)
    db.commit()
    
    print("[+] Seeding assets...")
    assets = [
        Asset(
            asset_tag="SRV-001",
            name="Production Application Server 01",
            ip_address="10.0.0.15",
            asset_type="Server",
            os="Ubuntu 22.04 LTS",
            criticality="Critical",
            owner="Core IT Operations",
            is_internet_exposed=True
        ),
        Asset(
            asset_tag="DB-001",
            name="Production Financial Database",
            ip_address="10.0.0.22",
            asset_type="Database",
            os="PostgreSQL 16 (Debian 12)",
            criticality="Critical",
            owner="Database Administration",
            is_internet_exposed=False
        ),
        Asset(
            asset_tag="APP-001",
            name="Customer eCommerce Gateway",
            ip_address="10.0.1.10",
            asset_type="Web Application",
            os="Node.js 20 / Nginx",
            criticality="High",
            owner="Engineering Web Team",
            is_internet_exposed=True
        ),
        Asset(
            asset_tag="APP-002",
            name="Internal Employee HR Portal",
            ip_address="10.0.2.14",
            asset_type="Web Application",
            os="Python 3.12 / Django",
            criticality="Medium",
            owner="HR Operations",
            is_internet_exposed=False
        ),
        Asset(
            asset_tag="SRV-002",
            name="DevOps CI/CD Deployment Worker",
            ip_address="10.0.3.50",
            asset_type="Cloud Instance",
            os="Ubuntu 24.04 (AWS EC2)",
            criticality="High",
            owner="Platform Engineering",
            is_internet_exposed=True
        ),
        Asset(
            asset_tag="WS-012",
            name="Finance Analyst Workstation",
            ip_address="192.168.1.105",
            asset_type="Workstation",
            os="Windows 11 Enterprise",
            criticality="Low",
            owner="Corporate Finance",
            is_internet_exposed=False
        )
    ]
    db.add_all(assets)
    db.commit()
    
    # Reload assets to obtain auto-generated IDs
    srv01 = db.query(Asset).filter(Asset.asset_tag == "SRV-001").first()
    db01 = db.query(Asset).filter(Asset.asset_tag == "DB-001").first()
    app01 = db.query(Asset).filter(Asset.asset_tag == "APP-001").first()
    srv02 = db.query(Asset).filter(Asset.asset_tag == "SRV-002").first()
    ws012 = db.query(Asset).filter(Asset.asset_tag == "WS-012").first()
    
    print("[+] Seeding vulnerabilities (CVEs)...")
    vulnerabilities = [
        Vulnerability(
            cve_id="CVE-2024-21626",
            description="runc container breakout allowing unauthorized host filesystem escape and root privileges.",
            cvss_score=9.8,
            severity="Critical",
            affected_product="runc <= 1.1.11 / containerd",
            exploit_available=True,
            asset_id=srv01.id
        ),
        Vulnerability(
            cve_id="CVE-2023-44487",
            description="HTTP/2 Rapid Reset distributed denial of service protocol flaw causing resource starvation.",
            cvss_score=7.5,
            severity="High",
            affected_product="Nginx 1.24 HTTP/2 module",
            exploit_available=True,
            asset_id=app01.id
        ),
        Vulnerability(
            cve_id="CVE-2023-22809",
            description="Sudo sudoedit privilege escalation flaw via arbitrary file writing as superuser.",
            cvss_score=7.8,
            severity="High",
            affected_product="sudo <= 1.9.12p1",
            exploit_available=True,
            asset_id=db01.id
        ),
        Vulnerability(
            cve_id="CVE-2023-38606",
            description="Linux Kernel local privilege escalation flaw in memory management subsystem.",
            cvss_score=7.1,
            severity="High",
            affected_product="Linux Kernel 6.1.x",
            exploit_available=False,
            asset_id=srv02.id
        ),
        Vulnerability(
            cve_id="CVE-2024-0012",
            description="Improper authentication verification allowing low-privileged info disclosure.",
            cvss_score=4.3,
            severity="Medium",
            affected_product="Internal Client Agent 2.1",
            exploit_available=False,
            asset_id=ws012.id
        )
    ]
    db.add_all(vulnerabilities)
    db.commit()
    
    print("[+] Seeding threat indicators (IOCs)...")
    iocs = [
        ThreatIndicator(
            ioc_type="IP",
            value="185.220.101.45",
            threat_type="Brute Force / Tor Scanner",
            confidence=96,
            source="AlienVault OTX & AbuseIPDB",
            mitre_tactic="Initial Access"
        ),
        ThreatIndicator(
            ioc_type="IP",
            value="194.26.29.112",
            threat_type="Cobalt Strike C2 Beacon",
            confidence=94,
            source="Spamhaus DROP / Feodo Tracker",
            mitre_tactic="Command and Control"
        ),
        ThreatIndicator(
            ioc_type="IP",
            value="45.142.166.88",
            threat_type="Automated Web Recon Scanner",
            confidence=88,
            source="Emerging Threats",
            mitre_tactic="Reconnaissance"
        ),
        ThreatIndicator(
            ioc_type="Domain",
            value="update-sec-cdn.top",
            threat_type="Phishing / C2 Redirection",
            confidence=92,
            source="ThreatFox",
            mitre_tactic="Defense Evasion"
        ),
        ThreatIndicator(
            ioc_type="Hash",
            value="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            threat_type="Linux Reverse Shell Payload",
            confidence=99,
            source="VirusTotal Community",
            mitre_tactic="Execution"
        )
    ]
    db.add_all(iocs)
    db.commit()
    
    print("[+] Seeding realistic security events for attack chain...")
    base_time = datetime.now(timezone.utc) - timedelta(hours=2)
    
    events = [
        # Normal baseline events
        SecurityEvent(
            asset_id=app01.id,
            event_type="HTTP Request",
            source_ip="203.0.113.88",
            user_account="web_guest",
            raw_log="GET /products/catalog HTTP/1.1 200 OK",
            severity="Low",
            timestamp=base_time + timedelta(minutes=5),
            anomaly_score=0.08,
            ml_prediction="Normal",
            is_flagged_ml=False
        ),
        SecurityEvent(
            asset_id=ws012.id,
            event_type="User Login",
            source_ip="192.168.1.105",
            user_account="jdoe_finance",
            raw_log="Interactive Windows Logon Kerberos Success",
            severity="Low",
            timestamp=base_time + timedelta(minutes=10),
            anomaly_score=0.12,
            ml_prediction="Normal",
            is_flagged_ml=False
        ),
        # Attacker 185.220.101.45 multi-stage attack chain
        SecurityEvent(
            asset_id=srv01.id,
            event_type="Port Scan",
            source_ip="185.220.101.45",
            user_account="anonymous",
            raw_log="TCP SYN Scan detected across ports 21, 22, 80, 443, 8080, 9000",
            severity="Medium",
            timestamp=base_time + timedelta(minutes=25),
            anomaly_score=0.68,
            ml_prediction="Suspicious",
            is_flagged_ml=True
        ),
        SecurityEvent(
            asset_id=srv01.id,
            event_type="Login Failed",
            source_ip="185.220.101.45",
            user_account="root",
            raw_log="SSHD Failed password for invalid user root from 185.220.101.45 port 48211 ssh2 (Burst of 48 attempts)",
            severity="High",
            timestamp=base_time + timedelta(minutes=35),
            anomaly_score=0.88,
            ml_prediction="Malicious",
            is_flagged_ml=True
        ),
        SecurityEvent(
            asset_id=srv01.id,
            event_type="CVE Exploit Attempt",
            source_ip="185.220.101.45",
            user_account="deploy_admin",
            raw_log="POST /api/v1/containers/exec HTTP/1.1 - Malformed runc symlink payload triggering CVE-2024-21626",
            severity="Critical",
            timestamp=base_time + timedelta(minutes=45),
            anomaly_score=0.96,
            ml_prediction="Malicious",
            is_flagged_ml=True
        ),
        SecurityEvent(
            asset_id=db01.id,
            event_type="Lateral SSH Attempt",
            source_ip="185.220.101.45",
            user_account="postgres",
            raw_log="Unauthorized inter-VLAN SSH connection from Production Server (10.0.0.15) to Database (10.0.0.22)",
            severity="Critical",
            timestamp=base_time + timedelta(minutes=58),
            anomaly_score=0.94,
            ml_prediction="Malicious",
            is_flagged_ml=True
        ),
        SecurityEvent(
            asset_id=srv01.id,
            event_type="Outbound C2 Beacon",
            source_ip="185.220.101.45",
            user_account="system_daemon",
            raw_log="Outbound encrypted traffic burst to known C2 IP 194.26.29.112:443 (Periodic 60s jitter beacon)",
            severity="Critical",
            timestamp=base_time + timedelta(minutes=70),
            anomaly_score=0.98,
            ml_prediction="Malicious",
            is_flagged_ml=True
        )
    ]
    db.add_all(events)
    db.commit()
    print("[+] Seeding complete!")
