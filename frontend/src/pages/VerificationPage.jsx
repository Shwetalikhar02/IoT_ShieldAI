/**
 * pages/VerificationPage.jsx — M3 Verification (Step 4)
 * Premium step-by-step verification display.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePipeline } from '../store/pipelineStore'

function CheckRow({ label, passed, icon }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center gap-2.5 text-sm">
        <span>{icon}</span>
        <span className="text-dark-300">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-black px-2.5 py-1 rounded-full"
          style={{
            background: passed ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
            color: passed ? '#4ade80' : '#f87171',
            border: passed ? '1px solid rgba(22,163,74,0.25)' : '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {passed ? '✓ PASS' : '✗ FAIL'}
        </span>
      </div>
    </div>
  )
}

function VerificationCard({ verification, patch, vuln, index }) {
  const passed = verification?.overall_status === 'passed'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up"
      style={{
        background: passed ? 'rgba(22,163,74,0.04)' : 'rgba(239,68,68,0.04)',
        border: passed ? '1px solid rgba(22,163,74,0.18)' : '1px solid rgba(239,68,68,0.18)',
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between p-4"
        style={{
          borderBottom: passed ? '1px solid rgba(22,163,74,0.1)' : '1px solid rgba(239,68,68,0.1)'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{passed ? '✅' : '❌'}</span>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-dark-100 text-sm">
                {vuln?.vuln_type || `Patch ${index + 1}`}
              </span>
              {patch?.strategy && (
                <span className={patch.strategy === 'template' ? 'badge-template' : 'badge-llm'}>
                  {patch.strategy === 'template' ? '📋 Template' : '🤖 LLM'}
                </span>
              )}
            </div>
            <div className="text-xs text-dark-500 font-mono">{vuln?.cwe_id || ''}</div>
          </div>
        </div>

        <span
          className="text-xs font-black px-3 py-1.5 rounded-full shrink-0"
          style={{
            background: passed ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
            color: passed ? '#4ade80' : '#f87171',
            border: passed ? '1px solid rgba(22,163,74,0.25)' : '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {verification?.overall_status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      {/* Checks */}
      <div className="px-4 py-1">
        <CheckRow label="Compilation (GCC -Wall -Wextra)" passed={verification?.compiles} icon="🔨" />
        <CheckRow label="AddressSanitizer (ASan + UBSan)" passed={verification?.sanitizer_passed} icon="🧪" />
        <CheckRow label="No-Cheating Heuristics" passed={verification?.no_cheating_passed} icon="🕵️" />
      </div>

      {/* Errors */}
      {verification?.errors?.length > 0 && (
        <div className="px-4 pb-4">
          <div className="section-label text-red-500">Compiler / Sanitizer Output</div>
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
  const rate = verifications.length ? Math.round((passed / verifications.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.2)' }}
            >
              ✅
            </div>
            <h1 className="text-2xl font-bold text-dark-100">M3 — Verification Results</h1>
          </div>
          <p className="text-dark-500 text-sm ml-12">Compile · AddressSanitizer · No-Cheating heuristics</p>
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
        <div className="card text-center py-20">
          <div className="text-5xl mb-4 animate-float">🧪</div>
          <p className="text-dark-400 text-lg mb-2">No verification results yet.</p>
          <p className="text-dark-600 text-sm mb-6">Run the full pipeline from the Analysis page.</p>
          <button className="btn-primary" onClick={() => navigate('/analyze')}>← Back to Analysis</button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div
              className="metric-card"
              style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}
            >
              <div className="text-4xl font-black text-shield-300 mb-1 counter">{passed}</div>
              <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">✓ Passed</div>
            </div>
            <div
              className="metric-card"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="text-4xl font-black text-red-300 mb-1 counter">{failed}</div>
              <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">✗ Failed</div>
            </div>
            <div className="metric-card">
              <div
                className="text-4xl font-black mb-1 counter"
                style={{ color: rate === 100 ? '#4ade80' : rate >= 60 ? '#fb923c' : '#f87171' }}
              >
                {rate}%
              </div>
              <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Fix Rate</div>
            </div>
          </div>

          {/* Fix rate bar */}
          <div className="mb-8">
            <div className="progress-bar h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${rate}%`,
                  background: rate === 100
                    ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                    : rate >= 60
                      ? 'linear-gradient(90deg, #16a34a, #f97316)'
                      : 'linear-gradient(90deg, #dc2626, #f97316)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-dark-600 mt-1.5">
              <span>{passed} of {verifications.length} patches verified</span>
              <span>{rate}% success rate</span>
            </div>
          </div>

          {/* Cards */}
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
