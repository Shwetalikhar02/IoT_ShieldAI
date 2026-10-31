/**
 * pages/AnalysisPage.jsx — M1 Vulnerability Analysis (Step 2)
 *
 * Fetches and displays detected vulnerabilities from the backend.
 * Shows severity summary and vulnerability cards. "Run Full Pipeline"
 * triggers the complete M1→M2→M3→M4 pipeline via SSE streaming.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeFirmware, streamPipeline } from '../services/api'
import { usePipeline } from '../store/pipelineStore'

const SEVERITY_CONFIG = {
  Critical: { cls: 'badge-critical', bg: 'bg-red-900/20 border-red-700/30',    dot: 'bg-red-400'    },
  High:     { cls: 'badge-high',     bg: 'bg-orange-900/20 border-orange-700/30', dot: 'bg-orange-400' },
  Medium:   { cls: 'badge-medium',   bg: 'bg-yellow-900/20 border-yellow-700/30', dot: 'bg-yellow-400' },
  Low:      { cls: 'badge-low',      bg: 'bg-green-900/20 border-green-700/30',  dot: 'bg-green-400'  },
}

function VulnCard({ vuln, index }) {
  const [open, setOpen] = useState(false)
  const cfg = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG.Low
  return (
    <div className={`card border animate-slide-up ${cfg.bg} transition-all`} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-1 status-dot ${cfg.dot} shrink-0`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-dark-100 text-sm">{vuln.vuln_type}</span>
              <span className={cfg.cls}>{vuln.severity}</span>
              <span className="font-mono text-xs text-dark-400">{vuln.cwe_id}</span>
            </div>
            <p className="text-dark-300 text-xs truncate">{vuln.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-dark-500 font-mono">L{vuln.line_start}</span>
          <span className="text-dark-500 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div>
            <div className="section-label">Root Cause</div>
            <p className="text-sm text-dark-200 leading-relaxed">{vuln.root_cause}</p>
          </div>
          {vuln.code_snippet && (
            <div>
              <div className="section-label">Vulnerable Code</div>
              <pre className="code-block text-xs overflow-x-auto">{vuln.code_snippet}</pre>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-dark-500">
            <span>📂 {vuln.file_path?.split(/[\\/]/).pop() || 'unknown'}</span>
            <span>🔧 {vuln.function_name || 'unknown'}</span>
            <span>🎯 {Math.round((vuln.confidence || 1) * 100)}% confidence</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const navigate = useNavigate()
  const { state, dispatch } = usePipeline()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [sseMessages, setSseMessages] = useState([])

  useEffect(() => {
    if (!state.uploadId) return
    if (state.vulnerabilities.length > 0) return  // already fetched

    setLoading(true)
    setError(null)
    analyzeFirmware(state.uploadId)
      .then(data => {
        dispatch({ type: 'SET_VULNS', payload: data.vulnerabilities || [] })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [state.uploadId])

  const runFullPipeline = () => {
    if (!state.uploadId) return
    setPipelineRunning(true)
    setSseMessages([])
    dispatch({ type: 'CLEAR_SSE_LOG' })

    const es = streamPipeline(state.uploadId, (eventName, data) => {
      const msg = { event: eventName, ...data, ts: new Date().toLocaleTimeString() }
      setSseMessages(prev => [...prev.slice(-30), msg])
      dispatch({ type: 'ADD_SSE_LOG', payload: msg })

      if (eventName === 'complete') {
        setPipelineRunning(false)
        if (data.result) {
          dispatch({ type: 'SET_PIPELINE_RESULT', payload: data.result })
          if (data.result.vulnerabilities) dispatch({ type: 'SET_VULNS', payload: data.result.vulnerabilities })
          if (data.result.patches) dispatch({ type: 'SET_PATCHES', payload: data.result.patches })
          if (data.result.verification_results) dispatch({ type: 'SET_VERIFICATIONS', payload: data.result.verification_results })
        }
        setTimeout(() => navigate(`/report/${data.report_id || state.uploadId}`), 800)
      }
      if (eventName === 'error') {
        setPipelineRunning(false)
        setError(data.message)
      }
    })

    return () => es.close()
  }

  const vulns = state.vulnerabilities
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  vulns.forEach(v => { if (counts[v.severity] !== undefined) counts[v.severity]++ })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1">🔍 M1 — Vulnerability Analysis</h1>
          <p className="text-dark-400 text-sm">cppcheck · semgrep · pattern scan</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/')}>← Back</button>
          {vulns.length > 0 && (
            <button
              className="btn-primary"
              disabled={pipelineRunning}
              onClick={runFullPipeline}
            >
              {pipelineRunning ? <><div className="spinner" /> Running...</> : '▶ Run Full Pipeline'}
            </button>
          )}
        </div>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Object.entries(counts).map(([sev, count]) => (
          <div key={sev} className={`card text-center border ${SEVERITY_CONFIG[sev].bg}`}>
            <div className="text-3xl font-bold text-dark-50 mb-1">{count}</div>
            <span className={SEVERITY_CONFIG[sev].cls}>{sev}</span>
          </div>
        ))}
      </div>

      {/* SSE progress */}
      {(pipelineRunning || sseMessages.length > 0) && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            {pipelineRunning && <div className="status-dot-running" />}
            <span className="font-semibold text-sm text-dark-100">Pipeline Progress</span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
            {sseMessages.map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-dark-600 font-mono shrink-0">{m.ts}</span>
                <span className={`font-medium shrink-0 ${
                  m.event === 'complete' ? 'text-shield-400' :
                  m.event === 'error' ? 'text-red-400' : 'text-cyber-400'
                }`}>[{m.event}]</span>
                <span className="text-dark-300">{m.message || JSON.stringify(m).slice(0, 80)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!state.uploadId ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-dark-300 mb-4">No firmware uploaded. Start with a file or demo sample.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Upload Firmware</button>
        </div>
      ) : loading ? (
        <div className="card text-center py-16">
          <div className="spinner w-10 h-10 mx-auto text-cyber-400 mb-4" />
          <p className="text-dark-300">Running static analysis…</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-300 mb-4">{error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : vulns.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-shield-300 font-semibold text-lg mb-2">No vulnerabilities detected!</p>
          <p className="text-dark-400 text-sm">The firmware appears clean based on static analysis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="section-label">{vulns.length} vulnerabilities found</div>
          {vulns.map((v, i) => <VulnCard key={v.id} vuln={v} index={i} />)}
          <div className="flex justify-end pt-2">
            <button className="btn-primary" disabled={pipelineRunning} onClick={runFullPipeline}>
              {pipelineRunning ? <><div className="spinner" /> Running...</> : '▶ Run Full Pipeline →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
