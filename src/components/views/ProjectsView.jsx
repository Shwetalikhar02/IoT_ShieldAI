import React, { useState } from 'react'
import {
  FolderGit2,
  Plus,
  Trash2,
  Edit2,
  Cpu,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FileCode,
  Search
} from 'lucide-react'

export default function ProjectsView({
  projects = [],
  activeProjectId = null,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.targetArch || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartEdit = (p) => {
    setEditingId(p.id)
    setEditName(p.name)
    setEditDesc(p.description || '')
  }

  const handleSaveEdit = (p) => {
    if (!editName.trim()) return
    onUpdateProject(p.id, { name: editName.trim(), description: editDesc.trim() })
    setEditingId(null)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Firmware Projects
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Manage your embedded firmware repositories, security audit history, and verified patches.
            </p>
          </div>

          <button
            onClick={onCreateProject}
            className="btn-lime text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Firmware Project</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 rounded-lg bg-[#181D19] border border-[#2B332D] flex items-center gap-3">
          <Search className="w-3.5 h-3.5 text-[#626D64]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, description, or target MCU..."
            className="flex-1 bg-transparent text-xs text-[#F3F5EF] placeholder-[#626D64] focus:outline-none font-mono"
          />
          <span className="text-[11px] font-mono text-[#9AA39B]">
            {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {/* Project Cards List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#181D19] border border-[#2B332D] text-center space-y-3">
              <FolderGit2 className="w-10 h-10 text-[#626D64] mx-auto" />
              <h3 className="font-bold text-sm text-[#F3F5EF]">
                {projects.length === 0 ? 'No Firmware Projects Found' : 'No matching projects found'}
              </h3>
              <p className="text-xs text-[#9AA39B] max-w-sm mx-auto">
                {projects.length === 0
                  ? 'Create your first firmware security project to upload source files and detect CWE vulnerabilities.'
                  : 'Try adjusting your search query.'}
              </p>
              {projects.length === 0 && (
                <button
                  onClick={onCreateProject}
                  className="btn-lime text-xs font-semibold !py-2 !px-4"
                >
                  Create Project
                </button>
              )}
            </div>
          ) : (
            filtered.map((proj) => {
              const isActive = proj.id === activeProjectId
              const isEditing = proj.id === editingId

              return (
                <div
                  key={proj.id}
                  className={`p-5 rounded-xl border transition-all space-y-3 ${
                    isActive
                      ? 'bg-[#181D19] border-[#B7E36A]/50 shadow-md shadow-[#B7E36A]/5'
                      : 'bg-[#181D19] border-[#2B332D] hover:border-[#2B332D]/90'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-[#9AA39B] uppercase font-mono">Project Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#101310] border border-[#2B332D] rounded p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A] mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#9AA39B] uppercase font-mono">Description</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full bg-[#101310] border border-[#2B332D] rounded p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A] mt-1"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-quiet text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(proj)}
                          className="btn-lime text-xs font-semibold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-bold text-base text-[#F3F5EF]">{proj.name}</h3>
                            {isActive && (
                              <span className="badge-verified-subtle text-[10px] px-1.5 py-0.2">
                                Active Workspace
                              </span>
                            )}
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#101310] text-[#9AA39B] border border-[#2B332D]">
                              {proj.targetArch || 'ARM Cortex-M4'}
                            </span>
                          </div>
                          <p className="text-xs text-[#9AA39B] leading-relaxed line-clamp-2">
                            {proj.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStartEdit(proj)}
                            title="Edit project details"
                            className="p-1.5 rounded text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#1D231E]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(proj.id)}
                            title="Delete project"
                            className="p-1.5 rounded text-[#9AA39B] hover:text-[#F07878] hover:bg-[#1D231E]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Project Metrics Summary Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2B332D] text-xs">
                        <div className="flex items-center gap-4 text-[11px] font-mono text-[#9AA39B]">
                          <span className="flex items-center gap-1">
                            <FileCode className="w-3.5 h-3.5 text-[#B7E36A]" />
                            {proj.fileCount ?? 0} files
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-[#F07878]" />
                            {proj.vulnerabilityCount ?? 0} open vulns
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B7E36A]" />
                            {proj.verifiedCount ?? 0} verified fixes
                          </span>
                          <span className="flex items-center gap-1 text-[#626D64]">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => onSelectProject(proj.id)}
                          className={`btn-lime text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5 ${
                            isActive ? '!bg-[#1D231E] !text-[#B7E36A] !border-[#B7E36A]' : ''
                          }`}
                        >
                          <span>{isActive ? 'Workspace Active' : 'Open Project'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#181D19] border border-[#2B332D] rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-[#F07878]">Delete Firmware Project?</h3>
            <p className="text-xs text-[#9AA39B] leading-relaxed">
              This action cannot be undone. All source files, vulnerability scan history, and patches associated with this project will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-quiet text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject(confirmDeleteId)
                  setConfirmDeleteId(null)
                }}
                className="btn-lime text-xs font-semibold !bg-[#F07878] !text-white hover:!bg-[#F07878]/90"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
