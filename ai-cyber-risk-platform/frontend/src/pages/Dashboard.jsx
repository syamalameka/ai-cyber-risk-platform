import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Server, 
  Bug, 
  Radar, 
  Flame, 
  ArrowUpRight, 
  ExternalLink,
  ChevronRight,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function Dashboard({ 
  riskOverview, 
  assets, 
  incidents, 
  onSelectAsset, 
  onSimulateAttack,
  isSimulating 
}) {
  const counts = riskOverview?.counts || {};
  const distribution = riskOverview?.distribution || { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const overallRisk = riskOverview?.overall_risk_score ?? 0;
  const overallLevel = riskOverview?.overall_risk_level || 'Low';

  const distData = [
    { name: 'Critical (71-100)', count: distribution.Critical, color: '#ef4444' },
    { name: 'High (41-70)', count: distribution.High, color: '#f97316' },
    { name: 'Medium (21-40)', count: distribution.Medium, color: '#eab308' },
    { name: 'Low (0-20)', count: distribution.Low, color: '#10b981' }
  ];

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'Critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Enterprise Risk Gauge & Simulation Trigger */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#0d1527] to-[#070b14] border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md uppercase tracking-wider bg-slate-800 text-cyan-400 border border-slate-700">
                Threat Posture
              </span>
              <span className="text-xs text-slate-400">Contextual Likelihood × Impact Assessment</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Cyber Risk Intelligence Overview
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Synthesizing CVSS technical vulnerabilities, business asset criticality, external attack surface exposure, real-time threat intelligence IOC feeds, and dual-model machine learning signals.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl shrink-0">
            <div className="text-center">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                Risk Score
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-4xl font-extrabold font-mono ${
                  overallRisk >= 70 ? 'text-rose-500' : overallRisk >= 40 ? 'text-orange-400' : 'text-emerald-400'
                }`}>
                  {overallRisk}
                </span>
                <span className="text-slate-400 text-sm font-mono">/100</span>
              </div>
              <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded border ${getRiskBadgeColor(overallLevel)}`}>
                {overallLevel.toUpperCase()}
              </span>
            </div>

            <div className="h-12 w-[1px] bg-slate-800"></div>

            <button
              onClick={onSimulateAttack}
              disabled={isSimulating}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs transition shadow-lg shadow-rose-900/30 active:scale-95 disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 ${isSimulating ? 'animate-bounce' : ''}`} />
              <span>{isSimulating ? 'Simulating Attack...' : 'Simulate Attack Chain'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored Assets</span>
            <Server className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{counts.total_assets || 0}</span>
            <span className="text-xs text-slate-400">Across 3 Subnets</span>
          </div>
          <div className="text-[11px] text-slate-400">Production, Cloud & Workstations</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Known Vulnerabilities</span>
            <Bug className="h-4 w-4 text-orange-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{counts.total_vulnerabilities || 0}</span>
            <span className="text-xs font-semibold text-rose-400 font-mono">
              {counts.critical_vulnerabilities || 0} Critical
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Tracked with CVSS v3.1 Metrics</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Threat Intel IOCs</span>
            <Radar className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{counts.threat_indicators || 0}</span>
            <span className="text-xs text-emerald-400 font-mono">94% Mean Conf</span>
          </div>
          <div className="text-[11px] text-slate-400">Malicious IPs, C2 & Malware Hashes</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Attack Chains</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{counts.active_incidents || 0}</span>
            <span className="text-xs text-rose-400 font-mono">MITRE Correlated</span>
          </div>
          <div className="text-[11px] text-slate-400">Multi-stage anomalous progressions</div>
        </div>
      </div>

      {/* Main Grid: Risk Distribution Chart + Priority Remediation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Asset Risk Distribution</h2>
              <p className="text-xs text-slate-400">Normalized 0–100 Cyber Risk Spectrum</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={95} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">Critical: <b className="text-white font-mono">{distribution.Critical}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span>
              <span className="text-slate-400">High: <b className="text-white font-mono">{distribution.High}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">Medium: <b className="text-white font-mono">{distribution.Medium}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400">Low: <b className="text-white font-mono">{distribution.Low}</b></span>
            </div>
          </div>
        </div>

        {/* Priority Remediation Recommendations */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Priority Evidence-Based Recommendations</h2>
              <p className="text-xs text-slate-400">Generated dynamically by Risk Engine to maximize posture improvement</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {(riskOverview?.priority_recommendations || []).slice(0, 4).map((rec) => (
              <div 
                key={rec.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                      rec.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{rec.category}</span>
                    <span className="text-xs text-cyan-400 font-medium">• {rec.asset_name}</span>
                  </div>
                  <p className="text-xs text-slate-200">{rec.action}</p>
                </div>

                <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 shrink-0">
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top High-Risk Assets Table */}
      <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800/90 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">High-Risk Asset Prioritization</h2>
            <p className="text-xs text-slate-400">Ranked by calculated cyber risk score</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset Tag</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Business Criticality</th>
                <th className="py-3 px-4">Internet Exposure</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(assets || []).slice(0, 6).map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono text-cyan-400">{asset.asset_tag}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{asset.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{asset.ip_address}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      asset.criticality === 'Critical' ? 'bg-rose-500/20 text-rose-400' :
                      asset.criticality === 'High' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {asset.is_internet_exposed ? (
                      <span className="flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        EXPOSED
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Internal Only</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        asset.current_risk_score >= 70 ? 'text-rose-400' :
                        asset.current_risk_score >= 40 ? 'text-orange-400' :
                        'text-emerald-400'
                      }`}>
                        {asset.current_risk_score}/100
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase ${getRiskBadgeColor(asset.current_risk_level)}`}>
                        {asset.current_risk_level}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectAsset(asset.id)}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
