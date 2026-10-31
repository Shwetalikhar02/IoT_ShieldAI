/**
 * pages/RepairPage.jsx — Patch Repair Page (Step 3)
 *
 * Responsibility:
 *   Show each vulnerability alongside its M2-generated patch.
 *   Display a side-by-side diff (original vs patched code) with the
 *   repair strategy (template or LLM) and the explanation.
 *
 * TODO:
 *   - For each vulnerability, call api.repairVulnerability(vuln_id).
 *   - Use the CodeDiffViewer component to render the diff.
 *   - Show retry count and which strategy was used.
 *   - Allow manual override: trigger LLM if template was used (and vice versa).
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RepairPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-dark-100 mb-2">
          🔧 M2 — Repair Patches
        </h1>
        <p className="text-dark-400 mb-8">
          Template-based fixes and LLM-generated patches
        </p>

        <div className="card text-center py-16">
          <div className="text-4xl mb-4">🩹</div>
          <p className="text-dark-300">
            No patches generated yet. Run analysis first.
          </p>
          <button className="btn-secondary mt-4" onClick={() => navigate('/analyze')}>
            ← Back to Analysis
          </button>
        </div>
      </div>
    </main>
  )
}
