import React, { useRef } from 'react'
import { Folder, FileCode, Upload, Plus, AlertCircle, CheckCircle, Flame, ShieldAlert } from 'lucide-react'

export default function FileTree({
  files,
  activeFileId,
  onSelectFile,
  onFileUpload,
  onNewFile,
  vulnerabilities = [],
  onSelectVuln
}) {
  const fileInputRef = useRef(null)

  const demoFiles = files.filter(f => f.category === 'demo')
  const julietFiles = files.filter(f => f.category === 'juliet')
  const customFiles = files.filter(f => f.category === 'custom')

  const handleFileChange = (e) => {
    const uploaded = e.target.files
    if (uploaded && uploaded.length > 0) {
      onFileUpload(uploaded)
    }
  }

  const renderFileItem = (file) => {
    const isActive = file.id === activeFileId
    const fileVulns = vulnerabilities.filter(v => v.file_path === file.name)
    const hasVuln = fileVulns.length > 0

    return (
      <button
        key={file.id}
        onClick={() => onSelectFile(file.id)}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono transition-all text-left group ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
          <span className="truncate">{file.name}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {file.cwe_id && (
            <span className="text-[10px] text-slate-500 font-mono hidden xl:inline">
              {file.cwe_id}
            </span>
          )}
          {hasVuln ? (
            <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 text-[10px] flex items-center justify-center font-bold border border-red-500/30">
              {fileVulns.length}
            </span>
          ) : (
            <CheckCircle className="w-3 h-3 text-emerald-500/60" />
          )}
        </div>
      </button>
    )
  }

  return (
    <aside className="w-64 border-r border-white/10 bg-[#020617]/90 flex flex-col h-full select-none shrink-0">
      {/* File Explorer Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Folder className="w-4 h-4 text-sky-400" />
          <span>Firmware Explorer</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Upload C/C++ Firmware (.c, .cpp, .h)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".c,.cpp,.h,.txt"
            className="hidden"
          />

          <button
            onClick={onNewFile}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Create New C Firmware File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
        {/* Canonical Hackathon Demo Samples */}
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Problem 15 Demo Set (5)</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {demoFiles.map(renderFileItem)}
          </div>
        </div>

        {/* Juliet / Extended Suite */}
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-purple-400" />
            <span>Juliet & CVE Benchmarks</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {julietFiles.map(renderFileItem)}
          </div>
        </div>

        {/* Custom Uploaded Files */}
        {customFiles.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Folder className="w-3 h-3 text-sky-400" />
              <span>Custom Uploads</span>
            </div>
            <div className="space-y-0.5 mt-1">
              {customFiles.map(renderFileItem)}
            </div>
          </div>
        )}
      </div>

      {/* Active Findings Panel in Sidebar */}
      <div className="border-t border-white/10 p-2 max-h-56 flex flex-col">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>Findings ({vulnerabilities.length})</span>
          </span>
          {vulnerabilities.length > 0 && (
            <span className="text-[10px] text-red-400 font-mono">
              Click to jump
            </span>
          )}
        </div>

        <div className="overflow-y-auto space-y-1 flex-1 pr-1">
          {vulnerabilities.length === 0 ? (
            <div className="p-3 text-center text-slate-500 text-xs italic">
              No vulnerabilities detected in this file.
            </div>
          ) : (
            vulnerabilities.map((v, i) => (
              <button
                key={v.id || i}
                onClick={() => onSelectVuln(v)}
                className="w-full text-left p-2 rounded-lg bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-xs transition-colors group"
              >
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-bold text-red-300 truncate">{v.vuln_type}</span>
                  <span className="font-mono text-red-400 font-bold ml-1">L{v.line_start}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {v.cwe_id}: {v.root_cause}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
