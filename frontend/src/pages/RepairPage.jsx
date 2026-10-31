/**
 * pages/RepairPage.jsx — M2 Repair Patches (Step 3)
 * Premium diff viewer with strategy badges and verification mini.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePipeline } from '../store/pipelineStore'

function DiffViewer({ original, patched }) {
  if (!original && !patched) return null
  const origLines = (original || '').split('\n')
  const patchLines = (patched || '').split('\n')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <div className="section-label text-red-400">Before · Vulnerable</div>
        <div className="code-block max-h-48 overflow-y-auto">
          {origLines.map((line, i) => (
            <span key={i} className="diff-del">- {line || ' '}</span>
          ))}
        </div>
      </div>
      <div>
        <div className="section-label text-shield-400">After · Patched</div>
        <div className="code-block max-h-48 overflow-y-auto">
          {patchLines.map((line, i) => (
            <span key={i} className="diff-add">+ {line || ' '}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StrategyBadge({ strategy }) {
  if (strategy === 'template') return <span className="badge-template">📋 Template</span>
  if (strategy === 'llm') return <span className="badge-llm">🤖 LLM</span>
  return <span className="badge-template">📋 {strategy}</span>
}

function VerificationMini({ ver }) {
  if (!ver) return null
  const checks = [
    { label: 'Compile', passed: ver.compiles, icon: '🔨' },
    { label: 'ASan',    passed: ver.sanitizer_passed, icon: '🧪' },
    { label: 'No-Cheat',passed: ver.no_cheating_passed, icon: '🕵️' },
  ]
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {checks.map(c => (
        <span
          key={c.label}
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: c.passed ? '#4ade80' : '#f87171' }}
        >
          <span>{c.icon}</span>
          <span>{c.passed ? '✓' : '✗'}</span>
          <span>{c.label}</span>
        </span>
      ))}
      <span
        className="text-xs font-black px-2 py-0.5 rounded-full"
        style={{
          background: ver.overall_status === 'passed' ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)',
          color: ver.overall_status === 'passed' ? '#4ade80' : '#f87171',
          border: ver.overall_status === 'passed' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(239,68,68,0.3)',
        }}
      >
        {ver.overall_status?.toUpperCase()}
      </span>
    </div>
  )
}

function PatchCard({ patch, verification, vuln, index }) {
  const [open, setOpen] = useState(index === 0)
  const [showDiff, setShowDiff] = useState(false)
  const passed = verification?.overall_status === 'passed'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up"
      style={{
        background: passed ? 'rgba(22,163,74,0.05)' : 'rgba(239,68,68,0.05)',
        border: passed ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(239,68,68,0.2)',
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">{passed ? '🩹' : '❌'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-sm text-dark-100">{vuln?.vuln_type || 'Patch'}</span>
              <StrategyBadge strategy={patch.strategy} />
              {passed
                ? <span className="badge-pass">✓ Verified</span>
                : <span className="badge-fail">✗ Failed</span>
              }
            </div>
            <p className="text-dark-500 text-xs leading-relaxed line-clamp-1">{patch.explanation}</p>
          </div>
        </div>
        <span
          className="text-dark-600 text-xs shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >▼</span>
      </div>

      {/* Body */}
      {open && (
        <div
          className="px-4 pb-4 space-y-4 animate-fade-in border-t"
          style={{ borderColor: passed ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)' }}
        >
          <div className="pt-4">
            <div className="section-label">Explanation</div>
            <p className="text-sm text-dark-200 leading-relaxed">{patch.explanation}</p>
          </div>

          <div>
            <div className="section-label">Verification Result</div>
            <VerificationMini ver={verification} />
            {verification?.errors?.length > 0 && (
              <div className="mt-2 code-block text-xs text-red-300 max-h-24 overflow-y-auto">
                {verification.errors.join('\n')}
              </div>
            )}
          </div>

          <div>
            <div className="section-label">Code Change</div>
            <DiffViewer original={patch.original_code} patched={patch.patched_code} />
          </div>

          {patch.diff && (
            <details className="text-xs" onToggle={e => setShowDiff(e.target.open)}>
              <summary className="text-dark-600 cursor-pointer hover:text-dark-300 transition-colors select-none">
                {showDiff ? '▲' : '▼'} Unified diff
              </summary>
              <div className="code-block mt-2 max-h-36 overflow-y-auto">
                {patch.diff.split('\n').map((line, i) => {
                  if (line.startsWith('+') && !line.startsWith('+++')) return <span key={i} className="diff-add">{line}</span>
                  if (line.startsWith('-') && !line.startsWith('---')) return <span key={i} className="diff-del">{line}</span>
                  return <span key={i} className="diff-ctx">{line}</span>
                })}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default function RepairPage() {
  const navigate = useNavigate()
  const { state } = usePipeline()
  const patches = state.patches || []
  const vulns = state.vulnerabilities || []
  const verifications = state.verifications || []

  const passCount = verifications.filter(v => v.overall_status === 'passed').length
  const templateCount = patches.filter(p => p.strategy === 'template').length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.2)' }}
            >
              🔧
            </div>
            <h1 className="text-2xl font-bold text-dark-100">M2 — Repair Patches</h1>
          </div>
          <p className="text-dark-500 text-sm ml-12">Template engine · LLM-guided repair · Escalation loop</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/analyze')}>← Analysis</button>
          {patches.length > 0 && (
            <button className="btn-primary" onClick={() => navigate('/verify')}>→ Verification</button>
          )}
        </div>
      </div>

      {patches.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4 animate-float">🩹</div>
          <p className="text-dark-400 text-lg mb-2">No patches generated yet.</p>
          <p className="text-dark-600 text-sm mb-6">Run the full pipeline from the Analysis page.</p>
          <button className="btn-primary" onClick={() => navigate('/analyze')}>← Go to Analysis</button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="metric-card">
              <div className="text-4xl font-black text-dark-100 mb-1 counter">{patches.length}</div>
              <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Total Patches</div>
            </div>
            <div
              className="metric-card"
              style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}
            >
              <div className="text-4xl font-black text-shield-300 mb-1 counter">{passCount}</div>
              <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Verified ✓</div>
            </div>
            <div
              className="metric-card"
              style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}
            >
              <div className="text-4xl font-black text-cyber-300 mb-1 counter">{templateCount}</div>
              <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">Template Fixes</div>
            </div>
          </div>

          {/* Patch cards */}
          <div className="space-y-3">
            {patches.map((p, i) => (
              <PatchCard
                key={p.id || i}
                patch={p}
                verification={verifications[i]}
                vuln={vulns.find(v => v.id === p.vulnerability_id) || vulns[i]}
                index={i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
