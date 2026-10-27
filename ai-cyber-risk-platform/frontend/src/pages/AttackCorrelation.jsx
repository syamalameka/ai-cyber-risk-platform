import React, { useState } from 'react';
import { GitFork, ShieldAlert, AlertTriangle, ArrowRight, Server, Shield, Radio, Terminal, ExternalLink } from 'lucide-react';

export default function AttackCorrelation({ incidents, onRefresh }) {
  const [selectedIncident, setSelectedIncident] = useState(incidents && incidents.length > 0 ? incidents[0] : null);

  const activeInc = selectedIncident || (incidents && incidents[0] ? incidents[0] : null);

  const getTacticColor = (tactic) => {
    switch (tactic) {
      case 'Reconnaissance':
      case 'Discovery': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Initial Access':
      case 'Credential Access': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Execution':
      case 'Privilege Escalation': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Lateral Movement': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'Command and Control':
      case 'Exfiltration': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Attack Chain Correlation & MITRE Mapping</h1>
          <p className="text-xs text-slate-400">Reconstructing multi-stage lateral kill chains across temporal event windows</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Correlated Incidents */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Correlated Incidents ({incidents?.length || 0})
          </div>

          <div className="space-y-2.5">
            {(incidents || []).map((inc) => {
              const isSelected = activeInc && activeInc.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0f172a] border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#0f172a]/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      inc.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {inc.detected_at ? inc.detected_at.substring(11, 19) + ' UTC' : 'Recent'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-xs text-white line-clamp-1">{inc.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{inc.description}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(inc.mitre_tactics || []).slice(0, 3).map((t, idx) => (
                      <span key={idx} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getTacticColor(t)}`}>
                        {t}
                      </span>
                    ))}
                    {(inc.mitre_tactics || []).length > 3 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        +{inc.mitre_tactics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Visual Attack Graph & Incident Details */}
        <div className="lg:col-span-2 space-y-6">
          {activeInc ? (
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                      INCIDENT #{activeInc.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Status: {activeInc.status}</span>
                  </div>
                  <h2 className="text-base font-bold text-white">{activeInc.title}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Target: <span className="text-cyan-400">{activeInc.target_asset}</span> | Attacker Source: <span className="text-rose-400">{activeInc.attacker_ip}</span>
                  </p>
                </div>
              </div>

              {/* MITRE ATT&CK Kill Chain Horizontal Stepper */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono block">
                  MITRE ATT&CK Progression Sequence:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {(activeInc.mitre_tactics || []).map((tactic, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`px-3 py-2 rounded-lg border text-center shrink-0 ${getTacticColor(tactic)}`}>
                        <span className="block text-[10px] font-mono text-slate-400">Phase {idx + 1}</span>
                        <span className="text-xs font-bold">{tactic}</span>
                      </div>
                      {idx < activeInc.mitre_tactics.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Interactive Attack Graph Diagram Visualizer */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono block">
                  Correlated Entity Graph (Attacker → Events → Compromised Assets):
                </span>
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/90 relative overflow-hidden min-h-[260px] flex flex-col justify-center">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                    {/* Attacker Node */}
                    <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-center w-40 shrink-0 shadow-lg shadow-rose-950/50">
                      <div className="h-8 w-8 mx-auto rounded-full bg-rose-600/30 flex items-center justify-center mb-1.5">
                        <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
                      </div>
                      <span className="text-[10px] font-mono text-rose-300 uppercase block font-semibold">Attacker Node</span>
                      <span className="text-xs font-mono font-bold text-white">{activeInc.attacker_ip}</span>
                      <span className="text-[9px] text-rose-400 block mt-0.5">Known Tor Exit Node</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-slate-400 mb-1">Inbound Exploitation</span>
                      <div className="w-16 h-[2px] bg-gradient-to-r from-rose-500 to-amber-500"></div>
                    </div>

                    {/* Multi-step Event Sequence Box */}
                    <div className="flex-1 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5" />
                        Correlated Forensic Event Sequence
                      </div>
                      <div className="space-y-1 text-xs">
                        {(activeInc.graph?.nodes || []).filter(n => n.type === 'event').map((node, i) => (
                          <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 border border-slate-800/60 text-[11px]">
                            <span className="text-slate-200 font-medium font-mono">{node.label}</span>
                            <span className="text-rose-400 font-mono font-semibold uppercase">{node.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-slate-400 mb-1">Lateral Pivot</span>
                      <div className="w-16 h-[2px] bg-gradient-to-r from-amber-500 to-cyan-500"></div>
                    </div>

                    {/* Target Asset Node */}
                    <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-center w-44 shrink-0 shadow-lg shadow-cyan-950/50">
                      <div className="h-8 w-8 mx-auto rounded-full bg-cyan-600/30 flex items-center justify-center mb-1.5">
                        <Server className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 uppercase block font-semibold">Target Infrastructure</span>
                      <span className="text-xs font-bold text-white line-clamp-1">{activeInc.target_asset}</span>
                      <span className="text-[9px] text-cyan-400 block mt-0.5">Critical Core Host</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Incident Narrative */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono block">
                  Automated Correlation Narrative:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  {activeInc.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-slate-800 text-slate-400">
              Select or generate a correlated incident to view the attack graph.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
