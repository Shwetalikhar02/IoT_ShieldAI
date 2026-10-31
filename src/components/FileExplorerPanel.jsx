import React, { useRef, useState } from 'react'
import { FileCode, Upload, Plus, Search, ShieldCheck } from 'lucide-react'

export default function FileExplorerPanel({
  files,
  activeFileId,
  onSelectFile,
  onFileUpload,
  onNewFile,
  vulnerabilities = []
}) {
  const fileInputRef = useRef(null)
  const [search, setSearch] = useState('')

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.cwe_id && f.cwe_id.toLowerCase().includes(search.toLowerCase()))
  )

  const handleFileChange = (e) => {
    const uploaded = e.target.files
    if (uploaded && uploaded.length > 0) {
      onFileUpload(uploaded)
    }
  }

  return (
    <div className="w-56 h-full bg-[#181D19] border-r border-[#2B332D] flex flex-col select-none shrink-0 text-xs">
      {/* Search & Actions Header */}
      <div className="p-2.5 border-b border-[#2B332D] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#9AA39B] uppercase tracking-wider px-1">
          <span>Firmware Files</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded hover:bg-[#1D231E] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
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
              className="p-1 rounded hover:bg-[#1D231E] text-[#9AA39B] hover:text-[#F3F5EF] transition-colors"
              title="Create New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#626D64] absolute left-2 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firmware..."
            className="w-full bg-[#101310] border border-[#2B332D] rounded-md py-1 pl-7 pr-2 text-xs text-[#F3F5EF] placeholder-[#626D64] focus:outline-none focus:border-[#B7E36A]/40 font-mono"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filtered.map((file) => {
          const isActive = file.id === activeFileId
          const fileVulns = vulnerabilities.filter(v => v.file_path === file.name)
          const hasVuln = fileVulns.length > 0

          return (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left group ${
                isActive
                  ? 'bg-[#1D231E] text-[#F3F5EF] font-semibold border border-[#2B332D]'
                  : 'text-[#9AA39B] hover:bg-[#1D231E]/60 hover:text-[#F3F5EF]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-[#B7E36A]' : 'text-[#626D64] group-hover:text-[#9AA39B]'
                  }`}
                />
                <span className="truncate">{file.name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {hasVuln ? (
                  <span className="font-mono text-[10px] px-1 py-0.2 rounded text-[#F07878] bg-[#F07878]/10 font-bold">
                    {fileVulns.length}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7E36A]/60" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
