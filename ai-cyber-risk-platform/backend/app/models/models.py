from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Analyst")  # Admin, Analyst, Viewer
    created_at = Column(DateTime, default=utc_now)


class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String(50), unique=True, index=True, nullable=False)  # e.g. SRV-001
    name = Column(String(150), nullable=False)
    ip_address = Column(String(50), nullable=False)
    asset_type = Column(String(50), default="Server")  # Server, Database, Web Application, Workstation, Cloud Instance
    os = Column(String(100), default="Linux")
    criticality = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    owner = Column(String(100), default="IT Operations")
    is_internet_exposed = Column(Boolean, default=False)
    current_risk_score = Column(Float, default=0.0)
    current_risk_level = Column(String(20), default="Low")  # Low, Medium, High, Critical
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    vulnerabilities = relationship("Vulnerability", back_populates="asset", cascade="all, delete-orphan")
    security_events = relationship("SecurityEvent", back_populates="asset", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="asset", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="asset", cascade="all, delete-orphan")


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String(50), index=True, nullable=False)  # e.g. CVE-2024-21626
    description = Column(Text, nullable=False)
    cvss_score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # Critical, High, Medium, Low
    affected_product = Column(String(100), nullable=False)
    exploit_available = Column(Boolean, default=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    asset = relationship("Asset", back_populates="vulnerabilities")


class ThreatIndicator(Base):
    __tablename__ = "threat_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    ioc_type = Column(String(20), nullable=False)  # IP, Domain, URL, Hash
    value = Column(String(255), index=True, nullable=False)
    threat_type = Column(String(100), default="Malware")  # Malware, C2, Phishing, Brute Force, Scanner
    confidence = Column(Integer, default=85)  # 0-100%
    source = Column(String(100), default="Global Threat Feed")
    mitre_tactic = Column(String(100), default="Initial Access")
    first_seen = Column(DateTime, default=utc_now)
    last_seen = Column(DateTime, default=utc_now)


class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    event_type = Column(String(100), nullable=False)  # Login Failed, Login Success, Port Scan, SQLi Attempt, Outbound C2
    source_ip = Column(String(50), nullable=False)
    user_account = Column(String(100), default="anonymous")
    raw_log = Column(Text, nullable=False)
    severity = Column(String(20), default="Medium")
    timestamp = Column(DateTime, default=utc_now)
    anomaly_score = Column(Float, default=0.0)  # Computed by Isolation Forest
    ml_prediction = Column(String(50), default="Normal")  # Normal, Suspicious, Malicious
    is_flagged_ml = Column(Boolean, default=False)
    
    asset = relationship("Asset", back_populates="security_events")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    risk_level = Column(String(20), nullable=False)  # Low, Medium, High, Critical
    reason = Column(Text, nullable=False)
    
    # Component breakdown for complete transparency
    cvss_component = Column(Float, default=0.0)
    criticality_component = Column(Float, default=0.0)
    exposure_component = Column(Float, default=0.0)
    exploit_component = Column(Float, default=0.0)
    threat_intel_component = Column(Float, default=0.0)
    attack_activity_component = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)
    
    asset = relationship("Asset", back_populates="risk_assessments")


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(Integer, ForeignKey("risk_assessments.id"), nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    action = Column(Text, nullable=False)
    priority = Column(String(20), default="High")  # Critical, High, Medium, Low
    status = Column(String(20), default="Pending")  # Pending, In Progress, Resolved
    category = Column(String(50), default="Patching")  # Patching, Network, Access Control, Investigation
    created_at = Column(DateTime, default=utc_now)
    
    asset = relationship("Asset", back_populates="recommendations")


class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="High")
    status = Column(String(20), default="Open")  # Open, Investigating, Mitigated, Closed
    target_asset = Column(String(100), default="Unknown")
    attacker_ip = Column(String(50), default="Unknown")
    attack_chain_json = Column(Text, nullable=False)  # JSON representation of nodes and edges
    mitre_tactics = Column(String(255), default="Initial Access, Persistence")
    detected_at = Column(DateTime, default=utc_now)
