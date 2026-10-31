import React, { useState } from 'react'
import { X, ShieldAlert, CheckCircle2, XCircle, Play } from 'lucide-react'
import { CHEATING_PATCH_EXAMPLE } from '../data/firmwareSamples'
import { checkNoCheating } from '../services/verifier'

export default function CheatingDemoModal({ isOpen, onClose }) {
  const [cheatType, setCheatType] = useState('early_return')
  const [checkResult, setCheckResult] = useState(null)

  if (!isOpen) return null

  const originalSnippet = CHEATING_PATCH_EXAMPLE.original_code
  const cheatSnippet = cheatType === 'early_return'
    ? CHEATING_PATCH_EXAMPLE.cheating_patch_early_return
    : CHEATING_PATCH_EXAMPLE.cheating_patch_deletion

  const handleRunNoCheatCheck = () => {
    const res = checkNoCheating(originalSnippet, cheatSnippet)
    setCheckResult(res)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#181D19] border border-[#2B332D] rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#2B332D] flex items-center justify-between bg-[#101310]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[#E5A854]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F3F5EF]">Anti-Cheating Bypass Demonstration</h2>
              <p className="text-[11px] text-[#9AA39B] font-mono">Catching Adversarial & Lazy LLM Sanitizer Evasions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-[#9AA39B] leading-relaxed">
            Standard compiler sanitizers can be fooled by naive code LLMs that simply delete the vulnerable statement or insert premature returns. CodeShield AI enforces <strong>No-Cheating Syntactic & Semantic AST Verification</strong> to guarantee genuine functional remediation.
          </p>

          {/* Selector */}
          <div className="flex items-center gap-2 bg-[#101310] p-1 rounded-md border border-[#2B332D]">
            <button
              onClick={() => { setCheatType('early_return'); setCheckResult(null); }}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                cheatType === 'early_return'
                  ? 'bg-[#181D19] text-[#E5A854] border border-[#2B332D]'
                  : 'text-[#9AA39B] hover:text-[#F3F5EF]'
              }`}
            >
              1. Premature Return Bypass
            </button>
            <button
              onClick={() => { setCheatType('deletion'); setCheckResult(null); }}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                cheatType === 'deletion'
                  ? 'bg-[#181D19] text-[#E5A854] border border-[#2B332D]'
                  : 'text-[#9AA39B] hover:text-[#F3F5EF]'
              }`}
            >
              2. Sensitive Call Deletion
            </button>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="space-y-1">
              <div className="text-[#9AA39B] font-medium uppercase text-[10px]">Original Vulnerable Code</div>
              <pre className="p-3 rounded bg-[#101310] border border-[#2B332D] text-[#F07878] overflow-x-auto whitespace-pre">
                {originalSnippet}
              </pre>
            </div>

            <div className="space-y-1">
              <div className="text-[#E5A854] font-medium uppercase text-[10px]">
                {cheatType === 'early_return' ? 'Adversarial Bypass Patch' : 'Lazy Truncation Patch'}
              </div>
              <pre className="p-3 rounded bg-[#101310] border border-[#E5A854]/40 text-[#E5A854] overflow-x-auto whitespace-pre">
                {cheatSnippet}
              </pre>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[#9AA39B] font-mono text-[11px]">
              Expected outcome: <strong className="text-[#F07878]">REJECTED with violation details</strong>
            </span>
            <button
              onClick={handleRunNoCheatCheck}
              className="btn-lime text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Verify with Anti-Cheating Gate</span>
            </button>
          </div>

          {/* Results Display */}
          {checkResult && (
            <div className="p-3.5 rounded-lg bg-[#101310] border border-[#F07878]/30 space-y-2 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#F07878] font-semibold text-xs">
                  <XCircle className="w-4 h-4 text-[#F07878]" />
                  <span>CHEATING ATTEMPT DETECTED & INTERCEPTED</span>
                </div>
                <span className="badge-critical-subtle">REJECTED</span>
              </div>

              <div className="space-y-1 pl-6">
                {checkResult.violations.map((violation, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#181D19] border border-[#2B332D] text-[#F07878] font-mono text-[10px]">
                    ⛔ {violation}
                  </div>
                ))}
              </div>
              <p className="text-[#9AA39B] text-[10px] pl-6">
                The patch is blocked from compiler emission and fed back to the M2 repair loop for automatic regeneration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
