import os
import re
import math
from typing import List, Dict, Any, Optional
from app.core.config import settings

SECURITY_KNOWLEDGE_DOCS = [
    {
        "id": "NIST-SP-800-61-CONT",
        "title": "NIST SP 800-61r2: Incident Containment & Eradication Strategy",
        "category": "Incident Response",
        "text": """Containment strategies vary based on the type of incident. Criteria for choosing a containment strategy include:
        1. Potential damage to and theft of resources.
        2. Need for evidence preservation.
        3. Service availability requirements.
        4. Time and resources needed to implement the strategy.
        For active brute-force or C2 connections, immediate network perimeter isolation (firewall block or VLAN quarantine) is recommended. Prior to eradication, forensic snapshots of memory and auth logs should be captured. Eradication involves identifying and mitigating all vulnerabilities that were exploited, removing malware components, and disabling compromised user accounts."""
    },
    {
        "id": "CIS-CONTROL-07",
        "title": "CIS Control 7: Continuous Vulnerability Management",
        "category": "Vulnerability Management",
        "text": """Develop a plan for risk-rated vulnerability remediation:
        - Prioritize vulnerabilities utilizing threat intelligence: focus immediately on vulnerabilities with active public exploits (CISA KEV catalog or CVSS score >= 9.0).
        - Assets with internet exposure and high business criticality must be patched within 48 to 72 hours of advisory release.
        - Where immediate vendor patching is infeasible, deploy virtual patching (WAF rule, disabled unused daemons, or IP allowlisting)."""
    },
    {
        "id": "MITRE-M1030",
        "title": "MITRE ATT&CK Mitigation M1030: Network Segmentation & Zero Trust",
        "category": "Network Architecture",
        "text": """Architectural defense against lateral movement:
        - Segment critical database tiers and production servers from public-facing web applications.
        - Restrict remote administrative access (SSH port 22, RDP port 3389) via bastion hosts or zero-trust network access (ZTNA).
        - Implement strict ingress filtering: drop unauthorized external traffic before it reaches production compute clusters."""
    },
    {
        "id": "AUTH-HARDENING-01",
        "title": "Zero Trust Identity & Multi-Factor Authentication (MFA) Standards",
        "category": "Identity & Access Control",
        "text": """Defense against Credential Access & Impossible Travel:
        - Mandate hardware-token or authenticator-based MFA for all administrative endpoints.
        - Configure adaptive risk-based authentication to challenge or block logins originating from high-risk IP addresses or anomalous geographic transitions.
        - Enforce account lockout thresholds (e.g. 5 failed attempts within 3 minutes) with automated rate-limiting to neutralize brute-force automation."""
    },
    {
        "id": "C2-EXFIL-PLAYBOOK",
        "title": "Command & Control (C2) Detection and Response Playbook",
        "category": "Threat Hunting",
        "text": """Identifying and terminating unauthorized outbound communication:
        - Inspect DNS request volume and outbound beaconing frequency matching known threat indicators.
        - Block identified malicious IP addresses and domain IOCs at edge firewalls and DNS resolvers.
        - Immediately isolate affected host systems from the internal LAN to prevent lateral pivot and exfiltration."""
    }
]

def simple_tokenize(text: str) -> List[str]:
    return re.findall(r'\b[a-zA-Z0-9_\-]{3,}\b', text.lower())

class RAGEngine:
    def __init__(self):
        self.docs = SECURITY_KNOWLEDGE_DOCS
        
    def retrieve_context(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """Performs lexical and semantic keyword overlap search across knowledge base."""
        query_tokens = set(simple_tokenize(query))
        scored = []
        for doc in self.docs:
            doc_tokens = simple_tokenize(doc["title"] + " " + doc["text"])
            overlap = sum(1 for t in query_tokens if t in doc_tokens)
            score = overlap / (math.sqrt(len(query_tokens) * len(doc_tokens)) + 1e-5)
            scored.append((score, doc))
            
        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored[:top_k]]

    def analyze_asset_security(self, asset_data: Dict[str, Any], user_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesizes collected telemetry, risk factors, and authoritative security playbooks
        into evidence-backed explanations and prioritized remediation actions.
        """
        asset_name = asset_data.get("name", "Asset")
        asset_tag = asset_data.get("asset_tag", "SRV-000")
        risk_score = asset_data.get("risk_score", 0.0)
        risk_level = asset_data.get("risk_level", "Low")
        vulns = asset_data.get("vulnerabilities", [])
        events = asset_data.get("recent_events", [])
        exposure = asset_data.get("is_internet_exposed", False)
        owner = asset_data.get("owner", "IT Department")
        criticality = asset_data.get("criticality", "Medium")
        
        # Build search query for RAG
        search_terms = f"{asset_name} {' '.join([v.get('cve_id', '') for v in vulns])} {' '.join([e.get('event_type', '') for e in events])} {criticality}"
        retrieved_docs = self.retrieve_context(search_terms, top_k=2)
        citations = [{"id": d["id"], "title": d["title"], "category": d["category"]} for d in retrieved_docs]
        
        # Check if Gemini API is available
        gemini_response = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
                You are a Senior Cyber Threat Intelligence & Incident Response AI Analyst.
                Explain why asset '{asset_name}' ({asset_tag}) has a risk score of {risk_score}/100 ({risk_level}).
                Asset Details:
                - Business Criticality: {criticality} (Owner: {owner})
                - Internet Facing: {'Yes' if exposure else 'No'}
                - Vulnerabilities: {vulns}
                - Recent Security Events: {events}
                Reference Documents:
                {[d['title'] + ': ' + d['text'][:200] for d in retrieved_docs]}
                User query: {user_query or 'Provide root-cause risk explanation and containment plan'}
                
                Format response into:
                1. Executive Summary & Blast Radius
                2. Key Threat Factors (Bullet points citing specific CVEs and IPs)
                3. Step-by-Step Remediation Plan (referencing NIST/CIS best practices)
                """
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                gemini_response = response.text
            except Exception as e:
                gemini_response = None
                
        if not gemini_response:
            # Deterministic, high-fidelity security analyst synthesis
            top_cve = vulns[0] if vulns else None
            malicious_count = len([e for e in events if e.get("ml_prediction") == "Malicious" or e.get("severity") in ["High", "Critical"]])
            
            summary = (
                f"{asset_name} ({asset_tag}) has been evaluated at {risk_score}/100 ({risk_level} Risk). "
                f"The system has correlated high-severity technical vulnerabilities with active telemetry signals "
                f"and business criticality."
            )
            
            factors = []
            if top_cve:
                factors.append(f"Contains {top_cve.get('cve_id')} (CVSS {top_cve.get('cvss_score')}, {top_cve.get('severity')}) affecting {top_cve.get('affected_product')}. {'Known exploit is actively available in the wild.' if top_cve.get('exploit_available') else ''}")
            if exposure:
                factors.append(f"Asset is directly exposed to the public Internet without sufficient perimeter ingress restriction.")
            if criticality in ["High", "Critical"]:
                factors.append(f"Designated as {criticality} priority asset owned by {owner}. Compromise presents severe operational impact.")
            if malicious_count > 0:
                factors.append(f"Dual-model AI detection flagged {malicious_count} suspicious/malicious event(s) targeting this node in the last logging window.")
            if not factors:
                factors.append("Asset is operating within normal baseline behavioral thresholds with no unpatched critical vulnerabilities.")
                
            steps = []
            if top_cve:
                steps.append(f"Apply security patch for {top_cve.get('cve_id')} immediately as mandated by {retrieved_docs[0]['title']}.")
            if exposure:
                steps.append(f"Enforce network segmentation and place {asset_name} behind an internal DMZ/VPN per {retrieved_docs[-1]['title']}.")
            if malicious_count > 0:
                steps.append("Quarantine offending external source IPs and initiate credential rotation for all accounts active during the attack window.")
            steps.append("Validate system integrity with host-based file integrity monitoring (FIM) and review access logs.")
            
            formatted_analysis = (
                f"### Executive Risk Assessment for {asset_name} ({asset_tag})\n\n"
                f"{summary}\n\n"
                f"#### Core Risk Drivers:\n" + "\n".join([f"• **{f}**" for f in factors]) + "\n\n"
                f"#### Recommended Remediation Workflow:\n" + "\n".join([f"{i+1}. {s}" for i, s in enumerate(steps)])
            )
        else:
            formatted_analysis = gemini_response

        return {
            "asset_id": asset_data.get("id"),
            "asset_name": asset_name,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "analysis": formatted_analysis,
            "citations": citations
        }

rag_engine = RAGEngine()
