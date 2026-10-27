import React from 'react';
import { Shield, ShieldAlert, Cpu, Bell, Download, RefreshCw, UserCheck } from 'lucide-react';

export default function Navbar({ onRecalculate, isCalculating, userRole, setUserRole, onDownloadReport }) {
  return (
    <header className="h-16 bg-[#0c1222] border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              CYBER RISK & THREAT INTEL
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded">
              AI Powered
            </span>
          </div>
          <p className="text-xs text-slate-400">Enterprise Security Risk Assessment & Threat Intelligence Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time system pulse */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-mono">Dual-ML Models: Active</span>
        </div>

        {/* Recalculate Risk Trigger */}
        <button
          onClick={onRecalculate}
          disabled={isCalculating}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          title="Recalculate all risk scores with latest telemetry"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCalculating ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isCalculating ? 'Evaluating...' : 'Recalculate Risk'}</span>
        </button>

        {/* Export PDF Report */}
        <button
          onClick={onDownloadReport}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit PDF</span>
        </button>

        {/* Role Switcher for demonstration */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <UserCheck className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none pr-1 py-0.5 cursor-pointer font-medium"
          >
            <option value="Admin" className="bg-slate-900 text-slate-100">Role: Admin</option>
            <option value="Analyst" className="bg-slate-900 text-slate-100">Role: Security Analyst</option>
            <option value="Viewer" className="bg-slate-900 text-slate-100">Role: Executive Viewer</option>
          </select>
        </div>
      </div>
    </header>
  );
}
