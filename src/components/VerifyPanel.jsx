import React, { useState } from 'react'
import { Hammer, CheckCircle2, XCircle, AlertOctagon, Cpu, HardDrive, Layers, ChevronDown, ChevronUp, Terminal } from 'lucide-react'

export default function VerifyPanel({
  verificationResult,
  metrics,
  onRunVerify,
  isVerifying = false,
  isCheatingDemoActive = false
}) {
  const [showLogs, setShowLogs] = useState(false)

  const checks = [
    {
      id: 'compile',
      title: 'Compiler Check',
      subtitle: 'gcc 13.2 (-Wall -Wextra -Werror)',
      passed: verificationResult?.compiles ?? null,
      icon: Hammer,
    },
    {
      id: 'asan',
      title: 'AddressSanitizer (ASan + UBSan)',
      subtitle: 'Exploit payload & boundary crash test',
      passed: verificationResult?.sanitizer_passed ?? null,
      icon: AlertOctagon,
    },
    {
      id: 'nocheat',
      title: 'No-Cheating Heuristics',
      subtitle: 'Anti-bypass: no early return, no deletion',
      passed: verificationResult?.no_cheating_passed ?? null,
      icon: Layers,
    },
    {
      id: 'equiv',
      title: 'Equivalence Preservation',
      subtitle: 'Benign input behavior & return code',
      passed: verificationResult?.equivalence_passed ?? null,
      icon: CheckCircle2,
    }
  ]

  const overallPassed = verificationResult?.overall_status === 'passed'

  return (
    <aside className="w-80 border-l border-white/10 bg-[#020617]/90 flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Hammer className="w-4 h-4 text-emerald-400" />
          <span>Compile & Verify (M3)</span>
        </div>

        <button
          onClick={onRunVerify}
          disabled={isVerifying}
          className="btn-primary !py-1 !px-2.5 text-xs flex items-center gap-1"
        >
          {isVerifying ? (
            <>
              <div className="spinner !w-3 !h-3" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Hammer className="w-3.5 h-3.5" />
              <span>Run Check</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3 space-y-4 flex-1">
        {/* Overall Status Banner */}
        {verificationResult ? (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-slide-up ${
              overallPassed
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : 'bg-red-950/40 border-red-500/30 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {overallPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <div className="font-bold">
                  {overallPassed ? 'ALL VERIFICATION CHECKS PASSED' : 'VERIFICATION REJECTED'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {overallPassed ? 'Safe for IoT MCU deployment' : 'Patch violates safety or functional integrity'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                overallPassed
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {overallPassed ? 'PASS' : 'FAIL'}
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 text-center">
            Click <strong className="text-slate-200">Run Check</strong> or trigger an AI repair to initiate M3 sandbox verification.
          </div>
        )}

        {/* 4 Checkpoint Cards */}
        <div className="space-y-2">
          {checks.map(check => {
            const Icon = check.icon
            const isNull = check.passed === null
            return (
              <div
                key={check.id}
                className={`p-2.5 rounded-xl border transition-all text-xs ${
                  isNull
                    ? 'bg-slate-900/30 border-white/5 text-slate-400'
                    : check.passed
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-200'
                    : 'bg-red-950/30 border-red-500/30 text-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${
                      isNull ? 'text-slate-600' : check.passed ? 'text-emerald-400' : 'text-red-400'
                    }`} />
                    <div>
                      <div className="font-semibold text-xs text-white">{check.title}</div>
                      <div className="text-[10px] text-slate-400">{check.subtitle}</div>
                    </div>
                  </div>

                  <div>
                    {isNull ? (
                      <span className="text-[10px] font-mono text-slate-600">PENDING</span>
                    ) : check.passed ? (
                      <span className="badge-pass text-[10px]">✓ PASS</span>
                    ) : (
                      <span className="badge-fail text-[10px]">✗ FAIL</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Violations or Errors alert */}
        {verificationResult?.errors?.length > 0 && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 space-y-1">
            <div className="font-bold text-[11px] flex items-center gap-1.5 text-red-400">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Safety & Anti-Bypass Violations</span>
            </div>
            {verificationResult.errors.map((err, idx) => (
              <div key={idx} className="text-[11px] leading-relaxed font-mono pl-2 border-l-2 border-red-500/40 text-red-200">
                {err}
              </div>
            ))}
          </div>
        )}

        {/* IoT Resource Metrics (M4) */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>IoT Resource Impact</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              {metrics?.rom_efficiency_rating || 'Optimal'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <div className="text-slate-400 text-[10px]">Flash (ROM)</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {metrics ? `+${metrics.binary_size_delta_bytes} B` : '--'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <div className="text-slate-400 text-[10px]">SRAM (Stack)</div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                {metrics ? `${metrics.estimated_stack_delta_bytes >= 0 ? '+' : ''}${metrics.estimated_stack_delta_bytes} B` : '--'}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              <div className="text-slate-400 text-[10px]">Complexity</div>
              <div className="text-sm font-bold text-sky-300 font-mono mt-0.5">
                {metrics ? `${metrics.cyclomatic_complexity_delta >= 0 ? '+' : ''}${metrics.cyclomatic_complexity_delta}` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Raw Diagnostics Logs Toggle */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30 text-xs">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full p-2.5 flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Raw ASan / Compiler Output</span>
            </div>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showLogs && (
            <div className="p-2 border-t border-white/10 font-mono text-[10px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre bg-black/60">
              {verificationResult?.asan_log || verificationResult?.compiler_output || '// No execution logs recorded yet.'}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
