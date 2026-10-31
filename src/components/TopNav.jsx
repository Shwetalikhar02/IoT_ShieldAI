import React, { useState } from 'react'
import {
  Play,
  Zap,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  FolderGit2,
  ChevronDown,
  User,
  LogOut,
  Settings
} from 'lucide-react'

export default function TopNav({
  activeFile,
  activeProject,
  projects = [],
  onSelectProject,
  onCreateProject,
  onRunScan,
  onRunPipeline,
  onOpenBenchmark,
  onOpenCheatingDemo,
  onNavigateProfile,
  onNavigateSettings,
  onLogout,
  pipelineRunning = false,
  vulnCount = 0,
  currentUser = null
}) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    if (email) return email.slice(0, 2).toUpperCase()
    return 'CS'
  }

  return (
    <header className="h-14 bg-[#101310] border-b border-[#2B332D] px-5 flex items-center justify-between select-none shrink-0 z-20">
      {/* Left: Project & File Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#181D19] border border-[#2B332D] text-[#F3F5EF] hover:border-[#B7E36A]/40 transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#B7E36A]" />
            <span className="font-semibold text-xs max-w-[130px] truncate">
              {activeProject?.name || 'Project'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#626D64]" />
          </button>

          {showProjectDropdown && (
            <div className="absolute left-0 mt-1.5 w-60 bg-[#181D19] border border-[#2B332D] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] font-mono text-[#626D64] uppercase border-b border-[#2B332D]">
                Switch Project
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[#2B332D]/40">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id)
                      setShowProjectDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#1D231E] transition-colors ${
                      p.id === activeProject?.id ? 'text-[#B7E36A] font-semibold' : 'text-[#F3F5EF]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-[#626D64] font-mono shrink-0 ml-2">
                      {p.fileCount ?? ''}
                    </span>
                  </button>
                ))}
              </div>
              <div className="p-1.5 border-t border-[#2B332D]">
                <button
                  onClick={() => {
                    setShowProjectDropdown(false)
                    onCreateProject()
                  }}
                  className="w-full btn-lime text-xs font-medium py-1"
                >
                  + New Project
                </button>
              </div>
            </div>
          )}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[#626D64]" />

        <span className="text-[#F3F5EF] font-semibold tracking-tight font-mono">
          {activeFile?.name || 'firmware.c'}
        </span>

        <span className="text-[#626D64] font-mono text-[11px] hidden sm:inline">·</span>
        <span className="text-[#9AA39B] font-mono text-[11px] hidden sm:inline">
          {activeProject?.targetArch || 'ARM Cortex-M4'}
        </span>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#9AA39B]">
          <span className={`w-1.5 h-1.5 rounded-full ${vulnCount > 0 ? 'bg-[#E5A854]' : 'bg-[#B7E36A]'}`} />
          <span>
            {pipelineRunning
              ? 'Analyzing...'
              : vulnCount > 0
              ? `${vulnCount} findings active`
              : 'Firmware clean'}
          </span>
        </div>

        {/* Cheating Demo Button */}
        <button
          onClick={onOpenCheatingDemo}
          className="btn-quiet text-xs text-[#E5A854] hover:text-[#F3F5EF] hidden md:flex items-center gap-1.5"
          title="Verify how M3 No-Cheating check flags lazy/adversarial patches"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Cheating Guard</span>
        </button>

        {/* Benchmark Button */}
        <button
          onClick={onOpenBenchmark}
          className="btn-quiet text-xs hidden md:flex items-center gap-1.5"
          title="Run automated benchmark suite on all firmware test vectors"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#9AA39B]" />
          <span>Benchmark Suite</span>
        </button>

        {/* Scan (M1) */}
        <button
          onClick={onRunScan}
          disabled={pipelineRunning}
          className="btn-quiet text-xs flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 text-[#9AA39B]" />
          <span>Scan Code</span>
        </button>

        {/* Run Full Pipeline */}
        <button
          onClick={onRunPipeline}
          disabled={pipelineRunning}
          className="btn-lime text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          {pipelineRunning ? (
            <>
              <div className="cs-spinner" />
              <span>Remediating...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Full Pipeline</span>
            </>
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-8 h-8 rounded-full bg-[#181D19] border border-[#2B332D] flex items-center justify-center text-[11px] font-mono font-semibold text-[#F3F5EF] hover:border-[#B7E36A]/50 transition-colors"
            title={currentUser?.email || 'User'}
          >
            {getInitials(currentUser?.name, currentUser?.email)}
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-[#181D19] border border-[#2B332D] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-[#2B332D]">
                <div className="font-semibold text-[#F3F5EF] truncate">
                  {currentUser?.name || 'Engineer'}
                </div>
                <div className="text-[10px] text-[#626D64] font-mono truncate">
                  {currentUser?.email || ''}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false)
                    onNavigateProfile()
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#1D231E] flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false)
                    onNavigateSettings()
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#1D231E] flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Platform Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#2B332D]">
                <button
                  onClick={() => {
                    setShowUserDropdown(false)
                    onLogout()
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#F07878] hover:bg-[#1D231E] flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
