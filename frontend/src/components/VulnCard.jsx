/**
 * components/VulnCard.jsx — Vulnerability Card Component
 *
 * Responsibility:
 *   Display a single vulnerability in a compact card format with:
 *   - CWE ID badge and severity badge
 *   - File path + line range
 *   - Short description and root cause
 *   - Expand/collapse for full code snippet
 *
 * Props:
 *   - vuln: Vulnerability  — the vulnerability object from the API
 *   - onRepair: () => void — callback to trigger M2 repair for this vuln
 *
 * TODO:
 *   - Add click-to-expand for the code snippet.
 *   - Wire onRepair callback to the Repair button.
 *   - Add a "Copy CWE ID" button.
 */

import React, { useState } from 'react'
import SeverityBadge from './SeverityBadge'

/**
 * @param {{ vuln: object, onRepair?: () => void }} props
 */
export default function VulnCard({ vuln, onRepair }) {
  const [expanded, setExpanded] = useState(false)

  if (!vuln) return null

  return (
    <div className="card mb-4 hover:border-cyber-600/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs bg-dark-800 text-cyber-300 px-2 py-0.5 rounded border border-cyber-700/40">
              {vuln.cwe_id}
            </span>
            <SeverityBadge severity={vuln.severity} />
          </div>
          <h3 className="text-dark-100 font-semibold truncate">{vuln.vuln_type}</h3>
          <p className="text-dark-400 text-sm mt-1">
            {vuln.file_path}:{vuln.line_start}–{vuln.line_end}
          </p>
          <p className="text-dark-300 text-sm mt-2">{vuln.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="btn-secondary text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} Code
          </button>
          {onRepair && (
            <button className="btn-primary text-xs" onClick={onRepair}>
              Repair →
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <pre className="mt-4 font-mono text-sm text-dark-200 bg-dark-950 rounded-lg p-4 overflow-x-auto whitespace-pre border border-dark-200/10">
          <code>{vuln.code_snippet}</code>
        </pre>
      )}
    </div>
  )
}
