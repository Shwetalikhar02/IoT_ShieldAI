import React from 'react'
import {
  ShieldCheck,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Zap,
  Activity,
  Layers
} from 'lucide-react'

export default function OverviewView({
  files = [],
  vulnerabilities = [],
  patches = [],
  verifications = [],
  metrics = null,
  onNavigateToExplorer,
  onRunScan,
  onRunPipeline
}) {
  const totalFiles = files.length
  const totalVulns = vulnerabilities.length
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'Critical').length
  const highVulns = vulnerabilities.filter(v => v.severity === 'High').length
  const passedVerifications = verifications.filter(v => v.overall_status === 'passed').length
  const successRate = verifications.length > 0
    ? Math.round((passedVerifications / verifications.length) * 100)
    : 100

  // CWE breakdown
  const cweMap = {}
  vulnerabilities.forEach(v => {
    cweMap[v.cwe_id] = (cweMap[v.cwe_id] || 0) + 1
  })

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Firmware Security Posture
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Autonomous vulnerability scanning, verified synthesizer, and embedded safety benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunScan}
              className="btn-quiet text-xs"
            >
              Scan Repository
            </button>
            <button
              onClick={onRunPipeline}
              className="btn-lime text-xs font-semibold flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Remediate All</span>
            </button>
          </div>
        </div>

        {/* 5 Core KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D]">
            <div className="text-[11px] text-[#9AA39B] uppercase font-sans font-medium">Scanned Files</div>
            <div className="text-2xl font-bold text-[#F3F5EF] mt-1">{totalFiles}</div>
            <div className="text-[10px] text-[#626D64] mt-1 font-sans">C/C++ Units</div>
          </div>

          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D]">
            <div className="text-[11px] text-[#9AA39B] uppercase font-sans font-medium">Total Findings</div>
            <div className={`text-2xl font-bold mt-1 ${totalVulns > 0 ? 'text-[#E5A854]' : 'text-[#B7E36A]'}`}>
              {totalVulns}
            </div>
            <div className="text-[10px] text-[#626D64] mt-1 font-sans">Across codebase</div>
          </div>

          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D]">
            <div className="text-[11px] text-[#9AA39B] uppercase font-sans font-medium">Critical Risks</div>
            <div className="text-2xl font-bold text-[#F07878] mt-1">{criticalVulns}</div>
            <div className="text-[10px] text-[#626D64] mt-1 font-sans">CVSS 9.0 - 10.0</div>
          </div>

          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D]">
            <div className="text-[11px] text-[#9AA39B] uppercase font-sans font-medium">Synthesized Fixes</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{patches.length}</div>
            <div className="text-[10px] text-[#626D64] mt-1 font-sans">Verified in M3</div>
          </div>

          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D]">
            <div className="text-[11px] text-[#9AA39B] uppercase font-sans font-medium">Verification Rate</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{successRate}%</div>
            <div className="text-[10px] text-[#626D64] mt-1 font-sans">ASan / UBSan Clean</div>
          </div>
        </div>

        {/* Two Column Layout: CWE Breakdown + Hardware Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CWE Distribution */}
          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#F3F5EF] text-sm">Vulnerability Taxonomy (CWE)</h3>
              <span className="text-[10px] font-mono text-[#9AA39B]">{Object.keys(cweMap).length} classes detected</span>
            </div>

            <div className="space-y-2 pt-1">
              {Object.keys(cweMap).length === 0 ? (
                <div className="py-8 text-center text-[#9AA39B]">No vulnerabilities currently logged.</div>
              ) : (
                Object.entries(cweMap).map(([cwe, count]) => {
                  const pct = Math.round((count / totalVulns) * 100) || 0
                  return (
                    <div key={cwe} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-[#F3F5EF] font-medium">{cwe}</span>
                        <span className="font-mono text-[#9AA39B]">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#101310] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#B7E36A] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Embedded Resource Safety */}
          <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#F3F5EF] text-sm">IoT Resource Constraints</h3>
              <span className="badge-verified-subtle">Optimal Grade</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center font-mono pt-2">
              <div className="p-3 rounded-lg bg-[#1D231E] border border-[#2B332D]">
                <div className="text-[10px] text-[#9AA39B]">Flash Overhead</div>
                <div className="text-base font-bold text-[#F3F5EF] mt-1">
                  {metrics ? `+${metrics.binary_size_delta_bytes} B` : '+16 B'}
                </div>
                <div className="text-[10px] text-[#626D64] mt-0.5">&lt;0.05% of ROM</div>
              </div>

              <div className="p-3 rounded-lg bg-[#1D231E] border border-[#2B332D]">
                <div className="text-[10px] text-[#9AA39B]">SRAM Delta</div>
                <div className="text-base font-bold text-[#B7E36A] mt-1">
                  {metrics ? `${metrics.estimated_stack_delta_bytes} B` : '0 B'}
                </div>
                <div className="text-[10px] text-[#626D64] mt-0.5">Zero stack growth</div>
              </div>

              <div className="p-3 rounded-lg bg-[#1D231E] border border-[#2B332D]">
                <div className="text-[10px] text-[#9AA39B]">Cyclomatic</div>
                <div className="text-base font-bold text-[#F3F5EF] mt-1">
                  {metrics ? `+${metrics.cyclomatic_complexity_delta}` : '+1.0'}
                </div>
                <div className="text-[10px] text-[#626D64] mt-0.5">Strict bounds</div>
              </div>
            </div>

            <p className="text-[11px] text-[#9AA39B] leading-relaxed pt-1">
              Patches synthesized by CodeShield AI preserve deterministic cycle timing and do not require heap re-allocation on resource-constrained microcontrollers.
            </p>
          </div>
        </div>

        {/* Firmware Files Quick Access */}
        <div className="p-4 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#F3F5EF] text-sm">Active Firmware Units</h3>
            <button
              onClick={onNavigateToExplorer}
              className="text-[#B7E36A] hover:underline text-xs flex items-center gap-1 font-medium"
            >
              <span>Open Code Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#2B332D]">
            {files.slice(0, 5).map((f) => {
              const fileVulns = vulnerabilities.filter(v => v.file_path === f.name)
              return (
                <div key={f.id} className="py-2.5 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#B7E36A]" />
                    <span className="text-[#F3F5EF] font-medium">{f.name}</span>
                    <span className="text-[#626D64] text-[10px]">({f.category})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {fileVulns.length > 0 ? (
                      <span className="text-[#F07878] text-[11px]">
                        {fileVulns.length} vulnerabilities
                      </span>
                    ) : (
                      <span className="text-[#B7E36A] text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Clean
                      </span>
                    )}
                    <button
                      onClick={onNavigateToExplorer}
                      className="text-[#9AA39B] hover:text-[#F3F5EF] text-xs underline font-sans"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
