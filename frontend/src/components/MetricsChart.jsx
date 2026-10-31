/**
 * components/MetricsChart.jsx — IoT Resource Metrics Chart
 *
 * Responsibility:
 *   Visualise the IoT resource impact of patches:
 *   - Binary size before vs after (bar chart)
 *   - Stack usage delta (horizontal bar)
 *   - Cyclomatic complexity delta (gauge)
 *
 * Props:
 *   - metrics: IoTMetrics  — from the PipelineResult API response
 *
 * TODO:
 *   - Integrate a charting library (recharts or Chart.js).
 *   - Add colour coding: green if binary shrinks, red if it grows.
 *   - Add tooltips explaining what each metric means for IoT devices.
 *   - Export chart as PNG for the PDF report.
 */

import React from 'react'

/**
 * @param {{ metrics: object }} props
 */
export default function MetricsChart({ metrics }) {
  if (!metrics) {
    return (
      <div className="card text-center py-8 text-dark-400">
        No metrics available yet.
      </div>
    )
  }

  const { binary_size_before_bytes, binary_size_after_bytes, binary_size_delta_bytes } = metrics

  return (
    <div className="card">
      <h3 className="text-dark-100 font-semibold mb-4">IoT Resource Impact</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-dark-200">
            {binary_size_before_bytes != null ? `${binary_size_before_bytes} B` : 'N/A'}
          </div>
          <div className="text-dark-400 text-xs mt-1">Binary (Before)</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-dark-200">
            {binary_size_after_bytes != null ? `${binary_size_after_bytes} B` : 'N/A'}
          </div>
          <div className="text-dark-400 text-xs mt-1">Binary (After)</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${
            binary_size_delta_bytes == null ? 'text-dark-400'
            : binary_size_delta_bytes <= 0 ? 'text-shield-400'
            : 'text-red-400'
          }`}>
            {binary_size_delta_bytes != null
              ? `${binary_size_delta_bytes >= 0 ? '+' : ''}${binary_size_delta_bytes} B`
              : 'N/A'}
          </div>
          <div className="text-dark-400 text-xs mt-1">Size Delta</div>
        </div>
      </div>
      {/* TODO: Add recharts BarChart here */}
    </div>
  )
}
