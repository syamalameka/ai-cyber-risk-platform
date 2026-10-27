import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Bug, 
  Radar, 
  GitFork, 
  Cpu, 
  Bot, 
  Activity,
  FileText
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Executive Risk', icon: LayoutDashboard, badge: null },
    { id: 'assets', label: 'Asset Inventory', icon: Server, badge: 'Live' },
    { id: 'vulnerabilities', label: 'CVE & Vulns', icon: Bug, badge: null },
    { id: 'threat-intel', label: 'Threat Intel (IOC)', icon: Radar, badge: null },
    { id: 'events', label: 'Security Logs', icon: Activity, badge: null },
    { id: 'attack-chains', label: 'Attack Chains', icon: GitFork, badge: 'MITRE' },
    { id: 'ml-eval', label: 'AI Threat Lab', icon: Cpu, badge: '94% F1' },
    { id: 'ai-analyst', label: 'AI Security Analyst', icon: Bot, badge: 'RAG' },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Security Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-800/50 shadow-sm shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-cyan-900/80 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cyber System Status Footer */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 m-2 rounded-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-mono">Defense Core:</span>
          <span className="text-emerald-400 font-semibold font-mono">v1.4.0 ONLINE</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Scoring: <span className="text-slate-300">Multi-Factor Contextual</span>
        </div>
        <div className="text-[11px] text-slate-400">
          ML: <span className="text-slate-300">Random Forest + Isolation Forest</span>
        </div>
      </div>
    </aside>
  );
}
