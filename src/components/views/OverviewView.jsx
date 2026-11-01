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
  FolderGit2,
  Plus,
  Play,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react'

export default function OverviewView({
  currentUser,
  projects = [],
  activeProject = null,
  files = [],
  vulnerabilities = [],
  patches = [],
  verifications = [],
  metrics = null,
  onNavigateToExplorer,
  onNavigateToProjects,
  onSelectProject,
  onCreateProject,
  onRunScan,
  onRunPipeline
}) {
  const totalProjects = projects.length
  const totalFiles = files.length
  const activeVulns = vulnerabilities.filter(v => v.status !== 'resolved')
  const criticalVulns = activeVulns.filter(v => v.severity === 'Critical').length
  const highVulns = activeVulns.filter(v => v.severity === 'High').length
  const mediumVulns = activeVulns.filter(v => v.severity === 'Medium').length
  const lowVulns = activeVulns.filter(v => v.severity === 'Low').length
  const passedVerifications = verifications.filter(v => (v.overall_status || v.overallStatus) === 'passed').length

  // CWE breakdown for active project
  const cweMap = {}
  activeVulns.forEach(v => {
    const cwe = v.cwe_id || v.cweId || 'Other'
    cweMap[cwe] = (cweMap[cwe] || 0) + 1
  })

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2B332D]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-[#F3F5EF] tracking-tight">
                Welcome back, {currentUser?.name || 'Engineer'}
              </h1>
              <span className="badge-verified-subtle text-[10px] px-1.5 py-0.2">
                Secured
              </span>
            </div>
            <p className="text-[#9AA39B] text-xs mt-1">
              Active Project: <strong className="text-[#F3F5EF]">{activeProject?.name || 'No project selected'}</strong> · Target: <span className="font-mono">{activeProject?.targetArch || 'ARM Cortex-M4'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateProject}
              className="btn-quiet text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
            <button
              onClick={onRunScan}
              className="btn-lime text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Security Scan</span>
            </button>
          </div>
        </div>

        {/* 6 Core Developer KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Projects</div>
            <div className="text-2xl font-bold text-[#F3F5EF] mt-1">{totalProjects}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Active repos</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Scanned Files</div>
            <div className="text-2xl font-bold text-[#F3F5EF] mt-1">{totalFiles}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">C/C++ units</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Critical</div>
            <div className="text-2xl font-bold text-[#F07878] mt-1">{criticalVulns}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">CVSS 9.0 - 10.0</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">High / Med</div>
            <div className="text-2xl font-bold text-[#E5A854] mt-1">{highVulns + mediumVulns}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Prioritized</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Patches</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{patches.length}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">Synthesized</div>
          </div>

          <div className="p-4 rounded-xl bg-[#181D19] border border-[#2B332D]">
            <div className="text-[10px] text-[#9AA39B] uppercase font-sans font-medium">Verified Fixes</div>
            <div className="text-2xl font-bold text-[#B7E36A] mt-1">{passedVerifications}</div>
            <div className="text-[10px] text-[#626D64] mt-0.5 font-sans">ASan clean</div>
          </div>
        </div>

        {/* Two Column Grid: Recent Projects + CWE Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recent Projects List */}
          <div className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#F3F5EF] flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#B7E36A]" />
                <span>Recent Projects</span>
              </h3>
              <button
                onClick={onNavigateToProjects}
                className="text-xs text-[#B7E36A] hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="py-8 text-center text-[#9AA39B] space-y-2">
                <p>You haven't created any firmware projects yet.</p>
                <button onClick={onCreateProject} className="btn-lime text-xs">
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#2B332D]">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className={`py-2.5 flex items-center justify-between cursor-pointer group transition-colors ${
                      p.id === activeProject?.id ? 'text-[#B7E36A]' : 'hover:text-[#F3F5EF]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#F3F5EF] group-hover:text-[#B7E36A] transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[#626D64] font-mono mt-0.5">
                        {p.targetArch || 'ARM Cortex-M4'} · {p.fileCount ?? 0} files
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.id === activeProject?.id && (
                        <span className="badge-verified-subtle text-[10px]">Active</span>
                      )}
                      <ArrowRight className="w-3 h-3 text-[#626D64] group-hover:text-[#F3F5EF] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vulnerability Distribution / Taxonomy */}
          <div className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#F3F5EF] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#F07878]" />
                <span>Active Vulnerability Taxonomy</span>
              </h3>
              <span className="text-[10px] font-mono text-[#9AA39B]">
                {Object.keys(cweMap).length} CWE classes
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {Object.keys(cweMap).length === 0 ? (
                <div className="py-8 text-center text-[#9AA39B]">
                  No active vulnerabilities in current project. All modules verified clean!
                </div>
              ) : (
                Object.entries(cweMap).map(([cwe, count]) => {
                  const pct = Math.round((count / (activeVulns.length || 1)) * 100) || 0
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
        </div>

        {/* Quick Access to Active Project Files */}
        <div className="p-5 rounded-xl bg-[#181D19] border border-[#2B332D] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#F3F5EF] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#B7E36A]" />
              <span>Project Source Files ({files.length})</span>
            </h3>
            <button
              onClick={onNavigateToExplorer}
              className="text-[#B7E36A] hover:underline text-xs flex items-center gap-1 font-medium"
            >
              <span>Open in C Editor</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#2B332D]">
            {files.length === 0 ? (
              <div className="py-6 text-center text-[#9AA39B]">No source files uploaded to this project.</div>
            ) : (
              files.slice(0, 5).map((f) => {
                const fileVulns = vulnerabilities.filter(v => (v.file_path || v.filePath) === f.name && v.status !== 'resolved')
                return (
                  <div key={f.id} className="py-2.5 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-[#B7E36A]" />
                      <span className="text-[#F3F5EF] font-medium">{f.name}</span>
                      <span className="text-[#626D64] text-[10px]">({f.category || 'firmware'})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {fileVulns.length > 0 ? (
                        <span className="text-[#F07878] text-[11px] font-semibold">
                          {fileVulns.length} vulnerabilities
                        </span>
                      ) : (
                        <span className="text-[#B7E36A] text-[11px] flex items-center gap-1 font-semibold">
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
