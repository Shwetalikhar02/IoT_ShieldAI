import React, { useState } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  Wand2,
  Code2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Flame,
  ShieldAlert
} from 'lucide-react'

export default function FindingsView({
  vulnerabilities = [],
  onInspectVuln,
  onTriggerFix
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortByPriority, setSortByPriority] = useState(true)

  const filtered = vulnerabilities.filter(v => {
    const sev = (v.severity || '').toUpperCase()
    const matchesSev = filterSeverity === 'ALL' || sev === filterSeverity
    const type = (v.vuln_type || v.vulnType || '').toLowerCase()
    const cwe = (v.cwe_id || v.cweId || '').toLowerCase()
    const file = (v.file_path || v.filePath || '').toLowerCase()
    const query = searchQuery.toLowerCase()

    return matchesSev && (type.includes(query) || cwe.includes(query) || file.includes(query))
  })

  // Priority sorting calculation (P1 Critical, P2 High, P3 Medium)
  const getPriorityWeight = (v) => {
    if (v.priorityRank) return v.priorityRank
    if (v.severity === 'Critical') return 1
    if (v.severity === 'High') return 2
    if (v.severity === 'Medium') return 3
    return 4
  }

  if (sortByPriority) {
    filtered.sort((a, b) => getPriorityWeight(a) - getPriorityWeight(b))
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
                Vulnerability Findings & AI Risk Prioritization
              </h1>
              <span className="badge-verified-subtle text-[10px] px-2 py-0.5">
                CVSS v3.1 Aligned
              </span>
            </div>
            <p className="text-[#9AA39B] text-xs mt-1">
              Static analysis scanner results prioritized by exploitability vector and microcontroller blast radius.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortByPriority(!sortByPriority)}
              className={`btn-quiet text-xs font-mono flex items-center gap-1.5 ${
                sortByPriority ? '!border-[#B7E36A] !text-[#B7E36A]' : ''
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortByPriority ? 'Prioritized by Risk (P1→P4)' : 'Standard Sort'}</span>
            </button>
          </div>
        </div>

        {/* AI Prioritization Disclaimer Notice */}
        <div className="p-3 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-between text-[11px] text-[#9AA39B]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B7E36A] shrink-0" />
            <span>
              <strong>AI Recommendation:</strong> Remediation rankings indicate automated risk scoring based on control-flow hijacking potential on bare-metal systems, not confirmed dynamic exploitability.
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#626D64] hidden md:inline shrink-0 ml-2">
            Scanner is Source of Truth
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#626D64] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by vulnerability name, CWE, file..."
              className="w-full bg-[#101310] border border-[#2B332D] rounded-md py-1.5 pl-8 pr-3 text-xs text-[#F3F5EF] placeholder-[#626D64] focus:outline-none focus:border-[#B7E36A]/50 font-mono"
            />
          </div>

          {/* Severity Segmented Filter */}
          <div className="flex items-center gap-1 bg-[#101310] p-1 rounded-md border border-[#2B332D]">
            {['ALL', 'CRITICAL', 'HIGH'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  filterSeverity === sev
                    ? 'bg-[#181D19] text-[#B7E36A] font-semibold border border-[#2B332D]'
                    : 'text-[#9AA39B] hover:text-[#F3F5EF]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Findings Table */}
        <div className="border border-[#2B332D] rounded-xl overflow-hidden bg-[#181D19]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2B332D] bg-[#101310] text-[#9AA39B] font-mono text-[11px]">
                  <th className="py-3 px-4 font-medium">Priority</th>
                  <th className="py-3 px-4 font-medium">Vulnerability & CWE</th>
                  <th className="py-3 px-4 font-medium">Severity</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Potential Impact & Root Cause</th>
                  <th className="py-3 px-4 font-medium text-right">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B332D]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#9AA39B]">
                      {vulnerabilities.length === 0
                        ? 'No vulnerabilities detected. All firmware files clean!'
                        : 'No findings matching your query.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const priorityRank = getPriorityWeight(v)
                    const priorityLabel =
                      priorityRank === 1 ? 'P1 Critical' : priorityRank === 2 ? 'P2 High' : 'P3 Medium'
                    const priorityBadgeColor =
                      priorityRank === 1
                        ? 'text-[#F07878] bg-[#F07878]/10 border-[#F07878]/30'
                        : priorityRank === 2
                        ? 'text-[#E5A854] bg-[#E5A854]/10 border-[#E5A854]/30'
                        : 'text-[#78B3E0] bg-[#78B3E0]/10 border-[#78B3E0]/30'

                    return (
                      <tr key={v.id} className="hover:bg-[#1D231E]/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold ${priorityBadgeColor}`}>
                            {priorityLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#F3F5EF]">
                            {v.vuln_type || v.vulnType}
                          </div>
                          <div className="font-mono text-[10px] text-[#9AA39B] mt-0.5">
                            {v.cwe_id || v.cweId}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              v.severity === 'Critical'
                                ? 'badge-critical-subtle'
                                : 'badge-high-subtle'
                            }
                          >
                            {v.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#9AA39B]">
                          {(v.file_path || v.filePath)}:{(v.line_start || v.lineStart)}
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="text-[#F3F5EF] text-[11px] leading-snug">
                            {v.impactAnalysis || 'Unbounded memory write exceeding target capacity.'}
                          </div>
                          <div className="text-[10px] text-[#626D64] mt-0.5 truncate">
                            {v.root_cause || v.rootCause}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onInspectVuln(v)}
                              className="btn-quiet text-xs !py-1 !px-2 font-mono"
                              title="Inspect in source editor"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => onTriggerFix(v)}
                              className="btn-lime text-xs !py-1 !px-2.5 font-semibold"
                              title="Synthesize AI fix"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>Fix</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
