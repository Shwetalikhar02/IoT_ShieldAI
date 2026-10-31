/**
 * pages/AnalysisPage.jsx — Vulnerability Analysis Page (Step 2)
 *
 * Responsibility:
 *   Display the vulnerabilities detected by M1 (static analysis).
 *   Shows a summary card and a scrollable list of VulnCards ordered by severity.
 *
 * TODO:
 *   - Fetch vulnerabilities from api.analyzeFirmware(upload_id).
 *   - Show a loading skeleton while analysis runs.
 *   - Allow clicking a vulnerability to expand its details.
 *   - Add a "Repair All" button that sends all vuln IDs to /repair.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AnalysisPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-dark-100 mb-2">
          🔍 M1 — Vulnerability Analysis
        </h1>
        <p className="text-dark-400 mb-8">
          Static analysis results from cppcheck + semgrep
        </p>

        {/* Placeholder summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Critical', count: 0, cls: 'badge-critical' },
            { label: 'High',     count: 0, cls: 'badge-high' },
            { label: 'Medium',   count: 0, cls: 'badge-medium' },
            { label: 'Low',      count: 0, cls: 'badge-low' },
          ].map(({ label, count, cls }) => (
            <div key={label} className="card text-center">
              <div className="text-3xl font-bold text-dark-100">{count}</div>
              <span className={`mt-2 ${cls}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">🔬</div>
          <p className="text-dark-300">
            No vulnerabilities loaded yet. Upload a firmware file first.
          </p>
          <button className="btn-secondary mt-4" onClick={() => navigate('/')}>
            ← Back to Upload
          </button>
        </div>
      </div>
    </main>
  )
}
