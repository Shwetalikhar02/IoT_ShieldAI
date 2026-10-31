/**
 * pages/VerificationPage.jsx — M3 Verification (Step 4)
 *
 * Shows compile/ASan/no-cheating check results for each patch.
 * Visualises the 3-attempt repair loop with pass/fail indicators.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePipeline } from '../store/pipelineStore'

function CheckRow({ label, passed, skipped = false }) {
  const icon = skipped ? '–' : passed ? '✓' : '✗'
  const cls  = skipped ? 'text-dark-500' : passed ? 'text-shield-400' : 'text-red-400'
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-dark-200">{label}</span>
      <span className={`font-bold text-sm ${cls}`}>{icon} {skipped ? 'Skipped' : passed ? 'PASS' : 'FAIL'}</span>
    </div>
  )
}

function VerificationCard({ verification, patch, vuln, index }) {
  const passed = verification?.overall_status === 'passed'

  return (
    <div className={`card border animate-slide-up
      ${passed ? 'border-shield-500/25 bg-shield-900/10' : 'border-red-500/25 bg-red-900/10'}`}
      style={{ animationDelay: `${index * 80}ms` }}>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{passed ? '✅' : '❌'}</span>
            <span className="font-bold text-dark-100 text-sm">{vuln?.vuln_type || `Patch ${index + 1}`}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <span className="font-mono">{vuln?.cwe_id || ''}</span>
            {patch?.strategy && (
              <span className={patch.strategy === 'template' ? 'badge-template' : 'badge-llm'}>
                {patch.strategy === 'template' ? '📋 Template' : '🤖 LLM'}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          passed
            ? 'bg-shield-500/20 text-shield-300 border border-shield-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {verification?.overall_status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      <div className="bg-dark-950/50 rounded-lg px-4 mb-4">
        <CheckRow label="🔨 Compilation (GCC -Wall)"    passed={verification?.compiles} />
        <CheckRow label="🧪 AddressSanitizer (ASan)"    passed={verification?.sanitizer_passed} />
        <CheckRow label="🕵️ No-Cheating Heuristics"    passed={verification?.no_cheating_passed} />
      </div>

      {verification?.errors?.length > 0 && (
        <div>
          <div className="section-label text-red-400">Errors</div>
          <div className="code-block text-xs text-red-300 max-h-28 overflow-y-auto">
            {verification.errors.join('\n')}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VerificationPage() {
  const navigate = useNavigate()
  const { state } = usePipeline()
  const verifications = state.verifications || []
  const patches = state.patches || []
  const vulns = state.vulnerabilities || []

  const passed = verifications.filter(v => v.overall_status === 'passed').length
  const failed = verifications.length - passed

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1">✅ M3 — Verification Results</h1>
          <p className="text-dark-400 text-sm">Compile · AddressSanitizer · No-Cheating heuristics</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/repair')}>← Repair</button>
          {state.reportId && (
            <button className="btn-primary" onClick={() => navigate(`/report/${state.reportId}`)}>
              → Report
            </button>
          )}
        </div>
      </div>

      {verifications.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">🧪</div>
          <p className="text-dark-300 mb-4">No verification results yet. Run the pipeline first.</p>
          <button className="btn-primary" onClick={() => navigate('/analyze')}>← Back to Analysis</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="card text-center border border-shield-500/20 bg-shield-900/10">
              <div className="text-3xl font-bold text-shield-300">{passed}</div>
              <div className="text-xs text-dark-400 mt-1">✓ Passed</div>
            </div>
            <div className="card text-center border border-red-500/20 bg-red-900/10">
              <div className="text-3xl font-bold text-red-300">{failed}</div>
              <div className="text-xs text-dark-400 mt-1">✗ Failed</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-dark-100">
                {verifications.length ? Math.round((passed / verifications.length) * 100) : 0}%
              </div>
              <div className="text-xs text-dark-400 mt-1">Fix Rate</div>
            </div>
          </div>

          <div className="space-y-3">
            {verifications.map((v, i) => (
              <VerificationCard
                key={v.patch_id || i}
                verification={v}
                patch={patches[i]}
                vuln={vulns[i]}
                index={i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
