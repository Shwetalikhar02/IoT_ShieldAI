import React, { useState } from 'react'
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Wand2,
  Hammer,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileCode,
  Layers,
  ArrowRight
} from 'lucide-react'

export default function CodeReviewView({
  vulnerabilities = [],
  activeVuln = null,
  candidatePatch = null,
  appliedReviews = [],
  onApproveFix,
  onRejectFix,
  onGenerateFix,
  onRequestRefinement,
  onRunVerification,
  isVerifying = false,
  verificationResult = null,
  onSelectVuln
}) {
  const [viewMode, setViewMode] = useState('sideBySide') // 'sideBySide' | 'diff'
  const [reviewNotes, setReviewNotes] = useState('')
  const [refinePrompt, setRefinePrompt] = useState('')

  const currentVuln = activeVuln || vulnerabilities[0]

  const handleApprove = () => {
    onApproveFix(candidatePatch, currentVuln, reviewNotes)
    setReviewNotes('')
  }

  const handleReject = () => {
    onRejectFix(candidatePatch, currentVuln, reviewNotes)
    setReviewNotes('')
  }

  const handleRefine = (e) => {
    e.preventDefault()
    if (!refinePrompt.trim()) return
    onRequestRefinement(refinePrompt.trim())
    setRefinePrompt('')
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              AI Code Review & Fix Approval
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Inspect AI-generated firmware patches, analyze MCU side-effects, and explicitly authorize source file updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'sideBySide' ? 'diff' : 'sideBySide')}
              className="btn-quiet text-xs font-mono"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{viewMode === 'sideBySide' ? 'Switch to Unified Diff' : 'Switch to Side-by-Side'}</span>
            </button>
          </div>
        </div>

        {/* Target Vulnerability Selector Bar */}
        <div className="p-3 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[#9AA39B] font-mono text-[11px] uppercase">Active Target:</span>
            {vulnerabilities.length === 0 ? (
              <span className="text-[#B7E36A] font-medium">All findings resolved</span>
            ) : (
              <select
                value={currentVuln?.id || ''}
                onChange={(e) => {
                  const found = vulnerabilities.find(v => (v.id || v.id) === e.target.value)
                  if (found) onSelectVuln(found)
                }}
                className="bg-[#101310] border border-[#2B332D] rounded-md py-1 px-3 text-xs text-[#F3F5EF] font-mono focus:outline-none focus:border-[#B7E36A]"
              >
                {vulnerabilities.map(v => (
                  <option key={v.id} value={v.id}>
                    [{v.severity}] {v.vuln_type || v.vulnType} ({v.cwe_id || v.cweId}) — {v.file_path || v.filePath}:{v.line_start || v.lineStart}
                  </option>
                ))}
              </select>
            )}
          </div>

          {currentVuln && (
            <span className={currentVuln.severity === 'Critical' ? 'badge-critical-subtle' : 'badge-high-subtle'}>
              {currentVuln.severity}
            </span>
          )}
        </div>

        {/* Patch Review Surface */}
        {candidatePatch ? (
          <div className="space-y-4">
            {/* Context & Side Effects Card */}
            <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#F3F5EF]">
                    {currentVuln?.vuln_type || 'Vulnerability Remediation'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-[#9AA39B]">
                    <span>CWE: {currentVuln?.cwe_id || currentVuln?.cweId}</span>
                    <span>·</span>
                    <span>Synthesis Strategy: {candidatePatch.strategy?.toUpperCase() || 'TEMPLATE'}</span>
                    <span>·</span>
                    <span>Attempt #{candidatePatch.attempt_number || candidatePatch.attemptNumber || 1}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1D231E] text-[#B7E36A] border border-[#2B332D]">
                    {candidatePatch.model_used || candidatePatch.modelUsed || 'CodeShield AST Synthesizer'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-lg bg-[#101310] border border-[#2B332D] space-y-1">
                  <div className="font-semibold text-[11px] text-[#B7E36A]">Explanation of Changes</div>
                  <p className="text-[#9AA39B] text-xs leading-relaxed">
                    {candidatePatch.explanation}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#101310] border border-[#2B332D] space-y-1">
                  <div className="font-semibold text-[11px] text-[#E5A854]">Embedded Side-Effect & Safety Assessment</div>
                  <p className="text-[#9AA39B] text-xs leading-relaxed">
                    Zero dynamic heap allocation added. Bounded buffer constraints preserve deterministic cycle count and stack limits on Cortex-M / RISC-V targets.
                  </p>
                </div>
              </div>
            </div>

            {/* Code Comparison */}
            {viewMode === 'sideBySide' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {/* Original Code */}
                <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#2B332D] text-[11px] text-[#F07878] font-bold">
                    <span>Original Source (Preserved)</span>
                    <span className="font-mono text-[10px] text-[#9AA39B]">
                      Line {currentVuln?.line_start || currentVuln?.lineStart}
                    </span>
                  </div>
                  <pre className="p-3 rounded bg-[#101310] border border-[#2B332D] text-[#F07878] overflow-x-auto whitespace-pre leading-relaxed">
                    {candidatePatch.original_code || candidatePatch.originalCode}
                  </pre>
                  <div className="text-[11px] text-[#9AA39B] font-sans">
                    Status: <span className="text-[#F07878]">Vulnerable to memory corruption</span>
                  </div>
                </div>

                {/* Proposed Secure Code */}
                <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#2B332D] text-[11px] text-[#B7E36A] font-bold">
                    <span>Proposed Secure Fix (Candidate)</span>
                    <span className="badge-verified-subtle text-[10px]">Bounded AST</span>
                  </div>
                  <pre className="p-3 rounded bg-[#101310] border border-[#2B332D] text-[#B7E36A] overflow-x-auto whitespace-pre leading-relaxed">
                    {candidatePatch.patched_code || candidatePatch.patchedCode}
                  </pre>
                  <div className="text-[11px] text-[#9AA39B] font-sans">
                    Status: <span className="text-[#B7E36A]">Pending human authorization</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2 font-mono">
                <div className="text-[11px] text-[#9AA39B] uppercase font-sans font-semibold">Unified Diff</div>
                <pre className="p-3 rounded bg-[#101310] border border-[#2B332D] text-xs overflow-x-auto whitespace-pre text-[#F3F5EF] leading-relaxed">
                  {candidatePatch.diff}
                </pre>
              </div>
            )}

            {/* Approval Decision Card */}
            <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#F3F5EF]">Code Review Sign-off</h4>
                <span className="text-[11px] text-[#9AA39B]">Explicit authorization required</span>
              </div>

              <div>
                <label className="block text-[11px] text-[#9AA39B] mb-1">
                  Optional Review Audit Notes / Rationale:
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified buffer bounds match hardware peripheral spec."
                  className="w-full bg-[#101310] border border-[#2B332D] rounded-md p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2B332D]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRunVerification}
                    disabled={isVerifying}
                    className="btn-quiet text-xs flex items-center gap-1.5"
                  >
                    <Hammer className="w-3.5 h-3.5 text-[#B7E36A]" />
                    <span>{isVerifying ? 'Verifying...' : 'Pre-flight Verification'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReject}
                    className="btn-quiet text-xs !text-[#F07878] hover:border-[#F07878]/50 flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Fix</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    className="btn-lime text-xs font-semibold py-2 px-4 flex items-center gap-1.5 shadow-md shadow-[#B7E36A]/15"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Apply to Firmware</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Refinement Box */}
            <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2">
              <div className="font-semibold text-xs text-[#F3F5EF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B7E36A]" />
                <span>Request Refined Alternative</span>
              </div>
              <p className="text-[11px] text-[#9AA39B]">
                Specify custom constraints (e.g. "Use snprintf", "Handle error with return -1", "Keep stack under 64 bytes"):
              </p>
              <form onSubmit={handleRefine} className="flex gap-2">
                <input
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Directive for synthesizer..."
                  className="flex-1 bg-[#101310] border border-[#2B332D] rounded-md py-1.5 px-3 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A] font-mono"
                />
                <button
                  type="submit"
                  disabled={!refinePrompt.trim()}
                  className="btn-quiet text-xs font-medium"
                >
                  Regenerate
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-10 rounded-lg bg-[#181D19] border border-[#2B332D] text-center space-y-3">
            <FileCode className="w-8 h-8 text-[#626D64] mx-auto" />
            <h3 className="font-semibold text-[#F3F5EF] text-sm">No Fix Candidate Awaiting Review</h3>
            <p className="text-[#9AA39B] text-xs max-w-md mx-auto">
              Inspect proposed security fixes, compare diffs, and approve changes before writing to firmware source.
            </p>
            {currentVuln && (
              <button
                onClick={() => onGenerateFix && onGenerateFix(currentVuln)}
                className="btn-lime text-xs font-semibold py-2 px-4 inline-flex items-center gap-1.5 shadow-md shadow-[#B7E36A]/10"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Synthesize Fix for {currentVuln.vuln_type || currentVuln.vulnType}</span>
              </button>
            )}
          </div>
        )}

        {/* Audit Trail of Past Review Decisions */}
        {appliedReviews.length > 0 && (
          <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
            <h3 className="font-semibold text-sm text-[#F3F5EF] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B7E36A]" />
              <span>Project Review Audit History</span>
            </h3>

            <div className="divide-y divide-[#2B332D]">
              {appliedReviews.map((rev) => (
                <div key={rev.id} className="py-2.5 flex items-center justify-between font-mono text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[#F3F5EF] font-semibold">Review #{rev.id.slice(-5)}</span>
                      <span className={rev.decision === 'approved' ? 'badge-verified-subtle' : 'badge-critical-subtle'}>
                        {rev.decision.toUpperCase()}
                      </span>
                    </div>
                    {rev.reviewNotes && (
                      <p className="text-[#9AA39B] font-sans text-[11px]">{rev.reviewNotes}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-[#626D64]">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
