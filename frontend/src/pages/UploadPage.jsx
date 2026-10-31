/**
 * pages/UploadPage.jsx — Firmware Upload (Step 1)
 *
 * Drag-drop upload + demo sample picker.
 * On success, stores upload_id in global store and navigates to /analyze.
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFirmware, loadDemoSample } from '../services/api'
import { usePipeline } from '../store/pipelineStore'

const DEMO_SAMPLES = [
  { id: 'stack_overflow',  label: 'Stack Overflow',  cwe: 'CWE-121', severity: 'Critical', icon: '💥' },
  { id: 'null_ptr_deref',  label: 'NULL Deref',      cwe: 'CWE-476', severity: 'High',     icon: '🔴' },
  { id: 'format_string',   label: 'Format String',   cwe: 'CWE-134', severity: 'High',     icon: '⚠️' },
  { id: 'use_after_free',  label: 'Use After Free',  cwe: 'CWE-416', severity: 'Critical', icon: '☠️' },
  { id: 'integer_overflow',label: 'Int Overflow',    cwe: 'CWE-190', severity: 'High',     icon: '🔢' },
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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Hero header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-shield-900/50 border border-shield-500/30 mb-4 glow-green">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-3">IoT ShieldAI</h1>
          <p className="text-dark-300 text-lg leading-relaxed max-w-md mx-auto">
            AI-powered vulnerability detection, automated repair, and trust verification for IoT firmware
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-dark-500">
            <span>🔍 M1 Static Analysis</span>
            <span>🔧 M2 Repair (Template + LLM)</span>
            <span>✅ M3 ASan Verification</span>
            <span>📊 M4 Metrics</span>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`card border-2 border-dashed cursor-pointer transition-all duration-200 mb-6
            ${dragging
              ? 'border-shield-400 bg-shield-900/20 glow-green scale-[1.01]'
              : 'border-white/15 hover:border-shield-600/50 hover:bg-white/2'
            }
          `}
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
          <div className="py-10 text-center">
            {uploading ? (
              <div className="space-y-4">
                <div className="spinner w-10 h-10 mx-auto text-shield-400" />
                <p className="text-dark-200 font-semibold">Uploading firmware…</p>
                <div className="w-48 mx-auto bg-dark-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-shield-600 to-cyber-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-dark-400 text-sm">{progress}%</p>
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4">📁</div>
                <p className="text-dark-100 font-semibold text-lg mb-1">
                  Drop C/C++ firmware files here
                </p>
                <p className="text-dark-400 text-sm mb-6">
                  .c · .cpp · .h · .hpp — up to 10 MB per file
                </p>
                <button type="button" className="btn-primary">
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        {/* Demo samples */}
        <div>
          <p className="section-label text-center mb-4">Or load a demo sample</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEMO_SAMPLES.map(s => (
              <button
                key={s.id}
                disabled={!!loadingDemo}
                onClick={() => handleDemoLoad(s.id)}
                className={`card p-4 text-left hover:border-shield-500/30 hover:bg-shield-900/10 transition-all duration-200 group
                  ${loadingDemo === s.id ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  {loadingDemo === s.id
                    ? <div className="spinner w-4 h-4 text-shield-400" />
                    : <span className={`badge-${s.severity === 'Critical' ? 'critical' : 'high'}`}>{s.severity}</span>
                  }
                </div>
                <div className="font-semibold text-dark-100 text-sm mb-1">{s.label}</div>
                <div className="text-xs text-dark-400 font-mono">{s.cwe}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
