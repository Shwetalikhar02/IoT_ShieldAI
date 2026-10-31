import React, { useState } from 'react'
import { X, AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Play, Eye } from 'lucide-react'
import { CHEATING_PATCH_EXAMPLE } from '../data/firmwareSamples'
import { checkNoCheating } from '../services/verifier'

export default function CheatingDemoModal({ isOpen, onClose }) {
  const [cheatType, setCheatType] = useState('early_return') // 'early_return' | 'deletion'
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
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">M3 Anti-Cheating Bypass Demonstration</h2>
              <p className="text-xs text-amber-300 font-mono">Catching Adversarial & Lazy LLM Sanitizer Evasions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Standard sanitizers (ASan/UBSan) can be easily fooled by naive code LLMs that simply delete the vulnerable statement or insert early returns to bypass test executions.
            CodeShield AI incorporates <strong>No-Cheating Syntactic & Semantic AST Verification</strong> to guarantee genuine functional remediation.
          </p>

          {/* Selector */}
          <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => { setCheatType('early_return'); setCheckResult(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-colors ${
                cheatType === 'early_return'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Premature Return Bypass Cheat
            </button>
            <button
              onClick={() => { setCheatType('deletion'); setCheckResult(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-colors ${
                cheatType === 'deletion'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Sensitive Call Deletion Cheat
            </button>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div>
              <div className="text-slate-400 font-bold mb-1 uppercase text-[10px]">Original Vulnerable Code</div>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/5 text-red-200 overflow-x-auto whitespace-pre">
                {originalSnippet}
              </pre>
            </div>

            <div>
              <div className="text-amber-400 font-bold mb-1 uppercase text-[10px]">
                {cheatType === 'early_return' ? 'Adversarial Bypass Patch' : 'Lazy Truncation Patch'}
              </div>
              <pre className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 overflow-x-auto whitespace-pre">
                {cheatSnippet}
              </pre>
            </div>
          </div>

          {/* Run Verification Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-slate-400 text-[11px]">
              Expected: <span className="text-amber-300 font-bold">REJECTED with violation details</span>
            </div>
            <button
              onClick={handleRunNoCheatCheck}
              className="btn-primary !py-2 !px-4 text-xs flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Verify with M3 No-Cheating Gate</span>
            </button>
          </div>

          {/* Results Display */}
          {checkResult && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 animate-slide-up text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span>CHEATING ATTEMPT DETECTED & INTERCEPTED</span>
                </div>
                <span className="badge-fail">REJECTED</span>
              </div>

              <div className="space-y-1.5 pl-7 mt-2">
                {checkResult.violations.map((violation, idx) => (
                  <div key={idx} className="p-2 rounded bg-black/40 border border-red-500/20 text-red-200 font-mono text-[11px]">
                    ⛔ {violation}
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-[11px] pl-7 pt-1">
                The patch is blocked from compiler emission and fed back to the M2 repair loop for automatic regeneration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
