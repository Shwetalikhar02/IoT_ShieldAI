/**
 * pages/ReportPage.jsx — M4 Pipeline Report (Step 5)
 * Premium report with metrics, audit trail, and download.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport, getReportDownloadUrl } from '../services/api'
import { usePipeline } from '../store/pipelineStore'

/* ── Metric Card ────────────────────────────────────────────────────────── */
function MetricCard({ label, value, icon, color, sub }) {
  return (
    <div className="metric-card">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-black mb-1 counter ${color || 'text-dark-100'}`}>{value}</div>
      <div className="text-xs text-dark-500 font-semibold uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-dark-700 mt-0.5">{sub}</div>}
    </div>
  )
}

/* ── Pipeline Summary ───────────────────────────────────────────────────── */
function PipelineSummary({ result }) {
  const fixed = result.total_patches_applied || 0
  const total = result.total_vulnerabilities || 0
  const pct   = total > 0 ? Math.round((fixed / total) * 100) : 0
  const filename = result.file_path?.split(/[/\\]/).pop() || '—'

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.2)' }}
        >
          📊
        </div>
        <h2 className="font-bold text-dark-100 text-lg">Pipeline Summary</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Vulns Found"   value={total} icon="🔍" color="text-orange-300" />
        <MetricCard label="Patches Applied" value={fixed} icon="🩹" color="text-shield-300" />
        <MetricCard label="Fix Rate"     value={`${pct}%`} icon="📈"
          color={pct === 100 ? 'text-shield-300' : pct >= 60 ? 'text-yellow-300' : 'text-red-300'} />
        <MetricCard label="Source File"  value={filename} icon="📄" />
      </div>

      {/* Fix rate bar */}
      <div>
        <div className="flex justify-between text-xs text-dark-500 mb-1.5">
          <span>{fixed} of {total} vulnerabilities fixed</span>
          <span className={`font-bold ${pct === 100 ? 'text-shield-400' : 'text-yellow-400'}`}>{pct}%</span>
        </div>
        <div className="progress-bar h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, #16a34a, #22c55e, #eab308)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-bar 3s linear infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ── IoT Metrics ────────────────────────────────────────────────────────── */
function IoTMetrics({ metrics }) {
  if (!metrics) return null

  const items = [
    {
      label: 'Binary Before',
      value: metrics.binary_size_before_bytes != null
        ? `${(metrics.binary_size_before_bytes / 1024).toFixed(1)} KB` : '—',
      icon: '💾', color: 'text-dark-200',
    },
    {
      label: 'Binary After',
      value: metrics.binary_size_after_bytes != null
        ? `${(metrics.binary_size_after_bytes / 1024).toFixed(1)} KB` : '—',
      icon: '💾', color: 'text-dark-200',
    },
    {
      label: 'Size Delta',
      value: metrics.binary_size_delta_bytes != null
        ? `${metrics.binary_size_delta_bytes > 0 ? '+' : ''}${metrics.binary_size_delta_bytes} B` : '—',
      icon: '📐',
      color: metrics.binary_size_delta_bytes > 0 ? 'text-yellow-300' : 'text-shield-300',
    },
    {
      label: 'Stack Delta',
      value: metrics.estimated_stack_delta_bytes != null
        ? `${metrics.estimated_stack_delta_bytes > 0 ? '+' : ''}${metrics.estimated_stack_delta_bytes} B` : '—',
      icon: '📚',
      color: metrics.estimated_stack_delta_bytes > 0 ? 'text-yellow-300' : 'text-shield-300',
    },
  ]

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)' }}
        >
          ⚙️
        </div>
        <h2 className="font-bold text-dark-100 text-lg">IoT Resource Metrics</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(item => (
          <div
            key={item.label}
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className={`font-mono text-base font-black ${item.color}`}>{item.value}</div>
            <div className="text-xs text-dark-600 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Explanation ────────────────────────────────────────────────────────── */
function ExplanationSection({ explanation }) {
  if (!explanation) return null
  const parts = explanation.split('\n\n---\n\n')

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          💡
        </div>
        <h2 className="font-bold text-dark-100 text-lg">M4 AI Explanations</h2>
      </div>
      <div className="space-y-6">
        {parts.map((part, i) => (
          <div key={i} className="text-sm text-dark-300 leading-relaxed space-y-2">
            {part.split('\n').map((line, j) => {
              if (line.startsWith('### ')) return <h3 key={j} className="font-bold text-dark-100 text-base mt-4">{line.slice(4)}</h3>
              if (line.startsWith('#### ')) return <h4 key={j} className="font-semibold text-dark-200">{line.slice(5)}</h4>
              if (line.startsWith('**') && line.endsWith('**')) return <p key={j} className="font-semibold text-dark-100">{line.slice(2,-2)}</p>
              if (line.startsWith('- ')) return <li key={j} className="ml-4 text-dark-400 list-disc">{line.slice(2)}</li>
              if (line.trim()) return <p key={j}>{line}</p>
              return null
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Audit Trail ────────────────────────────────────────────────────────── */
function AuditTrail({ result }) {
  if (!result.vulnerabilities?.length) return null

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          🔍
        </div>
        <h2 className="font-bold text-dark-100 text-lg">Vulnerability Audit Trail</h2>
      </div>
      <div className="space-y-2">
        {result.vulnerabilities.map((v, i) => {
          const patch = result.patches?.[i]
          const ver   = result.verification_results?.[i]
          const fixed = ver?.overall_status === 'passed'

          return (
            <div
              key={v.id || i}
              className="flex items-center justify-between p-3.5 rounded-xl text-sm transition-colors"
              style={{
                background: fixed ? 'rgba(22,163,74,0.06)' : 'rgba(239,68,68,0.06)',
                border: fixed ? '1px solid rgba(22,163,74,0.12)' : '1px solid rgba(239,68,68,0.12)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base">{fixed ? '✅' : '❌'}</span>
                <div className="min-w-0">
                  <span className="font-semibold text-dark-100 text-sm">{v.vuln_type}</span>
                  <span
                    className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded text-dark-500"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    {v.cwe_id}
                  </span>
                  <span className="text-dark-600 ml-2 text-xs">L{v.line_start}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {patch && (
                  <span className={patch.strategy === 'template' ? 'badge-template' : 'badge-llm'}>
                    {patch.strategy === 'template' ? '📋' : '🤖'} {patch.strategy}
                  </span>
                )}
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-full"
                  style={{
                    background: fixed ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
                    color: fixed ? '#4ade80' : '#f87171',
                    border: fixed ? '1px solid rgba(22,163,74,0.25)' : '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  {fixed ? 'FIXED' : 'FAILED'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = usePipeline()
  const [report, setReport] = useState(state.pipelineResult)
  const [loading, setLoading] = useState(!state.pipelineResult)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id || state.pipelineResult) return
    setLoading(true)
    getReport(id)
      .then(data => {
        setReport(data)
        dispatch({ type: 'SET_PIPELINE_RESULT', payload: data })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

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
              📊
            </div>
            <h1 className="text-2xl font-bold text-dark-100">M4 — Pipeline Report</h1>
          </div>
          <p className="text-dark-600 text-xs font-mono ml-12">
            Session: <span className="text-cyber-600">{id}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary" onClick={() => navigate('/verify')}>← Verify</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>New Analysis</button>
          {id && (
            <a
              href={getReportDownloadUrl(id)}
              download
              className="btn-primary"
              onClick={e => {
                // Prevent if no report exists
              }}
            >
              ⬇ Download JSON
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-20">
          <div className="spinner mx-auto text-cyber-400 mb-6" style={{ width: 48, height: 48, borderWidth: 3 }} />
          <p className="text-dark-200 font-semibold text-lg mb-1">Loading report…</p>
          <p className="text-dark-500 text-sm">Fetching pipeline results</p>
        </div>
      ) : error ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-300 text-lg mb-4">{error}</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>← Start New</button>
        </div>
      ) : !report ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-dark-400 text-lg mb-2">Report not found.</p>
          <p className="text-dark-600 text-sm mb-6">Run the pipeline first to generate a report.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Start Analysis</button>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          <PipelineSummary result={report} />
          <IoTMetrics metrics={report.metrics} />
          <ExplanationSection explanation={report.explanation} />
          <AuditTrail result={report} />
        </div>
      )}
    </div>
  )
}
