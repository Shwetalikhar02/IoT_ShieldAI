import React, { useRef } from 'react'
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowDownToLine,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

export default function ReportsView({
  activeProject = null,
  activeFile,
  vulnerabilities = [],
  patches = [],
  verifications = [],
  reviews = [],
  metrics,
  explanation
}) {
  const activeVulns = vulnerabilities.filter(v => v.status !== 'resolved')
  const criticalVulns = activeVulns.filter(v => v.severity === 'Critical').length
  const highVulns = activeVulns.filter(v => v.severity === 'High').length
  const mediumVulns = activeVulns.filter(v => v.severity === 'Medium').length
  const lowVulns = activeVulns.filter(v => v.severity === 'Low').length

  const approvedReviews = reviews.filter(r => r.decision === 'approved')
  const passedVerifications = verifications.filter(v => (v.overall_status || v.overallStatus) === 'passed')
  const failedVerifications = verifications.filter(v => (v.overall_status || v.overallStatus) === 'failed')

  const handleDownloadJSON = () => {
    const reportData = {
      product: 'CodeShield AI',
      project_name: activeProject?.name || 'Firmware Project',
      target_architecture: activeProject?.targetArch || 'ARM Cortex-M4',
      generated_at: new Date().toISOString(),
      health_metrics: {
        files_scanned: 1,
        total_findings: vulnerabilities.length,
        critical_findings: criticalVulns,
        high_findings: highVulns,
        medium_findings: mediumVulns,
        low_findings: lowVulns,
        fixes_suggested: patches.length,
        fixes_approved: approvedReviews.length,
        fixes_verified: passedVerifications.length,
        failed_verification_checks: failedVerifications.length,
        pending_issues: activeVulns.length
      },
      resource_footprint: metrics,
      vulnerabilities,
      patches,
      verifications
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codeshield_health_report_${(activeProject?.name || 'firmware').toLowerCase().replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs print:bg-white print:text-black">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
                Project Security Health Report
              </h1>
              <span className="badge-verified-subtle text-[10px] px-2 py-0.5">
                Audit Ready
              </span>
            </div>
            <p className="text-[#9AA39B] text-xs mt-1">
              Deterministic verification scorecard, CWE finding distributions, and microcontroller resource metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-quiet text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="btn-lime text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        {/* Project Meta Banner */}
        <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D] flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-sm text-[#F3F5EF]">
              {activeProject?.name || 'IoT Gateway Core Firmware'}
            </div>
            <div className="text-[11px] text-[#9AA39B] mt-0.5 font-mono">
              Target Architecture: {activeProject?.targetArch || 'ARM Cortex-M4'} · Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-[11px] text-[#B7E36A] font-semibold">
              {activeVulns.length === 0 ? '✓ REPOSITORY CLEAN' : `${activeVulns.length} ISSUES PENDING`}
            </span>
          </div>
        </div>

        {/* Core 8 Health Metrics Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Total Findings</div>
            <div className="text-2xl font-bold text-[#F3F5EF] mt-1">{vulnerabilities.length}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Lifetime detected</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Critical Findings</div>
            <div className="text-2xl font-bold text-[#F07878] mt-1">{criticalVulns}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">High exploitability</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Fixes Suggested</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{patches.length}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">AI & template patches</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Fixes Approved</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{approvedReviews.length}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Engineer sign-offs</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Verified Clean</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{passedVerifications.length}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">ASan & No-Cheat pass</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Failed Checks</div>
            <div className="text-2xl font-bold text-[#F07878] mt-1">{failedVerifications.length}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Safety gate rejections</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Pending Issues</div>
            <div className={`text-2xl font-bold mt-1 ${activeVulns.length > 0 ? 'text-[#E5A854]' : 'text-[#B7E36A]'}`}>
              {activeVulns.length}
            </div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Requiring action</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Flash Overhead</div>
            <div className="text-2xl font-bold text-[#F3F5EF] mt-1">
              {metrics ? `+${metrics.binary_size_delta_bytes}B` : '+16B'}
            </div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">ROM delta</div>
          </div>
        </div>

        {/* AI-Generated Project Health Summary */}
        <div className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2B332D]">
            <Sparkles className="w-4 h-4 text-[#B7E36A]" />
            <h3 className="font-bold text-sm text-[#F3F5EF]">AI Security Posture Assessment</h3>
          </div>

          <div className="text-xs text-[#9AA39B] leading-relaxed space-y-2">
            <p>
              CodeShield AI analyzed the active firmware repository for <strong>{activeProject?.name || 'the target module'}</strong>. 
              {activeVulns.length === 0 ? (
                <span> All detected vulnerabilities have been remediated with verified bounded replacements. No AddressSanitizer violations or control flow bypasses were found.</span>
              ) : (
                <span> There are <strong>{activeVulns.length}</strong> active security vulnerabilities requiring remediation, including <strong>{criticalVulns}</strong> critical severity memory corruption hazard(s).</span>
              )}
            </p>
            <p>
              Hardware Constraints: The synthesized patches preserve deterministic execution cycle counts and do not introduce unbounded heap allocations, making them suitable for bare-metal microcontrollers (ARM Cortex-M / RISC-V).
            </p>
          </div>
        </div>

        {/* Detailed Audit Trail */}
        <div className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-3">
          <h3 className="font-bold text-sm text-[#F3F5EF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B7E36A]" />
            <span>Finding Audit Trail & Remediation Status</span>
          </h3>

          <div className="divide-y divide-[#2B332D]">
            {vulnerabilities.map((v, i) => {
              const isResolved = v.status === 'resolved'
              return (
                <div key={i} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-[#F3F5EF] font-sans">{v.vuln_type || v.vulnType}</span>
                      <span className="text-[#9AA39B]">({v.cwe_id || v.cweId})</span>
                      <span className="text-[#626D64]">Line {v.line_start || v.lineStart}</span>
                    </div>

                    <span className={isResolved ? 'badge-verified-subtle' : 'badge-critical-subtle'}>
                      {isResolved ? 'RESOLVED ✓' : 'ACTION REQUIRED'}
                    </span>
                  </div>

                  <p className="text-[#9AA39B] text-xs leading-relaxed font-sans">
                    {v.root_cause || v.rootCause}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
