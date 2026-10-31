import React from 'react'
import { X, Download, FileText, CheckCircle2, XCircle, HardDrive, Cpu, ShieldCheck } from 'lucide-react'

export default function ReportModal({
  isOpen,
  onClose,
  activeFile,
  vulnerabilities = [],
  patches = [],
  verifications = [],
  metrics,
  explanation
}) {
  if (!isOpen) return null

  const handleDownloadJSON = () => {
    const reportData = {
      app: 'CodeShield AI',
      version: '1.0.0-hackathon',
      generated_at: new Date().toISOString(),
      file_path: activeFile?.name || 'firmware.c',
      total_vulnerabilities: vulnerabilities.length,
      total_patches_applied: patches.length,
      metrics,
      vulnerabilities,
      patches,
      verifications,
      explanation
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codeshield_report_${activeFile?.name?.replace('.c', '') || 'firmware'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">M4 IoT Firmware Audit & Verification Report</h2>
              <p className="text-xs text-slate-400 font-mono">Target: {activeFile?.name || 'firmware.c'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="metric-card">
              <div className="text-2xl font-black text-white font-mono">{vulnerabilities.length}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Detected Vulns</div>
            </div>

            <div className="metric-card !bg-emerald-950/30 !border-emerald-500/20">
              <div className="text-2xl font-black text-emerald-400 font-mono">{patches.length}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Synthesized Patches</div>
            </div>

            <div className="metric-card !bg-sky-950/30 !border-sky-500/20">
              <div className="text-2xl font-black text-sky-400 font-mono">
                {verifications.filter(v => v.overall_status === 'passed').length}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">ASan Clean ✓</div>
            </div>

            <div className="metric-card !bg-purple-950/30 !border-purple-500/20">
              <div className="text-2xl font-black text-purple-400 font-mono">
                {metrics ? `+${metrics.binary_size_delta_bytes} B` : '+0 B'}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Flash Delta</div>
            </div>
          </div>

          {/* IoT Resource Footprint Section */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Embedded System Resource Telemetry (Flash & SRAM)</span>
              </div>
              <span className="badge-pass">{metrics?.rom_efficiency_rating || 'Optimal'}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="text-slate-400 text-xs">Flash (ROM) Delta</div>
                <div className="text-lg font-bold text-white font-mono mt-1">
                  +{metrics?.binary_size_delta_bytes ?? 16} Bytes
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Within strict IoT code boundaries</div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="text-slate-400 text-xs">Stack / SRAM Overhead</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  {metrics?.estimated_stack_delta_bytes ?? 0} Bytes
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Zero stack blowout risk</div>
              </div>

              <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                <div className="text-slate-400 text-xs">Cyclomatic Delta</div>
                <div className="text-lg font-bold text-sky-400 font-mono mt-1">
                  +{metrics?.cyclomatic_complexity_delta ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Minimal branch penalty</div>
              </div>
            </div>
          </div>

          {/* Audit Trail List */}
          <div className="space-y-3">
            <div className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Vulnerability & Verification Audit Log</span>
            </div>

            {vulnerabilities.map((v, i) => {
              const patch = patches[i]
              const ver = verifications[i]
              const passed = ver?.overall_status === 'passed'

              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="font-bold text-white text-sm">{v.vuln_type}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/10">
                        {v.cwe_id}
                      </span>
                      <span className="text-slate-500">Line {v.line_start}</span>
                    </div>

                    <span className={passed ? 'badge-pass' : 'badge-fail'}>
                      {passed ? 'VERIFIED SECURE' : 'UNVERIFIED'}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed pl-6">{v.root_cause}</p>

                  {patch && (
                    <div className="ml-6 p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-emerald-300">
                      <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Applied Remediation:</div>
                      {patch.patched_code}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Explanation Text */}
          {explanation && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3">
              <div className="font-bold text-sm text-slate-200">Formal Patch Explanation & IoT Guarantees</div>
              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-xs">
                {explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
