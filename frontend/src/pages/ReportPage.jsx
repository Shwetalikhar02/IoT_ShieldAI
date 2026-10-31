/**
 * pages/ReportPage.jsx — M4 Pipeline Report (Step 5)
 *
 * Displays complete pipeline results: summary metrics, all vulnerabilities
 * found/fixed, IoT resource impact, LLM explanation, and download button.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport, getReportDownloadUrl } from '../services/api'
import { usePipeline } from '../store/pipelineStore'

function MetricCard({ label, value, unit, icon, color }) {
  return (
    <div className="card text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${color || 'text-dark-100'}`}>{value}</div>
      <div className="text-xs text-dark-400 mt-1">{label}</div>
      {unit && <div className="text-xs text-dark-600">{unit}</div>}
    </div>
  )
}

function PipelineSummary({ result }) {
  const fixed = result.total_patches_applied || 0
  const total = result.total_vulnerabilities || 0
  const pct   = total > 0 ? Math.round((fixed / total) * 100) : 0

  return (
    <div className="card mb-6">
      <h2 className="font-bold text-dark-100 mb-4">📊 Pipeline Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vulnerabilities Found" value={total} icon="🔍" color="text-orange-300" />
        <MetricCard label="Patches Applied"       value={fixed} icon="🩹" color="text-shield-300" />
        <MetricCard label="Fix Rate"              value={`${pct}%`} icon="📈" color={pct === 100 ? 'text-shield-300' : 'text-yellow-300'} />
        <MetricCard label="Analysis File"         value={result.file_path?.split(/[\\/]/).pop() || '—'} icon="📄" />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-dark-400">
          <span>{fixed} of {total} vulnerabilities fixed</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              pct === 100
                ? 'bg-gradient-to-r from-shield-500 to-shield-300'
                : 'bg-gradient-to-r from-shield-600 to-yellow-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function IoTMetrics({ metrics }) {
  if (!metrics) return null
  const items = [
    { label: 'Binary Before', value: metrics.binary_size_before_bytes != null ? `${metrics.binary_size_before_bytes} B` : '—', icon: '💾' },
    { label: 'Binary After',  value: metrics.binary_size_after_bytes  != null ? `${metrics.binary_size_after_bytes} B`  : '—', icon: '💾' },
    { label: 'Size Delta',    value: metrics.binary_size_delta_bytes  != null ? `${metrics.binary_size_delta_bytes > 0 ? '+' : ''}${metrics.binary_size_delta_bytes} B` : '—', icon: '📐' },
    { label: 'Stack Delta',   value: metrics.estimated_stack_delta_bytes != null ? `${metrics.estimated_stack_delta_bytes > 0 ? '+' : ''}${metrics.estimated_stack_delta_bytes} B` : '—', icon: '📚' },
  ]
  return (
    <div className="card mb-6">
      <h2 className="font-bold text-dark-100 mb-4">⚙️ IoT Resource Metrics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.label} className="bg-dark-950/60 rounded-lg p-3 text-center">
            <div className="text-xl mb-1">{item.icon}</div>
            <div className="font-mono text-sm font-bold text-dark-100">{item.value}</div>
            <div className="text-xs text-dark-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExplanationSection({ explanation }) {
  if (!explanation) return null
  const parts = explanation.split('\n\n---\n\n')
  return (
    <div className="card mb-6">
      <h2 className="font-bold text-dark-100 mb-4">💡 M4 AI Explanations</h2>
      <div className="space-y-6">
        {parts.map((part, i) => (
          <div key={i} className="prose-dark text-sm text-dark-200 leading-relaxed space-y-2">
            {part.split('\n').map((line, j) => {
              if (line.startsWith('### ')) return <h3 key={j} className="font-bold text-dark-100 text-base">{line.slice(4)}</h3>
              if (line.startsWith('#### ')) return <h4 key={j} className="font-semibold text-dark-200">{line.slice(5)}</h4>
              if (line.startsWith('**') && line.endsWith('**')) return <p key={j} className="font-semibold text-dark-100">{line.slice(2, -2)}</p>
              if (line.startsWith('- ')) return <li key={j} className="ml-4 text-dark-300">{line.slice(2)}</li>
              if (line.trim()) return <p key={j}>{line}</p>
              return null
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

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
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1">📊 M4 — Pipeline Report</h1>
          <p className="text-dark-400 text-sm font-mono">
            Report ID: <span className="text-cyber-300">{id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate('/verify')}>← Verify</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>New Analysis</button>
          {id && (
            <a
              href={getReportDownloadUrl(id)}
              download
              className="btn-primary"
            >
              ⬇ Download JSON
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <div className="spinner w-10 h-10 mx-auto text-cyber-400 mb-4" />
          <p className="text-dark-300">Loading report…</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-300 mb-4">{error}</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>← Start New</button>
        </div>
      ) : !report ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-dark-300 mb-4">Report not found. Run the pipeline first.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Start Analysis</button>
        </div>
      ) : (
        <>
          <PipelineSummary result={report} />
          <IoTMetrics metrics={report.metrics} />
          <ExplanationSection explanation={report.explanation} />

          {/* All vulnerabilities */}
          {report.vulnerabilities?.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-dark-100 mb-4">🔍 Vulnerability Audit Trail</h2>
              <div className="space-y-2">
                {report.vulnerabilities.map((v, i) => {
                  const patch = report.patches?.[i]
                  const ver   = report.verification_results?.[i]
                  const fixed = ver?.overall_status === 'passed'
                  return (
                    <div key={v.id || i} className={`flex items-center justify-between p-3 rounded-lg text-sm
                      ${fixed ? 'bg-shield-900/20' : 'bg-red-900/20'}`}>
                      <div className="flex items-center gap-3">
                        <span>{fixed ? '✅' : '❌'}</span>
                        <div>
                          <span className="font-semibold text-dark-100">{v.vuln_type}</span>
                          <span className="text-dark-500 ml-2 font-mono text-xs">{v.cwe_id}</span>
                          <span className="text-dark-500 ml-2 text-xs">L{v.line_start}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {patch && (
                          <span className={patch.strategy === 'template' ? 'badge-template' : 'badge-llm'}>
                            {patch.strategy === 'template' ? '📋' : '🤖'} {patch.strategy}
                          </span>
                        )}
                        <span className={`text-xs font-bold ${fixed ? 'text-shield-300' : 'text-red-300'}`}>
                          {fixed ? 'FIXED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
