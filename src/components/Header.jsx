import React from 'react'
import { Shield, Play, Zap, AlertTriangle, FileText, BarChart2, Cpu, CheckCircle2, ChevronDown } from 'lucide-react'

export default function Header({
  activeFile,
  onRunAnalysis,
  onRunFullPipeline,
  onOpenCheatingDemo,
  onOpenReport,
  onOpenBenchmark,
  onOpenProviderModal,
  provider = 'Mock (Offline)',
  vulnStats = { total: 0, critical: 0, high: 0 },
  pipelineRunning = false,
  verificationStatus = null
}) {
  return (
    <header className="h-14 border-b border-white/10 bg-[#020617]/95 backdrop-blur-md px-4 flex items-center justify-between z-40 select-none">
      {/* Brand & Context */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              CodeShield AI
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                PS-15 IDE
              </span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            C/C++ Firmware Auto-Remediation
          </span>
        </div>

        {/* Active file tab */}
        {activeFile && (
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-white/10 text-xs text-slate-300 font-mono">
            <span className="text-sky-400 font-semibold">{activeFile.name}</span>
            {activeFile.cwe_id && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-white/5">
                {activeFile.cwe_id}
              </span>
            )}
            {vulnStats.total > 0 ? (
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] border border-red-500/30">
                {vulnStats.total} {vulnStats.total === 1 ? 'vulnerability' : 'vulnerabilities'}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Clean
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Provider badge */}
        <button
          onClick={onOpenProviderModal}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/10 transition-colors"
          title="Click to configure AI LLM / Mock provider"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px] text-slate-200">{provider}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Scan M1 */}
        <button
          onClick={onRunAnalysis}
          disabled={pipelineRunning}
          className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
          title="Run Module 1 static analysis on current firmware"
        >
          <Play className="w-3.5 h-3.5 text-sky-400" />
          <span>Scan (M1)</span>
        </button>

        {/* Run Full Pipeline */}
        <button
          onClick={onRunFullPipeline}
          disabled={pipelineRunning}
          className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
          title="Run closed-loop pipeline (M1 Detect → M2 Repair → M3 Verify → M4 Report)"
        >
          {pipelineRunning ? (
            <>
              <div className="spinner !w-3 !h-3" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Full Pipeline</span>
            </>
          )}
        </button>

        {/* Cheating Demo Button */}
        <button
          onClick={onOpenCheatingDemo}
          className="btn-secondary !py-1.5 !px-2.5 text-xs text-amber-300 hover:text-amber-200 border-amber-500/30 hover:border-amber-500/50 flex items-center gap-1.5"
          title="Test No-Cheating check against deliberate bypass patch"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Cheating Check</span>
        </button>

        {/* Benchmark Button */}
        <button
          onClick={onOpenBenchmark}
          className="btn-secondary !py-1.5 !px-2.5 text-xs text-sky-300 hover:text-sky-200 border-sky-500/30 hover:border-sky-500/50 flex items-center gap-1.5"
          title="Run automated benchmark suite on all demo & Juliet samples"
        >
          <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Benchmark</span>
        </button>

        {/* Report Button */}
        <button
          onClick={onOpenReport}
          className="btn-secondary !py-1.5 !px-2.5 text-xs flex items-center gap-1.5"
          title="View comprehensive M4 explainability and metrics audit report"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>
    </header>
  )
}
