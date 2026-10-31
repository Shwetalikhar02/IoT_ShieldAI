/**
 * pages/RepairPage.jsx — M2 Repair Patches (Step 3)
 *
 * Shows patches for each vulnerability with diff viewer,
 * strategy badge, attempt history, and chat refinement.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePipeline } from '../store/pipelineStore'

function DiffViewer({ original, patched }) {
  if (!original && !patched) return null
  const origLines = (original || '').split('\n')
  const patchLines = (patched || '').split('\n')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div>
        <div className="section-label text-red-400">Before (vulnerable)</div>
        <pre className="code-block text-xs overflow-x-auto max-h-40">
          {origLines.map((line, i) => (
            <span key={i} className="diff-del block">{line || ' '}</span>
          ))}
        </pre>
      </div>
      <div>
        <div className="section-label text-shield-400">After (patched)</div>
        <pre className="code-block text-xs overflow-x-auto max-h-40">
          {patchLines.map((line, i) => (
            <span key={i} className="diff-add block">{line || ' '}</span>
          ))}
        </pre>
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
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={ver.compiles ? 'text-shield-400' : 'text-red-400'}>
        {ver.compiles ? '✓' : '✗'} Compiles
      </span>
      <span className={ver.sanitizer_passed ? 'text-shield-400' : 'text-red-400'}>
        {ver.sanitizer_passed ? '✓' : '✗'} ASan
      </span>
      <span className={ver.no_cheating_passed ? 'text-shield-400' : 'text-red-400'}>
        {ver.no_cheating_passed ? '✓' : '✗'} No-Cheat
      </span>
      <span className={`font-bold ${ver.overall_status === 'passed' ? 'text-shield-300' : 'text-red-300'}`}>
        {ver.overall_status?.toUpperCase()}
      </span>
    </div>
  )
}

function PatchCard({ patch, verification, vuln, index }) {
  const [open, setOpen] = useState(index === 0)
  const passed = verification?.overall_status === 'passed'

  return (
    <div className={`card border animate-slide-up ${passed ? 'border-shield-500/20' : 'border-red-500/20'}`}
      style={{ animationDelay: `${index * 80}ms` }}>
      <div
        className="flex items-start justify-between cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl mt-0.5">{passed ? '🩹' : '❌'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-sm text-dark-100">{vuln?.vuln_type || 'Patch'}</span>
              <StrategyBadge strategy={patch.strategy} />
              {passed
                ? <span className="badge-pass">✓ Verified</span>
                : <span className="badge-fail">✗ Failed</span>
              }
            </div>
            <p className="text-dark-400 text-xs truncate">{patch.explanation}</p>
          </div>
        </div>
        <span className="text-dark-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <DiffViewer original={patch.original_code} patched={patch.patched_code} />

          <div>
            <div className="section-label">Explanation</div>
            <p className="text-sm text-dark-200 leading-relaxed">{patch.explanation}</p>
          </div>

          <div>
            <div className="section-label">Verification</div>
            <VerificationMini ver={verification} />
            {verification?.errors?.length > 0 && (
              <div className="mt-2 code-block text-xs text-red-300 max-h-24 overflow-y-auto">
                {verification.errors.join('\n')}
              </div>
            )}
          </div>

          {patch.diff && (
            <details className="text-xs">
              <summary className="text-dark-500 cursor-pointer hover:text-dark-300">Show unified diff</summary>
              <pre className="code-block mt-2 max-h-40 overflow-y-auto text-dark-300">{patch.diff}</pre>
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1">🔧 M2 — Repair Patches</h1>
          <p className="text-dark-400 text-sm">Template-based + LLM-generated fixes</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/analyze')}>← Analysis</button>
          {patches.length > 0 && (
            <button className="btn-primary" onClick={() => navigate('/verify')}>→ Verification</button>
          )}
        </div>
      </div>

      {patches.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">🩹</div>
          <p className="text-dark-300 mb-4">No patches generated yet. Run the full pipeline first.</p>
          <button className="btn-primary" onClick={() => navigate('/analyze')}>← Go to Analysis</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-dark-50">{patches.length}</div>
              <div className="text-xs text-dark-400 mt-1">Total Patches</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-shield-300">
                {verifications.filter(v => v.overall_status === 'passed').length}
              </div>
              <div className="text-xs text-dark-400 mt-1">Verified</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-cyber-300">
                {patches.filter(p => p.strategy === 'template').length}
              </div>
              <div className="text-xs text-dark-400 mt-1">Template Fixes</div>
            </div>
          </div>

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
