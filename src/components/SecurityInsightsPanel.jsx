import React, { useState } from 'react'
import {
  ShieldAlert,
  Wand2,
  CheckCircle2,
  XCircle,
  Cpu,
  ChevronDown,
  ChevronUp,
  FileCode,
  Terminal,
  Zap,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import AIAssistantPanel from './AIAssistantPanel'

export default function SecurityInsightsPanel({
  activeFile,
  vulnerabilities = [],
  activeVuln = null,
  candidatePatch = null,
  verificationResult = null,
  metrics = null,
  onTriggerQuickFix,
  onRunVerify,
  isVerifying = false,
  projectId = null,
  defaultTab = 'insights'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab) // 'insights' | 'assistant'
  const [showLogs, setShowLogs] = useState(false)
  const currentVuln = activeVuln || vulnerabilities[0]

  const checks = [
    {
      id: 'compile',
      title: 'GCC Compiler Check',
      desc: '-Wall -Wextra -Werror',
      passed: verificationResult?.compiles ?? null
    },
    {
      id: 'asan',
      title: 'AddressSanitizer (ASan)',
      desc: 'Exploit payload memory check',
      passed: verificationResult?.sanitizer_passed ?? verificationResult?.sanitizerPassed ?? null
    },
    {
      id: 'nocheat',
      title: 'No-Cheating Heuristics',
      desc: 'Anti-bypass AST check',
      passed: verificationResult?.no_cheating_passed ?? verificationResult?.noCheatingPassed ?? null
    },
    {
      id: 'equiv',
      title: 'Equivalence Preservation',
      desc: 'Benign telemetry behavior',
      passed: verificationResult?.equivalence_passed ?? verificationResult?.equivalencePassed ?? null
    }
  ]

  return (
    <aside className="w-80 h-full bg-[#181D19] border-l border-[#2B332D] flex flex-col select-none shrink-0 text-xs overflow-hidden">
      {/* Dual Tab Header: Insights & AI Assistant */}
      <div className="h-10 px-2 border-b border-[#2B332D] flex items-center justify-between bg-[#1D231E]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'insights'
                ? 'bg-[#181D19] text-[#B7E36A] border border-[#2B332D]'
                : 'text-[#9AA39B] hover:text-[#F3F5EF]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Insights</span>
            {vulnerabilities.length > 0 && (
              <span className="font-mono text-[9px] text-[#F07878] bg-[#F07878]/10 px-1 py-0.2 rounded font-bold">
                {vulnerabilities.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'assistant'
                ? 'bg-[#181D19] text-[#B7E36A] border border-[#2B332D]'
                : 'text-[#9AA39B] hover:text-[#F3F5EF]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>

      {activeTab === 'assistant' ? (
        <AIAssistantPanel
          activeFile={activeFile}
          vulnerabilities={vulnerabilities}
          activeVuln={activeVuln}
          candidatePatch={candidatePatch}
          verificationResult={verificationResult}
          projectId={projectId}
        />
      ) : (
        <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          {/* Vulnerability Context Card */}
          {currentVuln ? (
            <div className="p-3.5 rounded-lg bg-[#1D231E] border border-[#2B332D] space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-[#F3F5EF] leading-snug">
                    {currentVuln.vuln_type || currentVuln.vulnType}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#9AA39B]">
                    <span>{currentVuln.cwe_id || currentVuln.cweId}</span>
                    <span>·</span>
                    <span>Line {currentVuln.line_start || currentVuln.lineStart}</span>
                  </div>
                </div>

                <span
                  className={
                    currentVuln.severity === 'Critical'
                      ? 'badge-critical-subtle'
                      : 'badge-high-subtle'
                  }
                >
                  {currentVuln.severity}
                </span>
              </div>

              <p className="text-[#9AA39B] text-xs leading-relaxed">
                {currentVuln.root_cause || currentVuln.rootCause}
              </p>

              {/* Code preview */}
              <div className="p-2 rounded bg-[#101310] border border-[#2B332D] font-mono text-[11px] text-[#F07878] truncate">
                {currentVuln.code_snippet || currentVuln.codeSnippet}
              </div>

              {/* Quick Action */}
              <button
                onClick={() => onTriggerQuickFix(currentVuln)}
                className="w-full btn-lime text-xs font-semibold py-1.5 mt-1"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Synthesize Secure Fix</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#1D231E] border border-[#2B332D] text-center space-y-1">
              <CheckCircle2 className="w-5 h-5 text-[#B7E36A] mx-auto mb-1.5" />
              <div className="font-medium text-[#F3F5EF]">Firmware Clean</div>
              <p className="text-[#9AA39B] text-[11px]">No active vulnerability in current buffer.</p>
            </div>
          )}

          {/* Verification Status Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#9AA39B] uppercase tracking-wider px-1">
              <span>M3 Sandbox Verification</span>
              <button
                onClick={onRunVerify}
                disabled={isVerifying}
                className="text-[#B7E36A] hover:underline font-mono text-[10px] cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? 'Running...' : 'Run verify'}
              </button>
            </div>

            <div className="space-y-1.5">
              {checks.map((chk) => {
                const isPending = chk.passed === null
                return (
                  <div
                    key={chk.id}
                    className="p-2 rounded-lg bg-[#1D231E] border border-[#2B332D] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-xs text-[#F3F5EF]">{chk.title}</div>
                      <div className="text-[10px] text-[#626D64] font-mono">{chk.desc}</div>
                    </div>

                    <div>
                      {isPending ? (
                        <span className="text-[10px] font-mono text-[#626D64]">WAITING</span>
                      ) : chk.passed ? (
                        <span className="badge-verified-subtle">✓ PASS</span>
                      ) : (
                        <span className="badge-critical-subtle">✗ FAIL</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Violations notice if any */}
          {(verificationResult?.errors?.length > 0 || verificationResult?.violations?.length > 0) && (
            <div className="p-2.5 rounded-lg bg-[#F07878]/10 border border-[#F07878]/30 space-y-1 text-xs">
              <div className="font-semibold text-[#F07878] text-[11px]">Verification Violations</div>
              {[...(verificationResult.errors || []), ...(verificationResult.violations || [])].map((err, i) => (
                <p key={i} className="text-[#F07878]/90 font-mono text-[10px] leading-relaxed">
                  • {err}
                </p>
              ))}
            </div>
          )}

          {/* IoT Resource Telemetry (Flash/RAM) */}
          <div className="p-3 rounded-lg bg-[#1D231E] border border-[#2B332D] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#9AA39B] uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#B7E36A]" />
                <span>Resource Footprint</span>
              </div>
              <span className="text-[#B7E36A] font-mono text-[10px] font-semibold">
                {metrics?.rom_efficiency_rating || 'Nominal'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-1.5 rounded bg-[#101310] border border-[#2B332D]">
                <div className="text-[10px] text-[#626D64]">Flash</div>
                <div className="text-xs font-semibold text-[#F3F5EF] mt-0.5">
                  {metrics ? `+${metrics.binary_size_delta_bytes}B` : '--'}
                </div>
              </div>

              <div className="p-1.5 rounded bg-[#101310] border border-[#2B332D]">
                <div className="text-[10px] text-[#626D64]">SRAM</div>
                <div className="text-xs font-semibold text-[#B7E36A] mt-0.5">
                  {metrics ? `${metrics.estimated_stack_delta_bytes}B` : '--'}
                </div>
              </div>

              <div className="p-1.5 rounded bg-[#101310] border border-[#2B332D]">
                <div className="text-[10px] text-[#626D64]">Complexity</div>
                <div className="text-xs font-semibold text-[#F3F5EF] mt-0.5">
                  {metrics ? `+${metrics.cyclomatic_complexity_delta}` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Raw Compiler/Sanitizer Output */}
          <div className="border border-[#2B332D] rounded-lg overflow-hidden bg-[#101310]">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full p-2 flex items-center justify-between text-[#9AA39B] hover:text-[#F3F5EF] transition-colors font-mono text-[10px]"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#B7E36A]" />
                <span>Execution Logs & ASan Trace</span>
              </div>
              {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showLogs && (
              <div className="p-2 border-t border-[#2B332D] font-mono text-[10px] text-[#9AA39B] max-h-36 overflow-y-auto whitespace-pre bg-[#101310]">
                {verificationResult?.asan_log || verificationResult?.asanLog || verificationResult?.compiler_output || verificationResult?.compilerOutput || '// No execution logs recorded yet.'}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
