/**
 * pages/VerificationPage.jsx — Verification Page (Step 4)
 *
 * Responsibility:
 *   Display M3 verification results: compilation status, ASan output,
 *   and no-cheating check.  Show the retry history if a patch required
 *   multiple attempts.
 *
 * TODO:
 *   - For each patch, call api.verifyPatch(patch_id).
 *   - Show green/red status indicators for compiles, sanitizer, no-cheating.
 *   - Display the ASan log in a collapsible code block.
 *   - Highlight the retry path (attempt 1 → 2 → 3) if applicable.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

const StatusIcon = ({ passed }) =>
  passed
    ? <span className="text-shield-400 font-bold">✓ PASS</span>
    : <span className="text-red-400 font-bold">✗ FAIL</span>

export default function VerificationPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-dark-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-dark-100 mb-2">
          ✅ M3 — Verification Results
        </h1>
        <p className="text-dark-400 mb-8">
          Compile check · AddressSanitizer · No-Cheating heuristic
        </p>

        <div className="card text-center py-16">
          <div className="text-4xl mb-4">🧪</div>
          <p className="text-dark-300">
            No verification results yet. Generate patches first.
          </p>
          <button className="btn-secondary mt-4" onClick={() => navigate('/repair')}>
            ← Back to Repair
          </button>
        </div>
      </div>
    </main>
  )
}
