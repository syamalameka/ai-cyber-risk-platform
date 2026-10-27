import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assets from './pages/Assets.jsx';
import Vulnerabilities from './pages/Vulnerabilities.jsx';
import ThreatIntel from './pages/ThreatIntel.jsx';
import Events from './pages/Events.jsx';
import AttackCorrelation from './pages/AttackCorrelation.jsx';
import MLEvaluation from './pages/MLEvaluation.jsx';
import AIAssistant from './pages/AIAssistant.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('Analyst');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Core state
  const [riskOverview, setRiskOverview] = useState(null);
  const [assets, setAssets] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [threatIndicators, setThreatIndicators] = useState([]);
  const [events, setEvents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);

  const fetchAllData = async () => {
    try {
      const [rRes, aRes, vRes, tRes, eRes, iRes] = await Promise.all([
        fetch('/api/risk/overview'),
        fetch('/api/assets/'),
        fetch('/api/vulnerabilities/'),
        fetch('/api/threat-intel/'),
        fetch('/api/events/'),
        fetch('/api/correlation/incidents')
      ]);

      if (rRes.ok) setRiskOverview(await rRes.json());
      if (aRes.ok) setAssets(await aRes.json());
      if (vRes.ok) setVulnerabilities(await vRes.json());
      if (tRes.ok) setThreatIndicators(await tRes.json());
      if (eRes.ok) setEvents(await eRes.json());
      if (iRes.ok) setIncidents(await iRes.json());
    } catch (err) {
      console.error("Error fetching platform data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      await fetch('/api/risk/recalculate', { method: 'POST' });
      await fetchAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSimulateAttack = async () => {
    setIsSimulating(true);
    try {
      await fetch('/api/events/simulate-attack', { method: 'POST' });
      await fetchAllData();
      setActiveTab('attack-chains');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectAsset = async (assetId) => {
    try {
      const res = await fetch(`/api/assets/${assetId}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedAssetDetail(detail);
        if (activeTab !== 'assets') {
          setActiveTab('assets');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleExposure = async (assetId, isExposed) => {
    try {
      await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_internet_exposed: isExposed })
      });
      await fetchAllData();
      if (selectedAssetDetail && selectedAssetDetail.id === assetId) {
        handleSelectAsset(assetId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadReport = () => {
    window.open('/api/reports/download-pdf', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar
        onRecalculate={handleRecalculate}
        isCalculating={isCalculating}
        userRole={userRole}
        setUserRole={setUserRole}
        onDownloadReport={handleDownloadReport}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto bg-[#080c14]">
          {activeTab === 'dashboard' && (
            <Dashboard
              riskOverview={riskOverview}
              assets={assets}
              incidents={incidents}
              onSelectAsset={handleSelectAsset}
              onSimulateAttack={handleSimulateAttack}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'assets' && (
            <Assets
              assets={assets}
              onRefresh={fetchAllData}
              onSelectAsset={handleSelectAsset}
              selectedAssetDetail={selectedAssetDetail}
              onCloseDetail={() => setSelectedAssetDetail(null)}
              onToggleExposure={handleToggleExposure}
            />
          )}

          {activeTab === 'vulnerabilities' && (
            <Vulnerabilities
              vulnerabilities={vulnerabilities}
              assets={assets}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'threat-intel' && (
            <ThreatIntel
              threatIndicators={threatIndicators}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'events' && (
            <Events
              events={events}
              assets={assets}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'attack-chains' && (
            <AttackCorrelation
              incidents={incidents}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'ml-eval' && (
            <MLEvaluation />
          )}

          {activeTab === 'ai-analyst' && (
            <AIAssistant
              assets={assets}
              onDownloadReport={handleDownloadReport}
            />
          )}
        </main>
      </div>
    </div>
  );
}
