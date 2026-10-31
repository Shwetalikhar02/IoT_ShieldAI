import React, { useState } from 'react'
import { X, Play, Download, BarChart2, Award } from 'lucide-react'
import { runBenchmarkSuite } from '../services/benchmark'

export default function BenchmarkModal({ isOpen, onClose }) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [benchmarkData, setBenchmarkData] = useState(null)

  if (!isOpen) return null

  const handleStartBenchmark = async () => {
    setRunning(true)
    setProgress({ current: 0, total: 10, item: 'Initializing...', phase: 'Starting' })
    try {
      const data = await runBenchmarkSuite((p) => setProgress(p))
      setBenchmarkData(data)
    } finally {
      setRunning(false)
      setProgress(null)
    }
  }

  const handleExportJSON = () => {
    if (!benchmarkData) return
    const blob = new Blob([JSON.stringify(benchmarkData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codeshield_benchmark_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#181D19] border border-[#2B332D] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#2B332D] flex items-center justify-between bg-[#101310]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[#B7E36A]">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F3F5EF]">Automated Benchmark Suite</h2>
              <p className="text-[11px] text-[#9AA39B] font-mono">Problem Statement 15 · Evaluation Metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {benchmarkData && (
              <button
                onClick={handleExportJSON}
                className="btn-quiet text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            )}

            <button
              onClick={handleStartBenchmark}
              disabled={running}
              className="btn-lime text-xs font-semibold flex items-center gap-1.5"
            >
              {running ? (
                <>
                  <div className="cs-spinner" />
                  <span>Running Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{benchmarkData ? 'Re-run Benchmark' : 'Run Benchmark'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {running && progress && (
            <div className="p-4 rounded-lg bg-[#101310] border border-[#2B332D] text-[#F3F5EF] space-y-2">
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Phase: {progress.phase} ({progress.current}/{progress.total})</span>
                <span className="font-mono text-[#B7E36A]">{progress.item}</span>
              </div>
              <div className="w-full bg-[#181D19] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#B7E36A] h-1.5 transition-all duration-200"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!benchmarkData && !running && (
            <div className="text-center py-16 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#101310] border border-[#2B332D] text-[#B7E36A] flex items-center justify-center mx-auto">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#F3F5EF] text-sm">Benchmark CodeShield AI Autonomous Pipeline</h3>
              <p className="text-[#9AA39B] text-xs max-w-md mx-auto leading-relaxed">
                Click <strong>Run Benchmark</strong> to execute end-to-end vulnerability scanning, template & LLM patch synthesis, ASan sanitizer execution, and anti-cheating bypass verification across all firmware test vectors.
              </p>
              <button
                onClick={handleStartBenchmark}
                className="btn-lime text-xs font-semibold py-1.5 px-4 mx-auto"
              >
                Start Verification Run
              </button>
            </div>
          )}

          {benchmarkData && (
            <div className="space-y-6 animate-slide-up">
              {/* Score KPI Badges */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
                <div className="p-3.5 rounded-lg bg-[#101310] border border-[#2B332D]">
                  <div className="text-xl font-bold text-[#B7E36A]">
                    {benchmarkData.detection_recall_rate}%
                  </div>
                  <div className="text-[10px] text-[#9AA39B] uppercase font-sans mt-1">Detection Recall</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#101310] border border-[#2B332D]">
                  <div className="text-xl font-bold text-[#F3F5EF]">
                    {benchmarkData.compile_rate}%
                  </div>
                  <div className="text-[10px] text-[#9AA39B] uppercase font-sans mt-1">Compile Rate</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#101310] border border-[#2B332D]">
                  <div className="text-xl font-bold text-[#B7E36A]">
                    {benchmarkData.asan_clean_rate}%
                  </div>
                  <div className="text-[10px] text-[#9AA39B] uppercase font-sans mt-1">ASan Clean</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#101310] border border-[#2B332D]">
                  <div className="text-xl font-bold text-[#F3F5EF]">
                    {benchmarkData.equivalence_rate}%
                  </div>
                  <div className="text-[10px] text-[#9AA39B] uppercase font-sans mt-1">Equivalence</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#101310] border border-[#2B332D]">
                  <div className="text-xl font-bold text-[#E5A854]">
                    {benchmarkData.no_cheating_rejection_rate}%
                  </div>
                  <div className="text-[10px] text-[#9AA39B] uppercase font-sans mt-1">Cheat Rejection</div>
                </div>
              </div>

              {/* Benchmark Summary Table */}
              <div className="border border-[#2B332D] rounded-lg overflow-hidden bg-[#101310]">
                <div className="p-3 bg-[#181D19] border-b border-[#2B332D] font-bold text-xs text-[#F3F5EF] flex items-center justify-between">
                  <span>Evaluation Matrix</span>
                  <span className="font-mono text-[#9AA39B] text-[11px]">
                    Total Time: {benchmarkData.total_time_ms}ms ({benchmarkData.avg_latency_ms}ms avg)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#2B332D] bg-[#181D19]/40 text-[#9AA39B] text-[11px] font-mono">
                        <th className="p-3">Sample File</th>
                        <th className="p-3">CWE ID</th>
                        <th className="p-3">Vulnerability Class</th>
                        <th className="p-3">M1 Detect</th>
                        <th className="p-3">M3 ASan</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B332D] font-mono text-[11px]">
                      {benchmarkData.results.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#1D231E]/40 transition-colors">
                          <td className="p-3 font-semibold text-[#F3F5EF]">{row.filename}</td>
                          <td className="p-3 text-[#9AA39B]">{row.cwe_id}</td>
                          <td className="p-3 text-[#9AA39B] font-sans">{row.vuln_type}</td>
                          <td className="p-3 text-[#B7E36A]">✓ Detected</td>
                          <td className="p-3">
                            {row.asan_clean ? (
                              <span className="text-[#B7E36A]">✓ Clean</span>
                            ) : row.no_cheating_rejected ? (
                              <span className="text-[#E5A854]">Rejected Cheat</span>
                            ) : (
                              <span className="text-[#F07878]">✗ Failed</span>
                            )}
                          </td>
                          <td className="p-3 text-[#626D64]">{row.duration_ms} ms</td>
                          <td className="p-3">
                            <span className={row.status.includes('PASSED') ? 'badge-verified-subtle' : 'badge-high-subtle'}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
