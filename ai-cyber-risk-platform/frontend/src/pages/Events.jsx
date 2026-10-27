import React, { useState } from 'react';
import { Activity, Plus, Search, AlertTriangle, ShieldCheck, ShieldAlert, Cpu, Terminal } from 'lucide-react';

export default function Events({ events, assets, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrediction, setFilterPrediction] = useState('ALL');
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    asset_id: '',
    event_type: 'Login Failed',
    source_ip: '185.220.101.45',
    user_account: 'root',
    raw_log: 'SSHD password failure for root from 185.220.101.45',
    severity: 'High',
    failed_login_count: 12,
    login_frequency: 8.5,
    country_change: 0,
    request_frequency: 45.0,
    port_activity_entropy: 3.2
  });

  const filteredEvents = (events || []).filter(e => {
    const matchesSearch = e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.source_ip.includes(searchTerm) ||
                          e.raw_log.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPred = filterPrediction === 'ALL' || e.ml_prediction === filterPrediction;
    return matchesSearch && matchesPred;
  });

  const handleIngest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newEvent,
        asset_id: parseInt(newEvent.asset_id || (assets[0] ? assets[0].id : 1)),
        failed_login_count: parseInt(newEvent.failed_login_count),
        login_frequency: parseFloat(newEvent.login_frequency),
        country_change: parseInt(newEvent.country_change),
        request_frequency: parseFloat(newEvent.request_frequency),
        port_activity_entropy: parseFloat(newEvent.port_activity_entropy)
      };

      const res = await fetch('/api/events/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowIngestModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Events & Real-time Log Stream</h1>
          <p className="text-xs text-slate-400">Ingested syslog, authentication telemetry, and dual-model ML detection classifications</p>
        </div>

        <button
          onClick={() => setShowIngestModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Ingest Security Log</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f172a] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by event, source IP, or payload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">ML Classification:</span>
          <select
            value={filterPrediction}
            onChange={(e) => setFilterPrediction(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Classifications</option>
            <option value="Malicious">Malicious</option>
            <option value="Suspicious">Suspicious</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Target Asset</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">ML Prediction</th>
                <th className="py-3 px-4">Anomaly Score</th>
                <th className="py-3 px-4">Raw Log Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium font-mono text-[11px]">
              {filteredEvents.map((e) => (
                <tr key={e.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {e.timestamp ? e.timestamp.replace('T', ' ').substring(0, 19) : 'Just now'}
                  </td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold whitespace-nowrap">
                    {e.asset_tag}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{e.event_type}</td>
                  <td className="py-3 px-4 text-rose-400 font-bold">{e.source_ip}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      e.ml_prediction === 'Malicious' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      e.ml_prediction === 'Suspicious' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {e.ml_prediction}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${
                      e.anomaly_score >= 0.7 ? 'text-rose-400' :
                      e.anomaly_score >= 0.4 ? 'text-orange-400' :
                      'text-emerald-400'
                    }`}>
                      {e.anomaly_score}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-xs truncate" title={e.raw_log}>
                    {e.raw_log}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingest Log Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleIngest} className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Ingest & Classify Security Event</h2>
              </div>
              <button type="button" onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Target Asset</label>
                  <select
                    value={newEvent.asset_id}
                    onChange={(e) => setNewEvent({...newEvent, asset_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {(assets || []).map(a => (
                      <option key={a.id} value={a.id}>{a.asset_tag} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Event Type</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Login Failed">Login Failed (Brute Force)</option>
                    <option value="Port Scan">Port Scan (Discovery)</option>
                    <option value="Impossible Travel">Impossible Travel</option>
                    <option value="CVE Exploit Attempt">CVE Exploit Attempt</option>
                    <option value="Lateral SSH Attempt">Lateral SSH Movement</option>
                    <option value="Outbound C2 Beacon">Outbound C2 Beacon</option>
                    <option value="HTTP Normal Request">Normal Web Traffic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Source IP Address</label>
                  <input
                    required
                    value={newEvent.source_ip}
                    onChange={(e) => setNewEvent({...newEvent, source_ip: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Target User Account</label>
                  <input
                    value={newEvent.user_account}
                    onChange={(e) => setNewEvent({...newEvent, user_account: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              {/* ML Feature Sliders */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 font-semibold block uppercase">
                  ML Feature Vector Parameters:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Failed Login Count: {newEvent.failed_login_count}</label>
                    <input 
                      type="range" min="0" max="50" 
                      value={newEvent.failed_login_count}
                      onChange={(e) => setNewEvent({...newEvent, failed_login_count: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Request Freq (req/s): {newEvent.request_frequency}</label>
                    <input 
                      type="range" min="1" max="150" 
                      value={newEvent.request_frequency}
                      onChange={(e) => setNewEvent({...newEvent, request_frequency: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Raw Log Entry</label>
                <textarea
                  rows="2"
                  value={newEvent.raw_log}
                  onChange={(e) => setNewEvent({...newEvent, raw_log: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Ingest & Run AI Models
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
