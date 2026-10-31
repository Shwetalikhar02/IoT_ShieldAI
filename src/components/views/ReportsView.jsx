import React from 'react'
import {
  FileText,
  Download,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowDownToLine
} from 'lucide-react'

export default function ReportsView({
  activeFile,
  vulnerabilities = [],
  patches = [],
  verifications = [],
  metrics,
  explanation
}) {
  const handleDownloadJSON = () => {
    const reportData = {
      product: 'CodeShield AI',
      category: 'AI-Powered Firmware Security Analysis Platform',
      hackathon: 'AI Manthan',
      problem_statement: 'PS-15',
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

  const passedCount = verifications.filter(v => v.overall_status === 'passed').length

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Firmware Audit & Verification Report (M4)
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Comprehensive report detailing vulnerability remediation, AddressSanitizer evidence, and IoT footprint deltas.
            </p>
          </div>

          <button
            onClick={handleDownloadJSON}
            className="btn-lime text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (JSON)</span>
          </button>
        </div>

        {/* Executive Summary Card */}
        <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2B332D]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B7E36A]" />
              <span className="font-semibold text-sm text-[#F3F5EF]">Executive Remediation Summary</span>
            </div>
            <span className="font-mono text-[11px] text-[#9AA39B]">Target: {activeFile?.name || 'firmware.c'}</span>
          </div>

          <div className="grid grid-cols-4 gap-3 font-mono">
            <div className="p-3 rounded bg-[#101310] border border-[#2B332D]">
              <div className="text-[10px] text-[#9AA39B] uppercase font-sans">Detected Vulns</div>
              <div className="text-xl font-bold text-[#F3F5EF] mt-1">{vulnerabilities.length}</div>
            </div>

            <div className="p-3 rounded bg-[#101310] border border-[#2B332D]">
              <div className="text-[10px] text-[#9AA39B] uppercase font-sans">Patches Synthesized</div>
              <div className="text-xl font-bold text-[#B7E36A] mt-1">{patches.length}</div>
            </div>

            <div className="p-3 rounded bg-[#101310] border border-[#2B332D]">
              <div className="text-[10px] text-[#9AA39B] uppercase font-sans">Verified Clean</div>
              <div className="text-xl font-bold text-[#B7E36A] mt-1">{passedCount}</div>
            </div>

            <div className="p-3 rounded bg-[#101310] border border-[#2B332D]">
              <div className="text-[10px] text-[#9AA39B] uppercase font-sans">Flash Overhead</div>
              <div className="text-xl font-bold text-[#F3F5EF] mt-1">
                {metrics ? `+${metrics.binary_size_delta_bytes}B` : '+16B'}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail List */}
        <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
          <h3 className="font-semibold text-sm text-[#F3F5EF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B7E36A]" />
            <span>Remediation & Sanitizer Verification Trail</span>
          </h3>

          <div className="divide-y divide-[#2B332D]">
            {vulnerabilities.map((v, i) => {
              const patch = patches[i]
              const ver = verifications[i]
              const isPassed = ver?.overall_status === 'passed'

              return (
                <div key={i} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F3F5EF]">{v.vuln_type}</span>
                      <span className="font-mono text-[10px] text-[#9AA39B]">{v.cwe_id}</span>
                      <span className="text-[#626D64] font-mono text-[11px]">Line {v.line_start}</span>
                    </div>

                    <span className={isPassed ? 'badge-verified-subtle' : 'badge-critical-subtle'}>
                      {isPassed ? 'PASSED VERIFICATION' : 'UNVERIFIED'}
                    </span>
                  </div>

                  <p className="text-[#9AA39B] text-xs leading-relaxed">{v.root_cause}</p>

                  {patch && (
                    <div className="p-2.5 rounded bg-[#101310] border border-[#2B332D] font-mono text-[11px] text-[#B7E36A]">
                      <div className="text-[10px] text-[#626D64] mb-1 font-sans">Applied Secure Replacement:</div>
                      {patch.patched_code}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Explainability Section */}
        {explanation && (
          <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-2">
            <h3 className="font-semibold text-sm text-[#F3F5EF]">Formal Verification Statement</h3>
            <div className="text-[#9AA39B] leading-relaxed whitespace-pre-wrap font-mono text-[11px] pt-1">
              {explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
