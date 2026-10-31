import React, { useState } from 'react'
import { X, Play, Download, CheckCircle2, XCircle, BarChart2, ShieldCheck, Clock, Award } from 'lucide-react'
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
    a.download = `shieldai_benchmark_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Problem Statement 15 — Automated Benchmark Suite</h2>
              <p className="text-xs text-slate-400 font-mono">5 Demo Firmware + Juliet Suite + Anti-Cheating Rejection</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {benchmarkData && (
              <button
                onClick={handleExportJSON}
                className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            )}

            <button
              onClick={handleStartBenchmark}
              disabled={running}
              className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              {running ? (
                <>
                  <div className="spinner !w-3 !h-3" />
                  <span>Running Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>{benchmarkData ? 'Re-run Benchmark' : 'Run Benchmark'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Running progress indicator */}
          {running && progress && (
            <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 space-y-2 animate-pulse">
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Phase: {progress.phase} ({progress.current}/{progress.total})</span>
                <span className="font-mono text-sky-400">{progress.item}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-2 transition-all duration-200"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!benchmarkData && !running && (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto text-xl">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Benchmark CodeShield AI Autonomous Pipeline</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Click <strong>Run Benchmark</strong> to execute end-to-end vulnerability scanning, template & LLM patch synthesis, ASan sanitizer execution, and anti-cheating bypass verification across all firmware test vectors.
              </p>
              <button
                onClick={handleStartBenchmark}
                className="btn-primary !py-2 !px-4 text-xs font-semibold mx-auto"
              >
                Start Verification Run
              </button>
            </div>
          )}

          {benchmarkData && (
            <div className="space-y-6 animate-slide-up">
              {/* Score KPI Badges */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="metric-card !bg-slate-900/80 !border-white/10">
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {benchmarkData.detection_recall_rate}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Detection Recall</div>
                </div>

                <div className="metric-card !bg-slate-900/80 !border-white/10">
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {benchmarkData.compile_rate}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Compile Rate</div>
                </div>

                <div className="metric-card !bg-slate-900/80 !border-white/10">
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {benchmarkData.asan_clean_rate}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">ASan Clean Rate</div>
                </div>

                <div className="metric-card !bg-slate-900/80 !border-white/10">
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    {benchmarkData.equivalence_rate}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Equivalence Rate</div>
                </div>

                <div className="metric-card !bg-slate-900/80 !border-white/10">
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {benchmarkData.no_cheating_rejection_rate}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Cheat Rejection</div>
                </div>
              </div>

              {/* Benchmark Summary Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
                <div className="p-3 bg-slate-900/90 border-b border-white/10 font-bold text-xs text-white flex items-center justify-between">
                  <span>Detailed Evaluation Matrix</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Total Time: {benchmarkData.total_time_ms}ms ({benchmarkData.avg_latency_ms}ms avg)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-[11px]">
                        <th className="p-3">Sample File</th>
                        <th className="p-3">CWE ID</th>
                        <th className="p-3">Vulnerability Class</th>
                        <th className="p-3">M1 Detect</th>
                        <th className="p-3">M3 ASan</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {benchmarkData.results.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-semibold text-white">{row.filename}</td>
                          <td className="p-3 text-slate-400">{row.cwe_id}</td>
                          <td className="p-3 text-slate-300 font-sans">{row.vuln_type}</td>
                          <td className="p-3 text-emerald-400">✓ Detected</td>
                          <td className="p-3">
                            {row.asan_clean ? (
                              <span className="text-emerald-400">✓ Clean</span>
                            ) : row.no_cheating_rejected ? (
                              <span className="text-amber-400">🛡️ Rejected Cheat</span>
                            ) : (
                              <span className="text-red-400">✗ Failed</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500">{row.duration_ms} ms</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status.includes('PASSED')
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
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
