import React, { useState } from 'react'
import {
  AlertTriangle,
  Search,
  Filter,
  Wand2,
  Code2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export default function FindingsView({
  vulnerabilities = [],
  onInspectVuln,
  onTriggerFix
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = vulnerabilities.filter(v => {
    const matchesSev = filterSeverity === 'ALL' || v.severity.toUpperCase() === filterSeverity
    const matchesQuery =
      v.vuln_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cwe_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.file_path.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSev && matchesQuery
  })

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Vulnerability Findings
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Static analysis and CWE-aligned security findings requiring functional remediation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#9AA39B]">
              Total: <strong className="text-[#F3F5EF]">{vulnerabilities.length}</strong> findings
            </span>
          </div>
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
        <div className="border border-[#2B332D] rounded-lg overflow-hidden bg-[#181D19]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2B332D] bg-[#101310] text-[#9AA39B] font-mono text-[11px]">
                  <th className="py-3 px-4 font-medium">Vulnerability</th>
                  <th className="py-3 px-4 font-medium">CWE</th>
                  <th className="py-3 px-4 font-medium">Severity</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Root Cause</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
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
                  filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-[#1D231E]/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#F3F5EF]">
                        {v.vuln_type}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#9AA39B]">
                        {v.cwe_id}
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
                        {v.file_path}:{v.line_start}
                      </td>
                      <td className="py-3 px-4 text-[#9AA39B] max-w-xs truncate">
                        {v.root_cause}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
