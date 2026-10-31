/**
 * pages/UploadPage.jsx — Firmware Upload (Step 1)
 * Premium hero landing with drag-drop and demo sample picker.
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFirmware, loadDemoSample } from '../services/api'
import { usePipeline } from '../store/pipelineStore'

const DEMO_SAMPLES = [
  {
    id: 'stack_overflow',
    label: 'Stack Buffer Overflow',
    cwe: 'CWE-121',
    severity: 'Critical',
    icon: '💥',
    desc: 'strcpy() into fixed 32-byte buffer',
    color: 'from-red-900/40 to-red-950/20',
    border: 'border-red-700/30 hover:border-red-500/40',
    badgeCls: 'badge-critical',
    dot: 'bg-red-400',
  },
  {
    id: 'null_ptr_deref',
    label: 'NULL Ptr Dereference',
    cwe: 'CWE-476',
    severity: 'High',
    icon: '🔴',
    desc: 'malloc() not checked before use',
    color: 'from-orange-900/40 to-orange-950/20',
    border: 'border-orange-700/30 hover:border-orange-500/40',
    badgeCls: 'badge-high',
    dot: 'bg-orange-400',
  },
  {
    id: 'format_string',
    label: 'Format String',
    cwe: 'CWE-134',
    severity: 'High',
    icon: '⚠️',
    desc: 'User input as printf format arg',
    color: 'from-yellow-900/40 to-yellow-950/20',
    border: 'border-yellow-700/30 hover:border-yellow-500/40',
    badgeCls: 'badge-high',
    dot: 'bg-yellow-400',
  },
  {
    id: 'use_after_free',
    label: 'Use After Free',
    cwe: 'CWE-416',
    severity: 'Critical',
    icon: '☠️',
    desc: 'Heap ptr used after free()',
    color: 'from-red-900/40 to-purple-950/20',
    border: 'border-red-700/30 hover:border-red-500/40',
    badgeCls: 'badge-critical',
    dot: 'bg-red-400',
  },
  {
    id: 'integer_overflow',
    label: 'Integer Overflow',
    cwe: 'CWE-190',
    severity: 'High',
    icon: '🔢',
    desc: 'Multiplication overflow before malloc',
    color: 'from-amber-900/40 to-amber-950/20',
    border: 'border-amber-700/30 hover:border-amber-500/40',
    badgeCls: 'badge-high',
    dot: 'bg-amber-400',
  },
]

const PIPELINE_FEATURES = [
  { icon: '🔍', label: 'M1 Analysis', desc: 'cppcheck + semgrep + patterns' },
  { icon: '🔧', label: 'M2 Repair',   desc: 'Template + LLM patch gen' },
  { icon: '🧪', label: 'M3 Verify',   desc: 'Compile + ASan + No-Cheat' },
  { icon: '📊', label: 'M4 Report',   desc: 'IoT metrics + explanations' },
]

export default function UploadPage() {
  const navigate = useNavigate()
  const { dispatch } = usePipeline()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingDemo, setLoadingDemo] = useState(null)
  const [error, setError] = useState(null)

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const result = await uploadFirmware(files, setProgress)
      dispatch({ type: 'SET_UPLOAD', payload: { uploadId: result.upload_id, files: result.files } })
      dispatch({ type: 'SET_STEP', payload: 'analyze' })
      navigate('/analyze')
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }, [dispatch, navigate])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDemoLoad = async (sampleId) => {
    setError(null)
    setLoadingDemo(sampleId)
    try {
      const result = await loadDemoSample(sampleId)
      dispatch({ type: 'SET_DEMO', payload: { uploadId: result.upload_id, sampleId } })
      dispatch({ type: 'SET_STEP', payload: 'analyze' })
      navigate('/analyze')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingDemo(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] relative overflow-hidden">
      {/* Hero glow orb */}
      <div className="hero-glow top-[-200px] left-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        {/* ── Hero Header ─────────────────────────────────────────────────── */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(14,165,233,0.1))',
              border: '1px solid rgba(22,163,74,0.25)',
              boxShadow: '0 0 40px rgba(22,163,74,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-4xl" style={{ filter: 'drop-shadow(0 0 8px rgba(22,163,74,0.5))' }}>🛡️</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-gradient mb-4 leading-none tracking-tight">
            IoT ShieldAI
          </h1>
          <p className="text-dark-400 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto mb-8">
            AI-powered firmware vulnerability detection, automated repair,
            and trust verification for embedded IoT systems.
          </p>

          {/* Pipeline badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PIPELINE_FEATURES.map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-dark-400 animate-slide-up"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  animationDelay: `${i * 80}ms`
                }}
              >
                <span>{f.icon}</span>
                <span className="text-dark-300 font-semibold">{f.label}</span>
                <span className="hidden sm:block text-dark-600">·</span>
                <span className="hidden sm:block">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Drop Zone ───────────────────────────────────────────────────── */}
        <div
          className={`relative rounded-2xl cursor-pointer transition-all duration-300 mb-4 animate-slide-up`}
          style={{
            border: dragging
              ? '2px dashed rgba(22,163,74,0.6)'
              : '2px dashed rgba(255,255,255,0.1)',
            background: dragging
              ? 'rgba(22,163,74,0.06)'
              : 'rgba(255,255,255,0.02)',
            boxShadow: dragging ? '0 0 40px rgba(22,163,74,0.15), inset 0 0 40px rgba(22,163,74,0.04)' : 'none',
            animationDelay: '200ms',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && document.getElementById('firmware-file-input').click()}
        >
          <input
            id="firmware-file-input"
            type="file"
            accept=".c,.cpp,.h,.hpp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="py-14 px-8 text-center">
            {uploading ? (
              <div className="space-y-5 max-w-xs mx-auto">
                <div className="relative">
                  <div
                    className="spinner mx-auto text-shield-400"
                    style={{ width: '48px', height: '48px', borderWidth: '3px' }}
                  />
                </div>
                <div>
                  <p className="text-dark-100 font-semibold text-lg mb-1">Uploading firmware…</p>
                  <p className="text-dark-500 text-sm">Validating and storing files</p>
                </div>
                <div className="progress-bar h-1.5 rounded-full overflow-hidden w-48 mx-auto">
                  <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-shield-400 font-mono text-sm font-bold">{progress}%</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl animate-float" style={{ animationDuration: '4s' }}>📂</div>
                <div>
                  <p className="text-dark-100 font-bold text-xl mb-2">
                    Drop firmware files here
                  </p>
                  <p className="text-dark-500 text-sm">
                    .c · .cpp · .h · .hpp · .zip — up to 10 MB per file
                  </p>
                </div>
                <div>
                  <button type="button" className="btn-primary px-6 py-2.5">
                    <span>📁</span> Browse Files
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl text-red-200 text-sm animate-slide-up flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <span className="text-red-400 shrink-0">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-400 text-base">×</button>
          </div>
        )}

        {/* ── Demo Samples ─────────────────────────────────────────────────── */}
        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs font-bold text-dark-600 tracking-widest uppercase px-3">
              Or try a demo sample
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {DEMO_SAMPLES.map((s, idx) => (
              <button
                key={s.id}
                disabled={!!loadingDemo}
                onClick={() => handleDemoLoad(s.id)}
                className={`text-left rounded-2xl p-4 transition-all duration-300 group relative overflow-hidden
                  ${loadingDemo === s.id ? 'opacity-60 scale-95' : 'hover:scale-[1.02] hover:-translate-y-0.5'}
                  ${s.border}
                `}
                style={{
                  background: `linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.6))`,
                  border: loadingDemo === s.id
                    ? '1px solid rgba(22,163,74,0.3)'
                    : `1px solid rgba(255,255,255,0.08)`,
                  animationDelay: `${idx * 60}ms`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => {
                  if (!loadingDemo) e.currentTarget.style.borderColor = 'rgba(22,163,74,0.2)'
                }}
                onMouseLeave={e => {
                  if (!loadingDemo) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${s.color.replace('from-', '').replace(' to-', ', ')})` }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{s.icon}</span>
                    {loadingDemo === s.id ? (
                      <div className="spinner w-4 h-4 text-shield-400" />
                    ) : (
                      <span className={s.badgeCls}>{s.severity}</span>
                    )}
                  </div>
                  <div className="font-bold text-dark-100 text-sm mb-1 leading-snug">{s.label}</div>
                  <div className="font-mono text-xs text-dark-500 mb-2">{s.cwe}</div>
                  <div className="text-xs text-dark-600 leading-snug">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats footer ─────────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-dark-700 animate-fade-in"
          style={{ animationDelay: '500ms' }}
        >
          <span className="flex items-center gap-1.5">
            <span className="text-shield-700">●</span> Runs fully offline in mock mode
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyber-700">●</span> Supports Anthropic · OpenAI · Gemini · DeepSeek
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-shield-700">●</span> CWE-121, 134, 190, 416, 476 covered
          </span>
        </div>
      </div>
    </div>
  )
}
