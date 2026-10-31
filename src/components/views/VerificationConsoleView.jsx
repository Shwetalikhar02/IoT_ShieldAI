import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Hammer,
  AlertOctagon,
  Layers,
  Terminal,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Play
} from 'lucide-react'

export default function VerificationConsoleView({
  verificationResult,
  onRunVerify,
  isVerifying = false,
  onOpenCheatingDemo
}) {
  const [activeTab, setActiveTab] = useState('asan') // 'asan' | 'compiler' | 'qemu'

  const stages = [
    {
      id: 'compiler',
      title: 'GCC Strict Compilation',
      desc: 'Compiler flags: -Wall -Wextra -Werror -O1',
      passed: verificationResult?.compiles ?? null,
      details: verificationResult?.compiler_output || 'Awaiting compilation run'
    },
    {
      id: 'asan',
      title: 'AddressSanitizer (ASan)',
      desc: 'Memory bounds, stack corruption, heap-use-after-free detector',
      passed: verificationResult?.sanitizer_passed ?? null,
      details: verificationResult?.asan_log || 'Awaiting ASan execution'
    },
    {
      id: 'ubsan',
      title: 'UndefinedBehaviorSanitizer (UBSan)',
      desc: 'Integer overflow, signed shifts, null pointer dereference catches',
      passed: verificationResult?.sanitizer_passed ?? null,
      details: 'Clean: 0 undefined behaviors detected in binary'
    },
    {
      id: 'nocheat',
      title: 'No-Cheating Syntactic & Semantic AST Verification',
      desc: 'Ensures LLM patches do not bypass execution with return; or delete calls',
      passed: verificationResult?.no_cheating_passed ?? null,
      details: verificationResult?.violations?.length > 0
        ? verificationResult.violations.join('\n')
        : 'All functional statements and call boundaries preserved.'
    },
    {
      id: 'qemu',
      title: 'Hardware-Free Emulation (QEMU virt)',
      desc: 'Bare-metal ARM Cortex-M4 simulated runtime',
      passed: verificationResult?.equivalence_passed ?? null,
      details: 'Simulated runtime execution completed with exit code 0.'
    }
  ]

  const overallPassed = verificationResult?.overall_status === 'passed'

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Compiler & Sandbox Verification (M3)
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Rigorous multi-stage validation ensuring candidate patches introduce zero memory errors, crashes, or functional bypasses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCheatingDemo}
              className="btn-quiet text-xs text-[#E5A854] hover:text-[#F3F5EF] flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Test Anti-Cheating Gate</span>
            </button>

            <button
              onClick={onRunVerify}
              disabled={isVerifying}
              className="btn-lime text-xs font-semibold flex items-center gap-1.5"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Running Checks...' : 'Execute Verification'}</span>
            </button>
          </div>
        </div>

        {/* Status Verdict Header Card */}
        {verificationResult ? (
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              overallPassed
                ? 'bg-[#181D19] border-[#B7E36A]/40 text-[#F3F5EF]'
                : 'bg-[#181D19] border-[#F07878]/40 text-[#F3F5EF]'
            }`}
          >
            <div className="flex items-center gap-3">
              {overallPassed ? (
                <CheckCircle2 className="w-6 h-6 text-[#B7E36A]" />
              ) : (
                <XCircle className="w-6 h-6 text-[#F07878]" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {overallPassed
                    ? 'VERIFICATION PASSED — MCU READY'
                    : 'VERIFICATION REJECTED — SAFETY VIOLATION'}
                </div>
                <div className="text-[11px] text-[#9AA39B] mt-0.5">
                  {overallPassed
                    ? 'All 5 checks passed cleanly. Zero memory corruption or functionality loss detected.'
                    : 'Patch failed verification criteria. Review violation diagnostics below.'}
                </div>
              </div>
            </div>

            <span
              className={
                overallPassed
                  ? 'badge-verified-subtle text-xs px-2.5 py-1'
                  : 'badge-critical-subtle text-xs px-2.5 py-1'
              }
            >
              {overallPassed ? 'ALL PASS ✓' : 'FAILED ✗'}
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] text-center text-[#9AA39B]">
            Click <strong>Execute Verification</strong> to trigger the GCC compiler, AddressSanitizer, and No-Cheating verification suite.
          </div>
        )}

        {/* 5 Stage Verification Matrix */}
        <div className="space-y-2">
          {stages.map((stg) => {
            const isPending = stg.passed === null
            return (
              <div
                key={stg.id}
                className="p-3.5 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#F3F5EF]">{stg.title}</span>
                  </div>
                  <div className="text-[11px] text-[#9AA39B]">{stg.desc}</div>
                </div>

                <div className="flex items-center gap-3">
                  {isPending ? (
                    <span className="font-mono text-[10px] text-[#626D64]">WAITING</span>
                  ) : stg.passed ? (
                    <span className="badge-verified-subtle text-xs">✓ PASS</span>
                  ) : (
                    <span className="badge-critical-subtle text-xs">✗ REJECTED</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed Logs Console */}
        <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[#2B332D]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F3F5EF]">
              <Terminal className="w-3.5 h-3.5 text-[#B7E36A]" />
              <span>Diagnostic Console Stream</span>
            </div>
            <span className="text-[10px] text-[#626D64]">stdout / stderr</span>
          </div>

          <pre className="p-3 rounded bg-[#101310] border border-[#2B332D] text-[#9AA39B] text-[11px] leading-relaxed overflow-x-auto whitespace-pre max-h-48">
            {verificationResult?.asan_log ||
              verificationResult?.compiler_output ||
              '// Verification sandbox idle. Run verification on a candidate patch to inspect logs.'}
          </pre>
        </div>
      </div>
    </div>
  )
}
