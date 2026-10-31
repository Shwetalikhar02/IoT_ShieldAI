/**
 * pages/AnalysisPage.jsx — M1 Vulnerability Analysis (Step 2)
 * Premium vulnerability display with SSE pipeline streaming.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeFirmware, streamPipeline } from '../services/api'
import { usePipeline } from '../store/pipelineStore'

const SEVERITY_CONFIG = {
  Critical: {
    cls: 'badge-critical',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    dot: '#f87171',
    glow: 'rgba(239,68,68,0.1)',
    countColor: 'text-red-300',
    icon: '🔴',
  },
  High: {
    cls: 'badge-high',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.2)',
    dot: '#fb923c',
    glow: 'rgba(249,115,22,0.1)',
    countColor: 'text-orange-300',
    icon: '🟠',
  },
  Medium: {
    cls: 'badge-medium',
    bg: 'rgba(234,179,8,0.06)',
    border: 'rgba(234,179,8,0.2)',
    dot: '#fde047',
    glow: 'rgba(234,179,8,0.1)',
    countColor: 'text-yellow-300',
    icon: '🟡',
  },
  Low: {
    cls: 'badge-low',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.2)',
    dot: '#4ade80',
    glow: 'rgba(22,163,74,0.1)',
    countColor: 'text-shield-300',
    icon: '🟢',
  },
}

function VulnCard({ vuln, index }) {
  const [open, setOpen] = useState(index === 0)
  const cfg = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG.Low

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer gap-3 group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Severity dot */}
          <div
            className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.glow}` }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-dark-100 text-sm">{vuln.vuln_type}</span>
              <span className={cfg.cls}>{vuln.severity}</span>
              <span className="font-mono text-xs text-dark-500">{vuln.cwe_id}</span>
            </div>
            <p className="text-dark-400 text-xs leading-relaxed line-clamp-2">{vuln.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-md text-dark-500"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            L{vuln.line_start}
          </span>
          <span className="text-dark-600 text-xs transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expandable body */}
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-4 animate-fade-in border-t" style={{ borderColor: `${cfg.border}` }}>
          {/* Root cause */}
          <div className="pt-4">
            <div className="section-label">Root Cause</div>
            <p className="text-sm text-dark-200 leading-relaxed">{vuln.root_cause}</p>
          </div>

          {/* Code snippet */}
          {vuln.code_snippet && (
            <div>
              <div className="section-label">Vulnerable Code</div>
              <div className="code-block">
                <span className="diff-del">{vuln.code_snippet}</span>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-xs text-dark-500">
              <span>📂</span>
              <span className="font-mono">{vuln.file_path?.split(/[/\\]/).pop() || 'unknown'}</span>
            </span>
            {vuln.function_name && vuln.function_name !== 'unknown_function' && (
              <span className="flex items-center gap-1.5 text-xs text-dark-500">
                <span>⚙️</span>
                <span className="font-mono">{vuln.function_name}()</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-dark-500">
              <span>🎯</span>
              <span>{Math.round((vuln.confidence || 1) * 100)}% confidence</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function SSELog({ messages, running }) {
  const ref = React.useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages])

  if (!running && messages.length === 0) return null

  return (
    <div className="card mb-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        {running ? (
          <>
            <div className="status-dot-running" />
            <span className="font-semibold text-sm text-cyber-300">Pipeline Running…</span>
          </>
        ) : (
          <>
            <span className="text-shield-400">✓</span>
            <span className="font-semibold text-sm text-dark-200">Pipeline Complete</span>
          </>
        )}
      </div>
      <div
        ref={ref}
        className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin rounded-lg p-3"
        style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {messages.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className="text-dark-700 font-mono shrink-0 text-[10px] mt-0.5">{m.ts}</span>
            <span className={`font-bold shrink-0 text-[10px] uppercase tracking-wider ${
              m.event === 'complete' ? 'text-shield-400' :
              m.event === 'error' ? 'text-red-400' :
              m.status === 'done' ? 'text-shield-500' : 'text-cyber-400'
            }`}>
              [{m.event || m.step}]
            </span>
            <span className="text-dark-300">{m.message || JSON.stringify(m).slice(0, 100)}</span>
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-xs text-cyber-400/60 pt-1">
            <div className="spinner w-2.5 h-2.5" /> <span>Streaming…</span>
          </div>
        )}
      </div>
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
    if (state.vulnerabilities.length > 0) return

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
    if (!state.uploadId || pipelineRunning) return
    setPipelineRunning(true)
    setSseMessages([])
    dispatch({ type: 'CLEAR_SSE_LOG' })

    const es = streamPipeline(state.uploadId, (eventName, data) => {
      const msg = { event: eventName, ...data, ts: new Date().toLocaleTimeString() }
      setSseMessages(prev => [...prev.slice(-40), msg])
      dispatch({ type: 'ADD_SSE_LOG', payload: msg })

      if (eventName === 'complete') {
        setPipelineRunning(false)
        if (data.result) {
          dispatch({ type: 'SET_PIPELINE_RESULT', payload: data.result })
          if (data.result.vulnerabilities) dispatch({ type: 'SET_VULNS', payload: data.result.vulnerabilities })
          if (data.result.patches) dispatch({ type: 'SET_PATCHES', payload: data.result.patches })
          if (data.result.verification_results) dispatch({ type: 'SET_VERIFICATIONS', payload: data.result.verification_results })
        }
        setTimeout(() => navigate(`/report/${data.report_id || state.uploadId}`), 600)
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              🔍
            </div>
            <h1 className="text-2xl font-bold text-dark-100">M1 — Vulnerability Analysis</h1>
          </div>
          <p className="text-dark-500 text-sm ml-12">cppcheck · semgrep · regex pattern scanner</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/')}>← Upload</button>
          {vulns.length > 0 && (
            <button
              className="btn-primary"
              disabled={pipelineRunning}
              onClick={runFullPipeline}
              id="run-pipeline-btn"
            >
              {pipelineRunning
                ? <><div className="spinner" /> Running…</>
                : <>▶ Run Full Pipeline</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Severity Summary Cards ── */}
      {vulns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Object.entries(counts).map(([sev, count]) => {
            const cfg = SEVERITY_CONFIG[sev]
            return (
              <div
                key={sev}
                className="metric-card"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                <div className="text-3xl font-black mb-1" style={{ color: cfg.dot }}>{count}</div>
                <span className={cfg.cls}>{sev}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SSE Progress ── */}
      <SSELog messages={sseMessages} running={pipelineRunning} />

      {/* ── Main Content ── */}
      {!state.uploadId ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4 animate-float">📭</div>
          <p className="text-dark-400 mb-6 text-lg">No firmware session active.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Upload Firmware</button>
        </div>
      ) : loading ? (
        <div className="card text-center py-20">
          <div
            className="spinner mx-auto text-cyber-400 mb-6"
            style={{ width: 48, height: 48, borderWidth: 3 }}
          />
          <p className="text-dark-200 font-semibold text-lg mb-1">Running static analysis…</p>
          <p className="text-dark-500 text-sm">Scanning for security vulnerabilities</p>
        </div>
      ) : error ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-300 mb-4 text-lg">{error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : vulns.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-shield-300 font-bold text-xl mb-2">No vulnerabilities detected!</p>
          <p className="text-dark-500 text-sm mb-6">Firmware appears clean based on static analysis.</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>Upload Another File</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">{vulns.length} vulnerabilities detected</span>
            <button
              className="btn-primary"
              disabled={pipelineRunning}
              onClick={runFullPipeline}
            >
              {pipelineRunning
                ? <><div className="spinner" /> Running…</>
                : <>▶ Run Full Pipeline →</>
              }
            </button>
          </div>
          <div className="space-y-3">
            {vulns.map((v, i) => <VulnCard key={v.id || i} vuln={v} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
