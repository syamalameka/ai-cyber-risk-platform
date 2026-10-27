import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Download, Sparkles, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function AIAssistant({ assets, onDownloadReport }) {
  const [selectedAssetId, setSelectedAssetId] = useState(assets && assets[0] ? assets[0].id : 1);
  const [query, setQuery] = useState('Why is this asset classified with this risk score, and what is the containment plan?');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (customQuestion = null) => {
    const questionToAsk = customQuestion || query;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-analyst/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: parseInt(selectedAssetId),
          question: questionToAsk
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAsset = (assets || []).find(a => a.id === parseInt(selectedAssetId));

  const quickPrompts = [
    "Why is this asset classified at its current risk score?",
    "What is the recommended containment strategy under NIST SP 800-61?",
    "Analyze the potential blast radius and lateral movement risks.",
    "Draft an executive briefing for the CISO on this asset."
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
              Retrieval-Augmented Generation (RAG)
            </span>
            <span className="text-xs text-slate-400">Grounding in NIST, CIS & MITRE Playbooks</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI Security Analyst Assistant</h1>
          <p className="text-xs text-slate-400">Evidence-backed root cause explanations, blast radius modeling, and cited remediation</p>
        </div>

        <button
          onClick={onDownloadReport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset Target Selection & Quick Prompts */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono block mb-1.5">
                Select Target Asset to Investigate:
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setAnalysisResult(null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                {(assets || []).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.asset_tag} — {a.name} ({a.current_risk_level})
                  </option>
                ))}
              </select>
            </div>

            {selectedAsset && (
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Calculated Risk:</span>
                  <span className={`font-mono font-bold ${
                    selectedAsset.current_risk_score >= 70 ? 'text-rose-400' :
                    selectedAsset.current_risk_score >= 40 ? 'text-orange-400' :
                    'text-emerald-400'
                  }`}>
                    {selectedAsset.current_risk_score}/100 ({selectedAsset.current_risk_level})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Criticality:</span>
                  <span className="text-white font-semibold">{selectedAsset.criticality}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Exposure:</span>
                  <span className={selectedAsset.is_internet_exposed ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                    {selectedAsset.is_internet_exposed ? 'Internet Exposed' : 'Internal Only'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-lg space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono block">
              Suggested Analyst Questions:
            </span>
            <div className="space-y-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p);
                    handleAsk(p);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 hover:text-cyan-300 transition"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Query Input & AI Analysis Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask the AI Analyst about threats, vulnerabilities, or remediation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleAsk()}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition"
              >
                <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Analyzing Evidence...' : 'Generate Analysis'}</span>
              </button>
            </div>

            {/* Analysis Output Pane */}
            {analysisResult ? (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                {/* RAG Knowledge Citations */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/40">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mr-2 font-mono">
                    <BookOpen className="h-4 w-4" />
                    <span>Retrieved Authoritative Citations:</span>
                  </div>
                  {(analysisResult.citations || []).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 text-slate-300 border border-slate-700">
                      {c.title}
                    </span>
                  ))}
                </div>

                {/* Markdown-style Content Card */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans space-y-3 whitespace-pre-line">
                  {analysisResult.analysis}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-400 space-y-2">
                <Bot className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-xs">
                  Select an asset and submit a query or click any suggested question to generate evidence-grounded risk reasoning.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
