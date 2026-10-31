/**
 * pages/UploadPage.jsx — Firmware Upload Page (Step 1)
 *
 * Responsibility:
 *   Provide a drag-and-drop / file picker UI for uploading C/C++ firmware
 *   source files.  On successful upload, store the upload_id in React state
 *   and navigate to /analyze.
 *
 * TODO:
 *   - Connect to api.uploadFirmware() from services/api.js.
 *   - Show upload progress bar using axios onUploadProgress.
 *   - Validate file extension (.c, .cpp, .h, .hpp) client-side before upload.
 *   - Display error messages from the backend (422 / 413 responses).
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UploadPage() {
  const navigate = useNavigate()
  const [dragging, setDragging] = useState(false)

  return (
    <main className="min-h-screen bg-dark-950 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl">🛡️</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-shield-400 to-cyber-400 bg-clip-text text-transparent">
              IoT ShieldAI
            </h1>
          </div>
          <p className="text-dark-300 text-lg">
            AI-powered vulnerability detection &amp; repair for IoT firmware
          </p>
        </div>

        {/* Upload card */}
        <div
          className={`card border-2 border-dashed transition-colors duration-200 cursor-pointer text-center
            ${dragging ? 'border-shield-500 bg-shield-900/20' : 'border-dark-200/20 hover:border-shield-600/50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false) /* TODO: handle drop */ }}
          onClick={() => document.getElementById('firmware-file-input').click()}
        >
          <input
            id="firmware-file-input"
            type="file"
            accept=".c,.cpp,.h,.hpp"
            multiple
            className="hidden"
            onChange={() => { /* TODO: handle file selection */ }}
          />
          <div className="py-12">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-dark-100 font-semibold text-lg mb-2">
              Drop firmware source files here
            </p>
            <p className="text-dark-300 text-sm mb-6">
              Supported: .c, .cpp, .h, .hpp — max 10 MB per file
            </p>
            <button type="button" className="btn-primary">
              Browse Files
            </button>
          </div>
        </div>

        {/* Demo shortcut */}
        <div className="mt-6 text-center">
          <p className="text-dark-400 text-sm mb-3">Or try with a demo file:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['stack_overflow.c','null_ptr_deref.c','format_string.c','use_after_free.c','integer_overflow.c'].map(name => (
              <button
                key={name}
                className="btn-secondary text-xs"
                onClick={() => { /* TODO: load demo file */ }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
