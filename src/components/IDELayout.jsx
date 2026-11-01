import React, { useState, useRef, useEffect } from 'react'
import {
  Shield,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileCode,
  FolderOpen,
  Folder,
  Upload,
  Plus,
  Search,
  User,
  MessageSquare,
  Settings,
  LogOut,
  LayoutDashboard,
  FolderGit2,
  Code2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Zap,
  AlertTriangle,
  Play,
  Hammer,
  Wand2,
  Eye,
  Check,
  XCircle,
  Cpu,
  Terminal,
  PanelLeftClose,
  PanelRightClose,
  FileText,
  Bug,
  Lock
} from 'lucide-react'

// ─── Hamburger Menu ─────────────────────────────────────────────────────────
function HamburgerMenu({ isOpen, onClose, onSelectView, activeView, onOpenBenchmark, onOpenCheatingDemo, onRunPipeline }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const sections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'projects', label: 'My Projects', icon: FolderGit2 },
        { id: 'explorer', label: 'Firmware Explorer', icon: Code2 },
      ]
    },
    {
      title: 'SECURITY ANALYSIS',
      items: [
        { id: 'findings', label: 'Vulnerability Findings', icon: AlertCircle },
        { id: 'repair', label: 'AI Code Review', icon: ShieldCheck },
        { id: 'assistant', label: 'AI Security Assistant', icon: Sparkles },
        { id: 'cheating_check', label: 'Cheating Guard', icon: AlertTriangle, isAction: true },
        { id: 'verify', label: 'Integrity Checks', icon: Shield },
      ]
    },
    {
      title: 'VALIDATION & REPORTS',
      items: [
        { id: 'verify', label: 'Verification Console', icon: CheckCircle2 },
        { id: 'benchmark', label: 'Benchmark Suite', icon: BarChart3, isAction: true },
        { id: 'pipeline', label: 'Full Pipeline', icon: Zap, isAction: true },
        { id: 'reports', label: 'Security Health Report', icon: FileText },
      ]
    }
  ]

  const handleClick = (item) => {
    if (item.id === 'benchmark') {
      onOpenBenchmark?.()
    } else if (item.id === 'cheating_check') {
      onOpenCheatingDemo?.()
    } else if (item.id === 'pipeline') {
      onRunPipeline?.()
    } else {
      onSelectView(item.id)
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-72 bg-[#101310] border-r border-[#2B332D] z-[101] flex flex-col transform transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-[#2B332D]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B7E36A]" />
            <span className="font-bold text-sm text-[#F3F5EF]">CodeShield AI</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {sections.map((sec, i) => (
            <div key={i} className="space-y-1">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-[#626D64] mb-1.5">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id && !item.isAction
                return (
                  <button
                    key={`${sec.title}-${item.id}`}
                    onClick={() => handleClick(item)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#181D19] text-[#F3F5EF] border border-[#2B332D]'
                        : 'text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#181D19]/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#B7E36A]' : 'text-[#626D64]'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}

// ─── Left Sidebar: File Explorer + Account ──────────────────────────────────
function LeftSidebar({
  files,
  activeFileId,
  onSelectFile,
  onFileUpload,
  onNewFile,
  vulnerabilities,
  activeProject,
  currentUser,
  onSelectView,
  onLogout,
  isCollapsed,
  onToggle
}) {
  const fileInputRef = useRef(null)
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState({ firmware: true, custom: true })

  if (isCollapsed) {
    return (
      <div className="w-10 h-full bg-[#101310] border-r border-[#2B332D] flex flex-col items-center py-3 shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
          title="Expand explorer"
        >
          <PanelLeftClose className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    )
  }

  const handleFileChange = (e) => {
    const uploaded = e.target.files
    if (uploaded && uploaded.length > 0) onFileUpload(uploaded)
  }

  // Group files by category
  const firmwareFiles = files.filter(f => f.category !== 'custom')
  const customFiles = files.filter(f => f.category === 'custom')
  const filtered = (arr) => arr.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleFolder = (name) => {
    setExpandedFolders(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const getFileIcon = (filename) => {
    if (filename.endsWith('.h')) return <FileText className="w-3.5 h-3.5 shrink-0 text-[#78B3E0]" />
    if (filename.endsWith('.c') || filename.endsWith('.cpp')) return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#B7E36A]" />
    return <FileCode className="w-3.5 h-3.5 shrink-0 text-[#626D64]" />
  }

  const renderFileItem = (file) => {
    const isActive = file.id === activeFileId
    const fileVulns = vulnerabilities.filter(v => (v.file_path || v.filePath) === file.name)
    const hasVuln = fileVulns.length > 0

    return (
      <button
        key={file.id}
        onClick={() => onSelectFile(file.id)}
        className={`w-full flex items-center justify-between pl-6 pr-2 py-[5px] text-xs font-mono transition-colors text-left group ${
          isActive
            ? 'bg-[#1D231E] text-[#F3F5EF] font-medium'
            : 'text-[#9AA39B] hover:bg-[#181D19]/60 hover:text-[#F3F5EF]'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {getFileIcon(file.name)}
          <span className="truncate">{file.name}</span>
        </div>
        {hasVuln && (
          <span className="font-mono text-[9px] px-1 rounded text-[#F07878] bg-[#F07878]/10 font-bold shrink-0">
            {fileVulns.length}
          </span>
        )}
      </button>
    )
  }

  const renderFolder = (name, label, fileList) => {
    if (fileList.length === 0) return null
    const isExpanded = expandedFolders[name] !== false
    return (
      <div key={name}>
        <button
          onClick={() => toggleFolder(name)}
          className="w-full flex items-center gap-1.5 px-2 py-[5px] text-[11px] font-medium text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
        >
          {isExpanded
            ? <ChevronDown className="w-3 h-3 shrink-0 text-[#626D64]" />
            : <ChevronRight className="w-3 h-3 shrink-0 text-[#626D64]" />
          }
          {isExpanded
            ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#E5A854]" />
            : <Folder className="w-3.5 h-3.5 shrink-0 text-[#E5A854]" />
          }
          <span>{label}</span>
          <span className="text-[10px] text-[#626D64] font-mono ml-auto">{fileList.length}</span>
        </button>
        {isExpanded && (
          <div className="space-y-px">
            {filtered(fileList).map(renderFileItem)}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="w-56 h-full bg-[#101310] border-r border-[#2B332D] flex flex-col select-none shrink-0">
      {/* Explorer Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#2B332D]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#626D64]">Explorer</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
            title="Upload file"
          >
            <Upload className="w-3 h-3" />
          </button>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} multiple accept=".c,.cpp,.h,.txt" className="hidden" />
          <button
            onClick={onNewFile}
            className="p-1 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
            title="New file"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Project Name */}
      {activeProject && (
        <div className="px-3 py-1.5 border-b border-[#2B332D] bg-[#181D19]/30">
          <div className="flex items-center gap-1.5 text-[11px]">
            <FolderGit2 className="w-3 h-3 text-[#B7E36A] shrink-0" />
            <span className="text-[#F3F5EF] font-semibold truncate text-[11px]">{activeProject.name}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-[#2B332D]">
        <div className="relative">
          <Search className="w-3 h-3 text-[#626D64] absolute left-2 top-[6px]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-[#181D19] border border-[#2B332D] rounded py-1 pl-6 pr-2 text-[11px] text-[#F3F5EF] placeholder-[#626D64] focus:outline-none focus:border-[#B7E36A]/40 font-mono"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1 space-y-px">
        {renderFolder('firmware', 'firmware_samples', firmwareFiles)}
        {renderFolder('custom', 'custom_uploads', customFiles)}
        {/* If no folders, show flat list */}
        {firmwareFiles.length === 0 && customFiles.length === 0 && (
          <div className="px-3 py-4 text-center text-[11px] text-[#626D64]">
            No files in project
          </div>
        )}
      </div>

      {/* Bottom Account Section */}
      <div className="border-t border-[#2B332D] bg-[#101310]">
        <button
          onClick={() => onSelectView('profile')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#181D19]/60 transition-colors"
        >
          <User className="w-3.5 h-3.5 text-[#626D64]" />
          <span className="truncate">{currentUser?.name || 'Profile'}</span>
        </button>
        <button
          onClick={() => onSelectView('reviews')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#181D19]/60 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#626D64]" />
          <span>Reviews & Feedback</span>
        </button>
        <button
          onClick={() => onSelectView('settings')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#181D19]/60 transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-[#626D64]" />
          <span>Settings</span>
        </button>

        {/* User mini card */}
        <div className="px-2 py-2 border-t border-[#2B332D]">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#1D231E] border border-[#2B332D] flex items-center justify-center text-[10px] font-mono text-[#B7E36A] font-bold shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] font-medium text-[#F3F5EF] truncate">{currentUser?.name || 'User'}</div>
                <div className="text-[9px] text-[#626D64] truncate font-mono">{currentUser?.email || ''}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1 rounded text-[#9AA39B] hover:text-[#F07878] transition-colors"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── Welcome Page ────────────────────────────────────────────────────────────
function WelcomePage() {
  const features = [
    { icon: AlertCircle, name: 'Vulnerability Detection', desc: 'Identify potential security weaknesses in firmware.' },
    { icon: ShieldCheck, name: 'AI Code Review', desc: 'Understand code quality and security concerns.' },
    { icon: Wand2, name: 'Secure Code Repair', desc: 'Generate context-aware secure code corrections.' },
    { icon: CheckCircle2, name: 'Verification Engine', desc: 'Validate proposed corrections through available checks.' },
    { icon: Shield, name: 'Integrity Checks', desc: 'Detect suspicious or incomplete code modifications.' },
    { icon: BarChart3, name: 'Benchmark Suite', desc: 'Evaluate security analysis performance.' },
    { icon: Sparkles, name: 'AI Security Assistant', desc: 'Get contextual assistance for firmware security.' },
    { icon: Cpu, name: 'Resource Analysis', desc: 'Examine embedded-system resource impact.' },
  ]

  return (
    <div className="flex-1 h-full flex items-center justify-center bg-[#101310] overflow-y-auto">
      <div className="max-w-lg w-full px-6 py-12 space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#181D19] border border-[#2B332D] flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-[#B7E36A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F3F5EF] tracking-tight">
            Welcome to CodeShield AI
          </h1>
          <p className="text-sm text-[#9AA39B] leading-relaxed max-w-md mx-auto">
            AI-powered firmware security analysis and secure code remediation for C/C++ IoT applications.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-1">
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#181D19]/40 transition-colors">
                <div className="w-7 h-7 rounded-md bg-[#181D19] border border-[#2B332D] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#B7E36A]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F3F5EF]">{feat.name}</div>
                  <div className="text-xs text-[#9AA39B]">{feat.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-[11px] text-[#626D64] font-mono">
            Select a file from the explorer to begin editing
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Right Sidebar: Actions & Fixes ─────────────────────────────────────────
function RightSidebar({
  activeFile,
  vulnerabilities,
  activeVuln,
  candidatePatch,
  verificationResult,
  metrics,
  isVerifying,
  pipelineRunning,
  onRunScan,
  onRunVerify,
  onTriggerQuickFix,
  onAcceptPatch,
  onRejectPatch,
  onToggleDiffMode,
  isDiffMode,
  onInspectVuln,
  isCollapsed,
  onToggle,
  projectId
}) {
  const [activeSection, setActiveSection] = useState('actions') // 'actions' | 'findings'

  if (isCollapsed) {
    return (
      <div className="w-10 h-full bg-[#101310] border-l border-[#2B332D] flex flex-col items-center py-3 shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
          title="Expand panel"
        >
          <PanelRightClose className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    )
  }

  const currentVuln = activeVuln || vulnerabilities[0]
  const unresolvedVulns = vulnerabilities.filter(v => v.status !== 'resolved')

  const checks = [
    { id: 'compile', title: 'GCC Compiler', passed: verificationResult?.compiles ?? null },
    { id: 'asan', title: 'ASan Check', passed: verificationResult?.sanitizer_passed ?? verificationResult?.sanitizerPassed ?? null },
    { id: 'nocheat', title: 'No-Cheat Guard', passed: verificationResult?.no_cheating_passed ?? verificationResult?.noCheatingPassed ?? null },
    { id: 'equiv', title: 'Equivalence', passed: verificationResult?.equivalence_passed ?? verificationResult?.equivalencePassed ?? null },
  ]

  return (
    <aside className="w-72 h-full bg-[#101310] border-l border-[#2B332D] flex flex-col select-none shrink-0 text-xs overflow-hidden">
      {/* Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#2B332D]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSection('actions')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
              activeSection === 'actions'
                ? 'bg-[#181D19] text-[#B7E36A] border border-[#2B332D]'
                : 'text-[#9AA39B] hover:text-[#F3F5EF]'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveSection('findings')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              activeSection === 'findings'
                ? 'bg-[#181D19] text-[#B7E36A] border border-[#2B332D]'
                : 'text-[#9AA39B] hover:text-[#F3F5EF]'
            }`}
          >
            Findings
            {unresolvedVulns.length > 0 && (
              <span className="text-[9px] font-mono text-[#F07878] bg-[#F07878]/10 px-1 rounded font-bold">
                {unresolvedVulns.length}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
          title="Collapse panel"
        >
          <PanelRightClose className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeSection === 'actions' ? (
          <>
            {/* ── RUN ────────────────────────── */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#626D64] px-1">Run</div>
              <button
                onClick={onRunScan}
                disabled={pipelineRunning}
                className="w-full btn-lime text-xs font-semibold py-2 flex items-center justify-center gap-2"
              >
                {pipelineRunning ? (
                  <>
                    <span className="cs-spinner" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Security Scan</span>
                  </>
                )}
              </button>
              {/* Status indicator */}
              <div className="flex items-center gap-1.5 px-1 text-[11px] font-mono text-[#9AA39B]">
                <span className={`w-1.5 h-1.5 rounded-full ${unresolvedVulns.length > 0 ? 'bg-[#E5A854]' : 'bg-[#B7E36A]'}`} />
                <span>{unresolvedVulns.length > 0 ? `${unresolvedVulns.length} findings` : 'Clean'}</span>
              </div>
            </div>

            {/* ── COMPILE ───────────────────── */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#626D64] px-1">Compile</div>
              <button
                onClick={onRunVerify}
                disabled={isVerifying}
                className="w-full btn-quiet text-xs font-medium py-2 flex items-center justify-center gap-2"
              >
                <Hammer className="w-3.5 h-3.5 text-[#9AA39B]" />
                <span>{isVerifying ? 'Compiling...' : 'Compile & Verify'}</span>
              </button>
              {/* Verification Checklist */}
              <div className="space-y-1">
                {checks.map(chk => (
                  <div key={chk.id} className="flex items-center justify-between px-2 py-1 rounded bg-[#181D19] border border-[#2B332D]">
                    <span className="text-[11px] text-[#F3F5EF]">{chk.title}</span>
                    {chk.passed === null ? (
                      <span className="text-[9px] font-mono text-[#626D64]">—</span>
                    ) : chk.passed ? (
                      <span className="text-[9px] font-mono text-[#B7E36A] font-bold">✓</span>
                    ) : (
                      <span className="text-[9px] font-mono text-[#F07878] font-bold">✗</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SUGGEST FIXES ─────────────── */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#626D64] px-1">Suggest Fixes</div>
              {unresolvedVulns.length > 0 ? (
                <button
                  onClick={() => onTriggerQuickFix(unresolvedVulns[0])}
                  className="w-full btn-quiet text-xs font-medium py-2 flex items-center justify-center gap-2 border-[#B7E36A]/30 hover:border-[#B7E36A]/60"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#B7E36A]" />
                  <span>AI Suggest Fix ({unresolvedVulns.length})</span>
                </button>
              ) : (
                <div className="px-2 py-2 rounded bg-[#181D19] border border-[#2B332D] text-center text-[#626D64] text-[11px]">
                  No vulnerabilities to fix
                </div>
              )}
            </div>

            {/* ── ACTIVE FIX CANDIDATE ──────── */}
            {candidatePatch && (
              <div className="space-y-2 p-2.5 rounded-lg bg-[#181D19] border border-[#B7E36A]/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7E36A]" />
                  <span className="text-[11px] font-semibold text-[#F3F5EF]">Patch Candidate</span>
                </div>
                <p className="text-[11px] text-[#9AA39B] leading-relaxed line-clamp-3">
                  {candidatePatch.explanation}
                </p>
                <div className="text-[10px] font-mono text-[#626D64] px-1.5 py-0.5 rounded bg-[#101310] border border-[#2B332D] inline-block">
                  {candidatePatch.strategy === 'template' ? 'Rule-based' : 'AI LLM'}
                </div>

                {/* Three Actions: Review, Apply, Dismiss */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={onToggleDiffMode}
                    className="btn-quiet text-[10px] !py-1.5 !px-1 flex flex-col items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3 text-[#78B3E0]" />
                    <span>Review</span>
                  </button>
                  <button
                    onClick={onAcceptPatch}
                    className="btn-lime text-[10px] !py-1.5 !px-1 flex flex-col items-center gap-0.5"
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={onRejectPatch}
                    className="btn-quiet text-[10px] !py-1.5 !px-1 flex flex-col items-center gap-0.5 text-[#F07878] hover:text-[#F07878]"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── RESOURCE TELEMETRY ──────────── */}
            {metrics && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#626D64] px-1">Resources</div>
                <div className="grid grid-cols-3 gap-1.5 font-mono">
                  <div className="p-1.5 rounded bg-[#181D19] border border-[#2B332D] text-center">
                    <div className="text-[9px] text-[#626D64]">Flash</div>
                    <div className="text-[11px] font-semibold text-[#F3F5EF]">+{metrics.binary_size_delta_bytes}B</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#181D19] border border-[#2B332D] text-center">
                    <div className="text-[9px] text-[#626D64]">SRAM</div>
                    <div className="text-[11px] font-semibold text-[#B7E36A]">{metrics.estimated_stack_delta_bytes}B</div>
                  </div>
                  <div className="p-1.5 rounded bg-[#181D19] border border-[#2B332D] text-center">
                    <div className="text-[9px] text-[#626D64]">CC</div>
                    <div className="text-[11px] font-semibold text-[#F3F5EF]">+{metrics.cyclomatic_complexity_delta}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── FINDINGS TAB ──────────────── */
          <>
            {unresolvedVulns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-[#B7E36A]" />
                <div className="text-sm font-medium text-[#F3F5EF]">Firmware Clean</div>
                <p className="text-[11px] text-[#9AA39B]">No active vulnerabilities detected.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unresolvedVulns.map((vuln, i) => (
                  <button
                    key={vuln.id || i}
                    onClick={() => onInspectVuln(vuln)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all space-y-1.5 ${
                      activeVuln?.id === vuln.id
                        ? 'bg-[#1D231E] border-[#B7E36A]/40'
                        : 'bg-[#181D19] border-[#2B332D] hover:border-[#2B332D]/80'
                    }`}
                  >
                    {/* Title & Severity */}
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-[11px] text-[#F3F5EF] leading-snug">
                        {vuln.vuln_type || vuln.vulnType}
                      </span>
                      <span className={vuln.severity === 'Critical' ? 'badge-critical-subtle' : 'badge-high-subtle'}>
                        {vuln.severity}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#9AA39B]">
                      <span>{vuln.cwe_id || vuln.cweId}</span>
                      <span>·</span>
                      <span>{vuln.file_path || vuln.filePath}</span>
                      <span>·</span>
                      <span>L{vuln.line_start || vuln.lineStart}</span>
                    </div>

                    {/* Root cause */}
                    <p className="text-[10px] text-[#9AA39B] leading-relaxed line-clamp-2">
                      {vuln.root_cause || vuln.rootCause}
                    </p>

                    {/* Code snippet */}
                    <div className="px-1.5 py-1 rounded bg-[#101310] border border-[#2B332D] font-mono text-[10px] text-[#F07878] truncate">
                      {vuln.code_snippet || vuln.codeSnippet}
                    </div>

                    {/* Fix button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTriggerQuickFix(vuln)
                      }}
                      className="w-full btn-quiet text-[10px] !py-1 mt-1 flex items-center justify-center gap-1.5"
                    >
                      <Wand2 className="w-3 h-3 text-[#B7E36A]" />
                      <span>Suggest Fix</span>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Violations notice */}
      {(verificationResult?.errors?.length > 0 || verificationResult?.violations?.length > 0) && (
        <div className="mx-3 mb-3 p-2 rounded-lg bg-[#F07878]/10 border border-[#F07878]/30 space-y-0.5">
          <div className="font-semibold text-[10px] text-[#F07878]">Violations</div>
          {[...(verificationResult.errors || []), ...(verificationResult.violations || [])].slice(0, 3).map((err, i) => (
            <p key={i} className="text-[#F07878]/90 font-mono text-[9px] leading-relaxed truncate">• {err}</p>
          ))}
        </div>
      )}
    </aside>
  )
}

// ─── Main IDE Layout Export ─────────────────────────────────────────────────
export default function IDELayout({
  // Auth
  currentUser,
  onLogout,

  // Navigation
  activeView,
  onSelectView,

  // Projects
  activeProject,
  projects,
  onSelectProject,
  onCreateProject,

  // Files
  files,
  activeFileId,
  activeFile,
  onSelectFile,
  onFileUpload,
  onNewFile,

  // Editor
  currentCode,
  onChangeCode,
  candidatePatch,
  isDiffMode,
  onToggleDiffMode,
  onAcceptPatch,
  onRejectPatch,

  // Analysis
  vulnerabilities,
  activeVuln,
  onTriggerQuickFix,
  onInspectVuln,

  // Pipeline
  pipelineRunning,
  onRunScan,
  onRunPipeline,

  // Verification
  verificationResult,
  isVerifying,
  onRunVerify,

  // Metrics
  metrics,

  // Modals
  onOpenBenchmark,
  onOpenCheatingDemo,

  // Project ID
  projectId,

  // View renderers
  renderEditorView,
  renderActiveView,
}) {
  const [hamburgerOpen, setHamburgerOpen] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  // Determine if we're in the IDE editor mode or a full-page view
  const isEditorMode = activeView === 'explorer'
  const isWelcome = activeView === 'overview' && !activeFile

  return (
    <div className="flex h-screen w-screen bg-[#101310] text-[#F3F5EF] overflow-hidden font-sans">
      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={hamburgerOpen}
        onClose={() => setHamburgerOpen(false)}
        onSelectView={(view) => {
          onSelectView(view)
          setHamburgerOpen(false)
        }}
        activeView={activeView}
        onOpenBenchmark={onOpenBenchmark}
        onOpenCheatingDemo={onOpenCheatingDemo}
        onRunPipeline={onRunPipeline}
      />

      {/* Left Sidebar - always visible */}
      <LeftSidebar
        files={files}
        activeFileId={activeFileId}
        onSelectFile={(id) => {
          onSelectFile(id)
          onSelectView('explorer')
        }}
        onFileUpload={onFileUpload}
        onNewFile={() => {
          onNewFile()
          onSelectView('explorer')
        }}
        vulnerabilities={vulnerabilities}
        activeProject={activeProject}
        currentUser={currentUser}
        onSelectView={onSelectView}
        onLogout={onLogout}
        isCollapsed={leftCollapsed}
        onToggle={() => setLeftCollapsed(!leftCollapsed)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className="h-10 bg-[#101310] border-b border-[#2B332D] px-3 flex items-center justify-between select-none shrink-0 z-20">
          {/* Left: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHamburgerOpen(true)}
              className="p-1.5 rounded hover:bg-[#181D19] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#B7E36A]" />
              <span className="font-bold text-[#F3F5EF] text-xs">CodeShield AI</span>

              {activeProject && (
                <>
                  <ChevronRight className="w-3 h-3 text-[#626D64]" />
                  <span className="text-[#9AA39B] font-mono text-[11px] max-w-[120px] truncate">{activeProject.name}</span>
                </>
              )}

              {activeFile && activeView === 'explorer' && (
                <>
                  <ChevronRight className="w-3 h-3 text-[#626D64]" />
                  <span className="text-[#F3F5EF] font-mono text-[11px] font-semibold">{activeFile.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Status + Project Selector */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-[#9AA39B]">
              <span className={`w-1.5 h-1.5 rounded-full ${vulnerabilities.filter(v => v.status !== 'resolved').length > 0 ? 'bg-[#E5A854]' : 'bg-[#B7E36A]'}`} />
              <span>
                {pipelineRunning
                  ? 'Analyzing...'
                  : vulnerabilities.filter(v => v.status !== 'resolved').length > 0
                  ? `${vulnerabilities.filter(v => v.status !== 'resolved').length} findings`
                  : 'Clean'}
              </span>
            </div>

            {activeProject?.targetArch && (
              <span className="hidden lg:inline text-[10px] font-mono text-[#626D64] px-1.5 py-0.5 rounded bg-[#181D19] border border-[#2B332D]">
                {activeProject.targetArch}
              </span>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {isEditorMode ? (
            /* Editor View - occupies center */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {renderEditorView()}
            </div>
          ) : (
            /* Non-editor views occupy the full center */
            <div className="flex-1 h-full overflow-hidden">
              {renderActiveView()}
            </div>
          )}

          {/* Right Sidebar - visible in editor mode */}
          {isEditorMode && (
            <RightSidebar
              activeFile={activeFile}
              vulnerabilities={vulnerabilities}
              activeVuln={activeVuln}
              candidatePatch={candidatePatch}
              verificationResult={verificationResult}
              metrics={metrics}
              isVerifying={isVerifying}
              pipelineRunning={pipelineRunning}
              onRunScan={onRunScan}
              onRunVerify={onRunVerify}
              onTriggerQuickFix={onTriggerQuickFix}
              onAcceptPatch={onAcceptPatch}
              onRejectPatch={onRejectPatch}
              onToggleDiffMode={onToggleDiffMode}
              isDiffMode={isDiffMode}
              onInspectVuln={onInspectVuln}
              isCollapsed={rightCollapsed}
              onToggle={() => setRightCollapsed(!rightCollapsed)}
              projectId={projectId}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export { WelcomePage }
