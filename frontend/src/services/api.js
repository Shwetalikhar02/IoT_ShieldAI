/**
 * services/api.js — Axios API Client
 *
 * All HTTP calls from the frontend to the FastAPI backend.
 * Base URL /api is proxied by Vite to http://localhost:8000.
 */

import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 180_000,  // 3 min for pipeline runs
  headers: { 'Content-Type': 'application/json' },
})

// ── Global error interceptor ─────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    console.error('[api]', err.response?.status, msg)
    return Promise.reject(new Error(msg))
  }
)

// ── Upload ───────────────────────────────────────────────────────────────────

/** POST /api/upload — Upload firmware files */
export async function uploadFirmware(files, onProgress) {
  const formData = new FormData()
  Array.from(files).forEach(f => formData.append('files', f))
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  return data  // { upload_id, file_count, files }
}

// ── Demo ─────────────────────────────────────────────────────────────────────

/** GET /api/demo/samples — List demo samples */
export async function getDemoSamples() {
  const { data } = await api.get('/demo/samples')
  return data  // DemoSample[]
}

/** POST /api/demo/load/{sample_id} — Load a demo sample */
export async function loadDemoSample(sampleId) {
  const { data } = await api.post(`/demo/load/${sampleId}`)
  return data  // { upload_id, sample_id, filename, file_path, expected }
}

// ── Analyze ──────────────────────────────────────────────────────────────────

/** POST /api/analyze/{upload_id} — Run M1 static analysis */
export async function analyzeFirmware(uploadId) {
  const { data } = await api.post(`/analyze/${uploadId}`)
  return data  // VulnerabilityList { total, vulnerabilities[] }
}

// ── Repair ───────────────────────────────────────────────────────────────────

/** POST /api/repair/start — Start a repair session */
export async function startRepair(vulnerabilityPayload) {
  const { data } = await api.post('/repair/start', vulnerabilityPayload)
  return data  // RepairSession
}

/** GET /api/repair/{session_id} — Get session state */
export async function getRepairSession(sessionId) {
  const { data } = await api.get(`/repair/${sessionId}`)
  return data  // RepairSession
}

// ── Verify ───────────────────────────────────────────────────────────────────

/** POST /api/verify — Verify a patch */
export async function verifyPatch(patchId, uploadId) {
  const { data } = await api.post('/verify', { patch_id: patchId, upload_id: uploadId })
  return data  // VerificationResult
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

/** POST /api/pipeline/run/{upload_id} — Run full pipeline synchronously */
export async function runPipeline(uploadId) {
  const { data } = await api.post(`/pipeline/run/${uploadId}`)
  return data  // PipelineResult
}

/**
 * Stream pipeline progress via SSE.
 * @param {string} uploadId
 * @param {(event: string, data: object) => void} onEvent
 * @returns {EventSource}
 */
export function streamPipeline(uploadId, onEvent) {
  const url = `${BASE}/api/pipeline/stream/${uploadId}`
  const es = new EventSource(url)
  es.onmessage = (e) => {
    try { onEvent('message', JSON.parse(e.data)) } catch {}
  }
  // Listen for named events
  ;['step', 'complete', 'error'].forEach(name => {
    es.addEventListener(name, (e) => {
      try { onEvent(name, JSON.parse(e.data)) } catch {}
    })
  })
  es.onerror = () => {
    es.close()
    onEvent('error', { message: 'SSE connection closed' })
  }
  return es
}

// ── Report ───────────────────────────────────────────────────────────────────

/** GET /api/report/{id} — Get pipeline report */
export async function getReport(reportId) {
  const { data } = await api.get(`/report/${reportId}`)
  return data  // PipelineResult
}

/** GET /api/report/{id}/download — Download report as JSON */
export function getReportDownloadUrl(reportId) {
  return `${BASE}/api/report/${reportId}/download`
}

// ── Health ────────────────────────────────────────────────────────────────────

/** GET /health — Health check */
export async function checkHealth() {
  const { data } = await axios.get(`${BASE}/health`)
  return data
}

export default api
