/**
 * components/SeverityBadge.jsx — Severity Badge Component
 *
 * Responsibility:
 *   Render a coloured badge for a severity level (Critical/High/Medium/Low).
 *
 * Props:
 *   - severity: "Critical" | "High" | "Medium" | "Low"
 *
 * TODO:
 *   - Add tooltip with CVSS score range (Critical: 9.0–10, High: 7.0–8.9, etc.)
 */

import React from 'react'

const CLASS_MAP = {
  Critical: 'badge-critical',
  High:     'badge-high',
  Medium:   'badge-medium',
  Low:      'badge-low',
}

/**
 * @param {{ severity: string }} props
 */
export default function SeverityBadge({ severity }) {
  const cls = CLASS_MAP[severity] ?? 'badge-low'
  return <span className={cls}>{severity ?? 'Unknown'}</span>
}
