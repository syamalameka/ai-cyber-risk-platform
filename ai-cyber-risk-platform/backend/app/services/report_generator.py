import io
from datetime import datetime, timezone
from typing import List, Dict, Any

def generate_pdf_security_report(
    organization_name: str,
    overall_risk: float,
    assets: List[Dict[str, Any]],
    incidents: List[Dict[str, Any]],
    top_recommendations: List[Dict[str, Any]]
) -> bytes:
    """
    Generates an executive-ready Cyber Risk & Threat Intelligence PDF report.
    Uses reportlab if available, with graceful fallback.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=15
        )
        heading2_style = ParagraphStyle(
            'Heading2Custom',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            'BodyCustom',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        
        # Header
        story.append(Paragraph(f"AI Cyber Risk & Threat Intelligence Assessment", title_style))
        story.append(Paragraph(f"Organization: <b>{organization_name}</b> | Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Confidential", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=15))
        
        # Executive Summary Box
        risk_color = colors.HexColor("#dc2626") if overall_risk >= 70 else colors.HexColor("#ea580c") if overall_risk >= 40 else colors.HexColor("#16a34a")
        risk_badge = "CRITICAL RISK" if overall_risk >= 70 else "HIGH RISK" if overall_risk >= 40 else "MODERATE/LOW"
        
        exec_data = [
            [
                Paragraph(f"<b>Overall Security Posture Score</b><br/><font size='22' color='{risk_color.hexval()}'><b>{overall_risk}/100</b></font><br/>Status: <b>{risk_badge}</b>", body_style),
                Paragraph(f"<b>Inventory Summary</b><br/>• Monitored Assets: <b>{len(assets)}</b><br/>• Active Incidents: <b>{len(incidents)}</b><br/>• Action Items: <b>{len(top_recommendations)}</b>", body_style)
            ]
        ]
        exec_table = Table(exec_data, colWidths=[260, 280])
        exec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(exec_table)
        story.append(Spacer(1, 15))
        
        # Top High-Risk Assets Section
        story.append(Paragraph("1. High-Priority Monitored Assets & Risk Exposure", heading2_style))
        asset_headers = ["Asset Tag", "Asset Name", "IP Address", "Type", "Criticality", "Exposed?", "Risk Score"]
        asset_rows = [[
            Paragraph(f"<b>{a.get('asset_tag', 'SRV')}</b>", body_style),
            Paragraph(a.get('name', 'Server')[:22], body_style),
            Paragraph(a.get('ip_address', '10.0.0.1'), body_style),
            Paragraph(a.get('asset_type', 'Server'), body_style),
            Paragraph(a.get('criticality', 'Med'), body_style),
            Paragraph("YES" if a.get('is_internet_exposed') else "No", body_style),
            Paragraph(f"<b>{a.get('current_risk_score', 0.0)}</b>", body_style),
        ] for a in sorted(assets, key=lambda x: x.get('current_risk_score', 0), reverse=True)[:8]]
        
        asset_table = Table([asset_headers] + asset_rows, colWidths=[65, 115, 80, 85, 65, 55, 65])
        asset_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(asset_table)
        story.append(Spacer(1, 15))
        
        # Correlated Incidents & Attack Chains
        story.append(Paragraph("2. Correlated Attack Chains & MITRE ATT&CK Incidents", heading2_style))
        if incidents:
            for inc in incidents[:3]:
                story.append(Paragraph(f"• <b>[{inc.get('severity', 'High').upper()}] {inc.get('title')}</b>", body_style))
                story.append(Paragraph(f"&nbsp;&nbsp;Target: {inc.get('target_asset')} | Attacker IP: {inc.get('attacker_ip')}", subtitle_style))
                story.append(Paragraph(f"&nbsp;&nbsp;{inc.get('description')}", body_style))
                story.append(Spacer(1, 5))
        else:
            story.append(Paragraph("No multi-stage attack chains active at this time.", body_style))
        story.append(Spacer(1, 15))
        
        # Prioritized Recommendations
        story.append(Paragraph("3. Evidence-Based Prioritized Remediation Actions", heading2_style))
        rec_data = [["Priority", "Category", "Action Item"]]
        for rec in top_recommendations[:6]:
            rec_data.append([
                Paragraph(f"<b>{rec.get('priority', 'High')}</b>", body_style),
                Paragraph(rec.get('category', 'Patching'), body_style),
                Paragraph(rec.get('action', 'Patch component'), body_style)
            ])
        rec_table = Table(rec_data, colWidths=[65, 85, 390])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ]))
        story.append(rec_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    except Exception as e:
        # Simple plain-text fallback format if reportlab is not ready
        text = f"AI Cyber Risk Report\nOrg: {organization_name}\nScore: {overall_risk}/100\nAssets: {len(assets)}\n"
        return text.encode('utf-8')
