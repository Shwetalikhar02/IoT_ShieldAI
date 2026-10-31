/**
 * components/CodeDiffViewer.jsx — Side-by-Side Code Diff Component
 *
 * Responsibility:
 *   Render a side-by-side (or unified) diff between original and patched
 *   C/C++ code.  Lines are syntax-highlighted and added/removed lines are
 *   coloured green/red respectively.
 *
 * Props:
 *   - originalCode: string   — the vulnerable code snippet
 *   - patchedCode: string    — the fixed code snippet
 *   - diff: string           — unified diff string (optional; parsed if provided)
 *   - language: string       — "c" | "cpp" (default: "c")
 *
 * TODO:
 *   - Integrate a syntax highlighter (react-syntax-highlighter or Prism.js).
 *   - Parse the unified diff to mark +/- lines.
 *   - Add line numbers on the left.
 *   - Add a "Copy patched code" button.
 */

import React from 'react'

/**
 * @param {{ originalCode: string, patchedCode: string, diff?: string }} props
 */
export default function CodeDiffViewer({ originalCode = '', patchedCode = '', diff }) {
  // TODO: Parse diff and render side-by-side highlighted code
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs text-red-400 font-semibold mb-2 uppercase tracking-wide">
          Original (Vulnerable)
        </div>
        <pre className="card font-mono text-sm text-red-200 overflow-x-auto whitespace-pre">
          <code>{originalCode || '// No code provided'}</code>
        </pre>
      </div>
      <div>
        <div className="text-xs text-shield-400 font-semibold mb-2 uppercase tracking-wide">
          Patched (Fixed)
        </div>
        <pre className="card font-mono text-sm text-shield-200 overflow-x-auto whitespace-pre">
          <code>{patchedCode || '// No patch generated yet'}</code>
        </pre>
      </div>
    </div>
  )
}
