/**
 * pages/ReportPage.jsx — Pipeline Report Page (Step 5)
 *
 * Responsibility:
 *   Display the complete PipelineResult for a run, including:
 *   - Summary metrics (total vulns found/fixed)
 *   - IoT resource impact metrics from M4
 *   - LLM-generated plain-English explanation from M4
 *   - Download button for HTML/PDF report
 *
 * TODO:
 *   - Fetch report from api.getReport(id) using the :id URL param.
 *   - Render MetricsChart for binary size delta.
 *   - Add a "Share" button that copies the report URL to clipboard.
 *   - Implement PDF download via backend GET /api/report/{id}/download.
 */

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-dark-100 mb-2">
          📊 M4 — Pipeline Report
        </h1>
        <p className="text-dark-400 mb-2">
          Report ID: <code className="font-mono text-cyber-300">{id ?? 'N/A'}</code>
        </p>
        <p className="text-dark-500 text-sm mb-8">
          Full analysis · repair · verification · IoT impact metrics
        </p>

        <div className="card text-center py-16">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-dark-300">
            Report not found or not yet generated.
          </p>
          <button className="btn-secondary mt-4" onClick={() => navigate('/')}>
            ← Start New Analysis
          </button>
        </div>
      </div>
    </main>
  )
}
