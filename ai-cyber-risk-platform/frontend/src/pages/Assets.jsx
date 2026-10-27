import React, { useState } from 'react';
import { 
  Server, 
  Search, 
  Plus, 
  Globe, 
  Lock, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  Layers
} from 'lucide-react';

export default function Assets({ assets, onRefresh, onSelectAsset, selectedAssetDetail, onCloseDetail, onToggleExposure }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriticality, setFilterCriticality] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    asset_tag: '',
    name: '',
    ip_address: '',
    asset_type: 'Server',
    os: 'Ubuntu 22.04 LTS',
    criticality: 'Medium',
    owner: 'IT Operations',
    is_internet_exposed: false
  });

  const filteredAssets = (assets || []).filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.ip_address.includes(searchTerm);
    const matchesCrit = filterCriticality === 'ALL' || a.criticality === filterCriticality;
    return matchesSearch && matchesCrit;
  });

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/assets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewAsset({
          asset_tag: '',
          name: '',
          ip_address: '',
          asset_type: 'Server',
          os: 'Ubuntu 22.04 LTS',
          criticality: 'Medium',
          owner: 'IT Operations',
          is_internet_exposed: false
        });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Organization Asset Inventory</h1>
          <p className="text-xs text-slate-400">Discover, classify, and track operational criticalities across enterprise endpoints</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f172a] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset tag, name, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Criticality:</span>
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-md hover:border-slate-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {asset.asset_tag}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                  asset.criticality === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  asset.criticality === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {asset.criticality}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-white line-clamp-1">{asset.name}</h3>
                <p className="text-xs font-mono text-slate-400">{asset.ip_address} • {asset.os}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Exposure:</span>
                <button
                  onClick={() => onToggleExposure(asset.id, !asset.is_internet_exposed)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    asset.is_internet_exposed 
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800 hover:bg-rose-900' 
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                  }`}
                  title="Click to toggle external internet exposure"
                >
                  {asset.is_internet_exposed ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>{asset.is_internet_exposed ? 'INTERNET EXPOSED' : 'ISOLATED'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cyber Risk</span>
                <span className={`text-base font-extrabold font-mono ${
                  asset.current_risk_score >= 70 ? 'text-rose-400' :
                  asset.current_risk_score >= 40 ? 'text-orange-400' :
                  'text-emerald-400'
                }`}>
                  {asset.current_risk_score}/100
                </span>
              </div>

              <button
                onClick={() => onSelectAsset(asset.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 flex items-center gap-1"
              >
                <span>Risk Breakdown</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Risk Breakdown Modal / Drawer */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {selectedAssetDetail.asset_tag}
                  </span>
                  <h2 className="text-lg font-bold text-white">{selectedAssetDetail.name}</h2>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  IP: {selectedAssetDetail.ip_address} | Type: {selectedAssetDetail.asset_type} | Owner: {selectedAssetDetail.owner}
                </p>
              </div>
              <button onClick={onCloseDetail} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score & Component Factor Grid */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase">Contextual Risk Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold font-mono ${
                      selectedAssetDetail.current_risk_score >= 70 ? 'text-rose-400' :
                      selectedAssetDetail.current_risk_score >= 40 ? 'text-orange-400' :
                      'text-emerald-400'
                    }`}>
                      {selectedAssetDetail.current_risk_score}/100
                    </span>
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      ({selectedAssetDetail.current_risk_level})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">External Surface:</span>
                  <span className={`text-xs font-mono font-semibold ${selectedAssetDetail.is_internet_exposed ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedAssetDetail.is_internet_exposed ? 'Directly Publicly Exposed' : 'Protected Internal Perimeter'}
                  </span>
                </div>
              </div>

              {/* Component breakdown meters */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300">Factor Contribution Breakdown:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">CVSS Component</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAssetDetail.risk_components?.cvss} / 25 pts</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Criticality Weight</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAssetDetail.risk_components?.criticality} / 20 pts</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Internet Exposure</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAssetDetail.risk_components?.exposure} / 15 pts</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Exploit Availability</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAssetDetail.risk_components?.exploit} / 15 pts</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Threat Intel Matches</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAssetDetail.risk_components?.threat_intel} / 12.5 pts</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">AI Attack Activity</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAssetDetail.risk_components?.attack_activity} / 12.5 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Automated Risk Rationale:</h4>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                {selectedAssetDetail.risk_reason}
              </div>
            </div>

            {/* Associated Vulnerabilities */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Associated Vulnerabilities:</h4>
              <div className="space-y-1.5">
                {(selectedAssetDetail.vulnerabilities || []).length > 0 ? (
                  selectedAssetDetail.vulnerabilities.map(v => (
                    <div key={v.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-400">{v.cve_id}</span>
                          <span className="text-slate-400">• {v.affected_product}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{v.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-white">CVSS {v.cvss_score}</span>
                        {v.exploit_available && (
                          <span className="block text-[9px] text-rose-400 font-mono font-semibold">EXPLOIT READY</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No CVEs linked to this asset.</p>
                )}
              </div>
            </div>

            {/* Priority Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recommended Playbook:</h4>
              <div className="space-y-1.5">
                {(selectedAssetDetail.recommendations || []).map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-200">{r.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateAsset} className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Register New Asset</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Asset Tag</label>
                <input
                  required
                  placeholder="e.g. SRV-003"
                  value={newAsset.asset_tag}
                  onChange={(e) => setNewAsset({...newAsset, asset_tag: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Asset Name</label>
                <input
                  required
                  placeholder="e.g. Payment Gateway Worker"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">IP Address</label>
                <input
                  required
                  placeholder="e.g. 10.0.1.55"
                  value={newAsset.ip_address}
                  onChange={(e) => setNewAsset({...newAsset, ip_address: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Asset Type</label>
                  <select
                    value={newAsset.asset_type}
                    onChange={(e) => setNewAsset({...newAsset, asset_type: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Server">Server</option>
                    <option value="Database">Database</option>
                    <option value="Web Application">Web Application</option>
                    <option value="Cloud Instance">Cloud Instance</option>
                    <option value="Workstation">Workstation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Criticality</label>
                  <select
                    value={newAsset.criticality}
                    onChange={(e) => setNewAsset({...newAsset, criticality: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="exposed"
                  checked={newAsset.is_internet_exposed}
                  onChange={(e) => setNewAsset({...newAsset, is_internet_exposed: e.target.checked})}
                  className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                />
                <label htmlFor="exposed" className="text-slate-300 cursor-pointer">
                  Publicly exposed to the Internet (Open Ports)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Save Asset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
