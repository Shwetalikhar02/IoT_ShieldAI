import React from 'react'
import { Play, Zap, AlertTriangle, BarChart3, ChevronRight, User } from 'lucide-react'

export default function TopNav({
  activeFile,
  activeView,
  onRunScan,
  onRunPipeline,
  onOpenBenchmark,
  onOpenCheatingDemo,
  pipelineRunning = false,
  status = 'Ready',
  vulnCount = 0,
  userEmail = 'shwetalikhar.dev@gmail.com'
}) {
  const getInitials = (email) => {
    if (!email) return 'CS'
    const parts = email.split('@')[0].split('.')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <header className="h-14 bg-[#101310] border-b border-[#2B332D] px-5 flex items-center justify-between select-none shrink-0 z-20">
      {/* Breadcrumb / Context */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#9AA39B] font-medium">Firmware Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#626D64]" />
        <span className="text-[#F3F5EF] font-semibold tracking-tight">
          {activeFile?.name || 'firmware.c'}
        </span>
        <span className="text-[#626D64] font-mono text-[11px] hidden sm:inline">·</span>
        <span className="text-[#9AA39B] font-mono text-[11px] hidden sm:inline">
          ARM Cortex-M4 (Bare-Metal)
        </span>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#9AA39B]">
          <span className={`w-1.5 h-1.5 rounded-full ${vulnCount > 0 ? 'bg-[#E5A854]' : 'bg-[#B7E36A]'}`} />
          <span>
            {pipelineRunning
              ? 'Analyzing...'
              : vulnCount > 0
              ? `${vulnCount} findings active`
              : 'Firmware clean'}
          </span>
        </div>

        {/* Cheating Demo Button */}
        <button
          onClick={onOpenCheatingDemo}
          className="btn-quiet text-xs text-[#E5A854] hover:text-[#F3F5EF] hidden md:flex items-center gap-1.5"
          title="Verify how M3 No-Cheating check flags lazy/adversarial patches"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Cheating Guard</span>
        </button>

        {/* Benchmark Button */}
        <button
          onClick={onOpenBenchmark}
          className="btn-quiet text-xs hidden md:flex items-center gap-1.5"
          title="Run automated benchmark suite on all firmware test vectors"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#9AA39B]" />
          <span>Benchmark Suite</span>
        </button>

        {/* Scan (M1) */}
        <button
          onClick={onRunScan}
          disabled={pipelineRunning}
          className="btn-quiet text-xs flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 text-[#9AA39B]" />
          <span>Scan</span>
        </button>

        {/* Run Full Pipeline */}
        <button
          onClick={onRunPipeline}
          disabled={pipelineRunning}
          className="btn-lime text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          {pipelineRunning ? (
            <>
              <div className="cs-spinner" />
              <span>Remediating...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Full Pipeline</span>
            </>
          )}
        </button>

        {/* User Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[11px] font-mono font-semibold text-[#F3F5EF] cursor-pointer hover:border-[#B7E36A]/50 transition-colors"
          title={userEmail}
        >
          {getInitials(userEmail)}
        </div>
      </div>
    </header>
  )
}
