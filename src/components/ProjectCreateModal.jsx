import React, { useState } from 'react'
import { FolderGit2, X, Cpu, ArrowRight } from 'lucide-react'

export default function ProjectCreateModal({
  isOpen,
  onClose,
  onCreate
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetArch, setTargetArch] = useState('ARM Cortex-M4')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const architectures = [
    { id: 'ARM Cortex-M4', name: 'ARM Cortex-M0/M3/M4 (Bare Metal)' },
    { id: 'ESP32 (Xtensa)', name: 'Espressif ESP32 / ESP-IDF (FreeRTOS)' },
    { id: 'RISC-V RV32', name: 'RISC-V RV32IMAC Embedded' },
    { id: 'x86_64 Generic', name: 'POSIX / Embedded Linux' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim(), description.trim(), targetArch)
      setName('')
      setDescription('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm text-xs select-none">
      <div className="w-full max-w-md bg-[#181D19] border border-[#2B332D] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#2B332D] flex items-center justify-between bg-[#1D231E]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#101310] border border-[#2B332D] flex items-center justify-center text-[#B7E36A]">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F3F5EF]">Create New Firmware Project</h3>
              <p className="text-[11px] text-[#9AA39B]">Embedded C/C++ Security Repository</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#9AA39B] hover:text-[#F3F5EF] hover:bg-[#2B332D]/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[#9AA39B] mb-1">
              Project Name <span className="text-[#F07878]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gateway Telemetry Ingest"
              className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2.5 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#9AA39B] mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this firmware module, hardware peripherals, or sensor specs..."
              rows={2}
              className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#9AA39B] mb-1">
              Target Architecture
            </label>
            <select
              value={targetArch}
              onChange={(e) => setTargetArch(e.target.value)}
              className="w-full bg-[#101310] border border-[#2B332D] rounded-lg p-2 text-xs text-[#F3F5EF] focus:outline-none focus:border-[#B7E36A]"
            >
              {architectures.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-[#626D64] mt-1 font-mono">
              Sets compiler warning flags and address width layout.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2B332D]">
            <button
              type="button"
              onClick={onClose}
              className="btn-quiet text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-lime text-xs font-semibold py-2 px-4 flex items-center gap-1.5"
            >
              {loading ? (
                <span className="cs-spinner" />
              ) : (
                <>
                  <span>Create Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
