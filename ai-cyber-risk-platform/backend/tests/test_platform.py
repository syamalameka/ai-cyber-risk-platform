import unittest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.models.models import Asset, Vulnerability, ThreatIndicator, SecurityEvent
from app.services.risk_engine import calculate_asset_risk
from app.services.ml_engine import ml_engine
from app.services.rag_engine import rag_engine

class TestCyberRiskPlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def test_risk_scoring_critical_scenario(self):
        """Verify that a high-value, internet-exposed asset with an exploitable CVE yields Critical risk."""
        db = SessionLocal()
        try:
            # Clean up prior test run if exists
            db.query(Asset).filter(Asset.asset_tag == "TEST-CRIT-99").delete()
            db.commit()

            asset = Asset(
                asset_tag="TEST-CRIT-99",
                name="Critical Payment Server",
                ip_address="10.99.1.5",
                criticality="Critical",
                is_internet_exposed=True
            )
            db.add(asset)
            db.commit()
            db.refresh(asset)
            
            vuln = Vulnerability(
                cve_id="CVE-2024-TEST",
                description="Remote code execution test",
                cvss_score=9.8,
                severity="Critical",
                affected_product="TestDaemon",
                exploit_available=True,
                asset_id=asset.id
            )
            db.add(vuln)
            db.commit()
            
            score, level, reason, comp, recs = calculate_asset_risk(db, asset)
            
            self.assertGreaterEqual(score, 71.0, f"Expected Critical (>=71), got {score}")
            self.assertEqual(level, "Critical")
            self.assertGreaterEqual(comp["cvss"], 24.0)
            self.assertEqual(comp["exploit"], 15.0)
            self.assertEqual(comp["exposure"], 15.0)
            self.assertEqual(comp["criticality"], 20.0)
            self.assertTrue(len(recs) > 0)
        finally:
            db.close()

    def test_risk_scoring_low_scenario(self):
        """Verify that an internal workstation with no vulnerabilities yields Low risk."""
        db = SessionLocal()
        try:
            # Clean up prior test run if exists
            db.query(Asset).filter(Asset.asset_tag == "TEST-LOW-99").delete()
            db.commit()

            asset = Asset(
                asset_tag="TEST-LOW-99",
                name="Office Printer",
                ip_address="192.168.10.200",
                criticality="Low",
                is_internet_exposed=False
            )
            db.add(asset)
            db.commit()
            db.refresh(asset)
            
            score, level, reason, comp, recs = calculate_asset_risk(db, asset)
            
            self.assertLessEqual(score, 20.0, f"Expected Low (<=20), got {score}")
            self.assertEqual(level, "Low")
            self.assertEqual(comp["cvss"], 0.0)
            self.assertEqual(comp["exposure"], 0.0)
        finally:
            db.close()

    def test_ml_threat_detection(self):
        """Verify that ML models distinguish between normal and brute force attack vectors."""
        normal_features = {
            "failed_login_count": 0,
            "login_frequency": 0.5,
            "source_ip_reputation": 95.0,
            "country_change": 0,
            "request_frequency": 12.0,
            "port_activity_entropy": 0.5
        }
        pred_normal = ml_engine.predict_event(normal_features)
        self.assertEqual(pred_normal["prediction"], "Normal")
        self.assertLess(pred_normal["anomaly_score"], 0.6)
        
        attack_features = {
            "failed_login_count": 35,
            "login_frequency": 25.0,
            "source_ip_reputation": 10.0,
            "country_change": 1,
            "request_frequency": 120.0,
            "port_activity_entropy": 4.5
        }
        pred_attack = ml_engine.predict_event(attack_features)
        self.assertIn(pred_attack["prediction"], ["Suspicious", "Malicious"])
        self.assertGreater(pred_attack["anomaly_score"], 0.6)

    def test_rag_retrieval(self):
        """Verify that RAG engine retrieves relevant NIST/CIS guidelines."""
        docs = rag_engine.retrieve_context("brute force containment credentials", top_k=2)
        self.assertTrue(len(docs) > 0)
        titles = [d["title"] for d in docs]
        self.assertTrue(any("NIST" in t or "Multi-Factor" in t or "CIS" in t for t in titles))

if __name__ == "__main__":
    unittest.main()
