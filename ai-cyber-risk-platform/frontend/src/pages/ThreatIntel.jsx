import React, { useState } from 'react';
import { Radar, Search, ShieldCheck, ShieldAlert, Plus, X, Globe, Hash, Link as LinkIcon, Database } from 'lucide-react';

export default function ThreatIntel({ threatIndicators, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIOC, setNewIOC] = useState({
    ioc_type: 'IP',
    value: '',
    threat_type: 'Malware C2',
    confidence: 90,
    source: 'Commercial Threat Feed',
    mitre_tactic: 'Command and Control'
  });

  const filteredIOCs = (threatIndicators || []).filter(i => 
    i.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.threat_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/threat-intel/lookup?value=${encodeURIComponent(lookupQuery.trim())}`);
      const data = await res.json();
      setLookupResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCreateIOC = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/threat-intel/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIOC)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewIOC({
          ioc_type: 'IP',
          value: '',
          threat_type: 'Malware C2',
          confidence: 90,
          source: 'Commercial Threat Feed',
          mitre_tactic: 'Command and Control'
        });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'IP': return <Globe className="h-3.5 w-3.5 text-cyan-400" />;
      case 'Domain': return <Globe className="h-3.5 w-3.5 text-blue-400" />;
      case 'Hash': return <Hash className="h-3.5 w-3.5 text-purple-400" />;
      default: return <LinkIcon className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Threat Intelligence & IOC Database</h1>
          <p className="text-xs text-slate-400">Correlate Indicators of Compromise (IPs, domains, hashes) with MITRE ATT&CK tactics</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Indicator (IOC)</span>
        </button>
      </div>

      {/* Interactive IOC Lookup Bar */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <Radar className="h-4 w-4" />
            Live Threat Reputation Lookup
          </span>
          <span className="text-[11px] text-slate-400">Check any IP, domain or payload hash</span>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 185.220.101.45 or update-sec-cdn.top"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            type="submit"
            disabled={isLookingUp}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition"
          >
            {isLookingUp ? 'Querying...' : 'Query Threat Feed'}
          </button>
        </form>

        {lookupResult && (
          <div className={`mt-3 p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            lookupResult.matched
              ? 'bg-rose-950/30 border-rose-800/80 text-rose-300'
              : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
          }`}>
            <div className="flex items-center gap-3">
              {lookupResult.matched ? (
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <span className="font-bold font-mono text-sm">{lookupResult.value}</span>
                {lookupResult.matched ? (
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Threat: <b className="text-rose-400">{lookupResult.threat_type}</b> • Confidence: <b>{lookupResult.confidence}%</b> • Source: {lookupResult.source} • MITRE: {lookupResult.mitre_tactic}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-300 mt-0.5">{lookupResult.message}</p>
                )}
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              lookupResult.matched ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {lookupResult.status || (lookupResult.matched ? 'MALICIOUS' : 'CLEAN')}
            </span>
          </div>
        )}
      </div>

      {/* IOC Grid / Table */}
      <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter threat indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">Total IOCs: {filteredIOCs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Indicator Value</th>
                <th className="py-3 px-4">Threat Classification</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">MITRE ATT&CK Tactic</th>
                <th className="py-3 px-4">Source Intelligence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredIOCs.map((ioc) => (
                <tr key={ioc.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                      {getTypeIcon(ioc.ioc_type)}
                      {ioc.ioc_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-400">{ioc.value}</td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">{ioc.threat_type}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      ioc.confidence >= 90 ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {ioc.confidence}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {ioc.mitre_tactic}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{ioc.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add IOC Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateIOC} className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Add Threat Indicator (IOC)</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Indicator Type</label>
                  <select
                    value={newIOC.ioc_type}
                    onChange={(e) => setNewIOC({...newIOC, ioc_type: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="IP">IP Address</option>
                    <option value="Domain">Domain Name</option>
                    <option value="URL">Malicious URL</option>
                    <option value="Hash">Payload Hash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Confidence Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newIOC.confidence}
                    onChange={(e) => setNewIOC({...newIOC, confidence: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Indicator Value</label>
                <input
                  required
                  placeholder="e.g. 198.51.100.23 or c2-beacon.ru"
                  value={newIOC.value}
                  onChange={(e) => setNewIOC({...newIOC, value: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Threat Classification</label>
                <input
                  required
                  placeholder="e.g. Cobalt Strike C2 / Mirai Botnet"
                  value={newIOC.threat_type}
                  onChange={(e) => setNewIOC({...newIOC, threat_type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">MITRE ATT&CK Tactic</label>
                <select
                  value={newIOC.mitre_tactic}
                  onChange={(e) => setNewIOC({...newIOC, mitre_tactic: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Initial Access">Initial Access</option>
                  <option value="Execution">Execution</option>
                  <option value="Persistence">Persistence</option>
                  <option value="Privilege Escalation">Privilege Escalation</option>
                  <option value="Discovery">Discovery</option>
                  <option value="Lateral Movement">Lateral Movement</option>
                  <option value="Command and Control">Command and Control</option>
                  <option value="Exfiltration">Exfiltration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Source Feed / Origin</label>
                <input
                  placeholder="e.g. AlienVault OTX, AbuseIPDB, Internal CTI"
                  value={newIOC.source}
                  onChange={(e) => setNewIOC({...newIOC, source: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
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
                Save Indicator
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
