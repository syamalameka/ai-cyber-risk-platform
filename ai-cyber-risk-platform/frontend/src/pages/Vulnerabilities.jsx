import React, { useState } from 'react';
import { Bug, Search, AlertOctagon, CheckCircle, ExternalLink, Plus, X } from 'lucide-react';

export default function Vulnerabilities({ vulnerabilities, assets, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVuln, setNewVuln] = useState({
    cve_id: '',
    description: '',
    cvss_score: 8.5,
    severity: 'High',
    affected_product: '',
    exploit_available: false,
    asset_id: ''
  });

  const filteredVulns = (vulnerabilities || []).filter(v => {
    const matchesSearch = v.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.affected_product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = filterSeverity === 'ALL' || v.severity === filterSeverity;
    return matchesSearch && matchesSev;
  });

  const handleCreateVuln = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newVuln,
        cvss_score: parseFloat(newVuln.cvss_score),
        asset_id: newVuln.asset_id ? parseInt(newVuln.asset_id) : null
      };
      const res = await fetch('/api/vulnerabilities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewVuln({
          cve_id: '',
          description: '',
          cvss_score: 8.5,
          severity: 'High',
          affected_product: '',
          exploit_available: false,
          asset_id: ''
        });
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
          <h1 className="text-xl font-bold text-white tracking-tight">Vulnerability Management & CVE Catalog</h1>
          <p className="text-xs text-slate-400">CVSS v3.1 scoring, public exploit indicators, and asset association</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vulnerability</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f172a] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by CVE ID, package, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical (9.0 - 10.0)</option>
            <option value="High">High (7.0 - 8.9)</option>
            <option value="Medium">Medium (4.0 - 6.9)</option>
            <option value="Low">Low (0.1 - 3.9)</option>
          </select>
        </div>
      </div>

      {/* Vulnerabilities Table */}
      <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">CVE Identifier</th>
                <th className="py-3 px-4">Affected Software</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">CVSS Score</th>
                <th className="py-3 px-4">Exploit Available?</th>
                <th className="py-3 px-4">Mapped Asset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredVulns.map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-rose-400">{v.cve_id}</td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">{v.affected_product}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-md">{v.description}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      v.cvss_score >= 9.0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      v.cvss_score >= 7.0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {v.cvss_score} ({v.severity})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {v.exploit_available ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                        <AlertOctagon className="h-3 w-3" />
                        YES (ACTIVE PoC)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">None known</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-cyan-400 text-xs font-semibold">
                      {v.asset_tag !== 'N/A' ? `${v.asset_tag} (${v.asset_name})` : 'Unassigned'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vulnerability Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateVuln} className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white">Add CVE Vulnerability</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">CVE ID</label>
                <input
                  required
                  placeholder="e.g. CVE-2024-3094"
                  value={newVuln.cve_id}
                  onChange={(e) => setNewVuln({...newVuln, cve_id: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Affected Product / Library</label>
                <input
                  required
                  placeholder="e.g. xz-utils 5.6.0"
                  value={newVuln.affected_product}
                  onChange={(e) => setNewVuln({...newVuln, affected_product: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">CVSS Score (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newVuln.cvss_score}
                    onChange={(e) => setNewVuln({...newVuln, cvss_score: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Severity</label>
                  <select
                    value={newVuln.severity}
                    onChange={(e) => setNewVuln({...newVuln, severity: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assign to Asset</label>
                <select
                  value={newVuln.asset_id}
                  onChange={(e) => setNewVuln({...newVuln, asset_id: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Target Asset</option>
                  {(assets || []).map(a => (
                    <option key={a.id} value={a.id}>{a.asset_tag} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Summary of flaw and impact..."
                  value={newVuln.description}
                  onChange={(e) => setNewVuln({...newVuln, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exploit"
                  checked={newVuln.exploit_available}
                  onChange={(e) => setNewVuln({...newVuln, exploit_available: e.target.checked})}
                  className="rounded border-slate-800 bg-slate-900 text-cyan-500"
                />
                <label htmlFor="exploit" className="text-slate-300 cursor-pointer">
                  Public weaponized exploit code available
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
                Save Vulnerability
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
