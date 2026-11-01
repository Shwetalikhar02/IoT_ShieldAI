import React, { useState } from 'react'
import {
  Wand2,
  Check,
  X,
  Send,
  GitCompare,
  Code2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react'

export default function RepairWorkbenchView({
  activeFile,
  vulnerabilities = [],
  activeVuln,
  candidatePatch,
  appliedPatches = [],
  verificationResult,
  onTriggerQuickFix,
  onAcceptPatch,
  onRejectPatch,
  onSendConstraint,
  chatHistory = []
}) {
  const [prompt, setPrompt] = useState('')
  const targetVuln = activeVuln || vulnerabilities[0]

  const handleSubmitConstraint = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    onSendConstraint(prompt.trim())
    setPrompt('')
  }

  const presets = [
    'Use snprintf with strict sizeof bounds',
    'Keep stack allocation under 128 bytes',
    'Return -1 and log error on invalid buffer size',
    'Ensure explicit NULL termination byte'
  ]

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              AI-Assisted Code Repair
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Multi-tier synthesis combining deterministic CWE templates with DeepSeek-Coder LLM refinement.
            </p>
          </div>

          {candidatePatch && (
            <div className="flex items-center gap-2">
              <button
                onClick={onRejectPatch}
                className="btn-quiet text-xs !text-[#F07878]"
              >
                Dismiss Patch
              </button>
              <button
                onClick={onAcceptPatch}
                className="btn-lime text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply & Verify Patch</span>
              </button>
            </div>
          )}
        </div>

        {/* Selected Vulnerability Card */}
        {targetVuln ? (
          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F3F5EF] text-sm">{targetVuln.vuln_type}</span>
                <span className="font-mono text-xs text-[#9AA39B]">{targetVuln.cwe_id}</span>
                <span className={targetVuln.severity === 'Critical' ? 'badge-critical-subtle' : 'badge-high-subtle'}>
                  {targetVuln.severity}
                </span>
              </div>
              <p className="text-[#9AA39B] text-xs leading-relaxed max-w-2xl">
                {targetVuln.root_cause} (in {targetVuln.file_path}:{targetVuln.line_start})
              </p>
            </div>

            {!candidatePatch && (
              <button
                onClick={() => onTriggerQuickFix(targetVuln)}
                className="btn-lime text-xs font-semibold py-2 px-4 shrink-0 flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate Repair</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-[#181D19] border border-[#2B332D] text-center text-[#9AA39B]">
            Select a vulnerability from Findings or the File Explorer to initiate remediation.
          </div>
        )}

        {/* Side-by-Side Code Diff (Original vs Repaired) */}
        {candidatePatch && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#F3F5EF] flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-[#B7E36A]" />
                <span>Code Remediation Review</span>
              </h3>
              <div className="text-[11px] font-mono text-[#9AA39B]">
                Strategy: <strong className="text-[#B7E36A] font-semibold">{candidatePatch.strategy.toUpperCase()}</strong> · Attempt #{candidatePatch.attempt_number || 1}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {/* Original Vulnerable Code */}
              <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#F07878] font-bold uppercase tracking-wider pb-1 border-b border-[#2B332D]">
                  <span>Original (Vulnerable)</span>
                  <span className="font-mono text-[10px] text-[#9AA39B]">L{targetVuln?.line_start}</span>
                </div>
                <pre className="p-3 rounded bg-[#101310] text-[#F07878] overflow-x-auto whitespace-pre font-mono leading-relaxed border border-[#2B332D]">
                  {candidatePatch.original_code}
                </pre>
                <p className="text-[11px] text-[#9AA39B] font-sans">
                  Risk: Unbounded memory access violating target buffer boundaries.
                </p>
              </div>

              {/* Repaired Secure Code */}
              <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#B7E36A] font-bold uppercase tracking-wider pb-1 border-b border-[#2B332D]">
                  <span>Proposed Patch (Secure)</span>
                  <span className="font-mono text-[10px] text-[#B7E36A]">Verified AST</span>
                </div>
                <pre className="p-3 rounded bg-[#101310] text-[#B7E36A] overflow-x-auto whitespace-pre font-mono leading-relaxed border border-[#2B332D]">
                  {candidatePatch.patched_code}
                </pre>
                <p className="text-[11px] text-[#9AA39B] font-sans">
                  {candidatePatch.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conversational Refinement (ChatRefine) */}
        <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[#F3F5EF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B7E36A]" />
              <span>Interactive Constraint Refinement</span>
            </h3>
            <span className="text-[11px] text-[#9AA39B]">Direct prompt injection</span>
          </div>

          <p className="text-[#9AA39B] text-xs">
            Instruct the synthesis engine with embedded constraints (e.g., specific bounded library calls, memory caps, or error return handling):
          </p>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => onSendConstraint(preset)}
                className="px-2.5 py-1 rounded bg-[#101310] hover:bg-[#1D231E] text-[#9AA39B] hover:text-[#F3F5EF] border border-[#2B332D] transition-colors text-[11px]"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmitConstraint} className="flex gap-2 pt-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Refine patch (e.g. 'Use snprintf with strict sizeof bounds', 'Limit stack footprint to 128B')..."
              className="flex-1 bg-[#101310] border border-[#2B332D] rounded-md py-1.5 px-3 text-xs text-[#F3F5EF] placeholder-[#626D64] focus:outline-none focus:border-[#B7E36A]/50 font-mono"
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="btn-lime text-xs font-medium py-1.5 px-4"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Refine</span>
            </button>
          </form>

          {/* Chat history if any */}
          {chatHistory.length > 0 && (
            <div className="mt-3 space-y-2 pt-3 border-t border-[#2B332D]">
              {chatHistory.slice(-4).map((msg, i) => (
                <div key={i} className="text-xs p-2.5 rounded bg-[#101310] border border-[#2B332D] space-y-1">
                  <div className="font-semibold text-[11px] font-mono text-[#B7E36A]">
                    {msg.role === 'user' ? 'Engineer Directive' : 'CodeShield Engine'}
                  </div>
                  <div className="text-[#F3F5EF] leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
