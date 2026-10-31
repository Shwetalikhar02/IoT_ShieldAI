/**
 * services/api.js — Axios API Client
 *
 * Responsibility:
 *   Centralise all HTTP calls from the frontend to the FastAPI backend.
 *   Uses a single Axios instance with the correct base URL and timeout.
 *   All functions return the `data` field of the Axios response.
 *
 * TODO:
 *   - Implement uploadFirmware(files: FileList): POST /api/upload
 *   - Implement analyzeFirmware(uploadId: string): POST /api/analyze
 *   - Implement repairVulnerability(vulnId: string): POST /api/repair
 *   - Implement verifyPatch(patchId: string): POST /api/verify
 *   - Implement getReport(reportId: string): GET /api/report/{id}
 *   - Add request/response interceptors for global error handling.
 *   - Add an auth header interceptor once authentication is implemented.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000,  // 2 min — LLM calls can be slow
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Interceptors ────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Add toast notifications for API errors
    console.error('[api]', error.response?.status, error.response?.data)
    return Promise.reject(error)
  },
)

// ── Endpoint functions ───────────────────────────────────────────────────────

/**
 * POST /api/upload
 * @param {FileList|File[]} files — firmware source files
 * @returns {{ upload_id: string, files: Array }}
 */
export async function uploadFirmware(files) {
  // TODO: Build FormData and call api.post('/upload', formData, {...})
  throw new Error('uploadFirmware not yet implemented')
}

/**
 * POST /api/analyze
 * @param {string} uploadId
 * @returns {VulnerabilityList}
 */
export async function analyzeFirmware(uploadId) {
  // TODO: const { data } = await api.post('/analyze', { upload_id: uploadId })
  throw new Error('analyzeFirmware not yet implemented')
}

/**
 * POST /api/repair
 * @param {string} vulnerabilityId
 * @param {string} uploadId
 * @returns {Patch}
 */
export async function repairVulnerability(vulnerabilityId, uploadId) {
  // TODO: const { data } = await api.post('/repair', { vulnerability_id: vulnerabilityId, upload_id: uploadId })
  throw new Error('repairVulnerability not yet implemented')
}

/**
 * POST /api/verify
 * @param {string} patchId
 * @returns {VerificationResult}
 */
export async function verifyPatch(patchId) {
  // TODO: const { data } = await api.post('/verify', { patch_id: patchId })
  throw new Error('verifyPatch not yet implemented')
}

/**
 * GET /api/report/{id}
 * @param {string} reportId
 * @returns {PipelineResult}
 */
export async function getReport(reportId) {
  // TODO: const { data } = await api.get(`/report/${reportId}`)
  throw new Error('getReport not yet implemented')
}

/**
 * GET /health
 * @returns {{ status: string, version: string, environment: string, timestamp: string }}
 */
export async function checkHealth() {
  const { data } = await axios.get('/health')
  return data
}

export default api
