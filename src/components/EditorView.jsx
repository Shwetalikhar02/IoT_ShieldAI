import React, { useRef, useEffect, useState } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { Wand2, Check, X, GitCompare, Code2, AlertTriangle, Eye, RefreshCw } from 'lucide-react'

export default function EditorView({
  code,
  onChangeCode,
  activeFile,
  vulnerabilities = [],
  activeVuln = null,
  candidatePatch = null,
  onAcceptPatch,
  onRejectPatch,
  onTriggerQuickFix,
  isDiffMode = false,
  onToggleDiffMode
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  // Configure Monaco options and markers
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Set markers for vulnerabilities
    updateMonacoMarkers(editor, monaco, vulnerabilities)
  }

  // Update markers whenever vulnerabilities change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      updateMonacoMarkers(editorRef.current, monacoRef.current, vulnerabilities)
    }
  }, [vulnerabilities])

  // Scroll to active vulnerability line
  useEffect(() => {
    if (editorRef.current && activeVuln) {
      editorRef.current.revealLineInCenter(activeVuln.line_start)
      editorRef.current.setPosition({ lineNumber: activeVuln.line_start, column: 1 })
      editorRef.current.focus()
    }
  }, [activeVuln])

  const updateMonacoMarkers = (editor, monaco, vulns) => {
    const model = editor.getModel()
    if (!model) return

    const markers = vulns.map(v => ({
      startLineNumber: v.line_start,
      startColumn: 1,
      endLineNumber: v.line_end,
      endColumn: 100,
      message: `[${v.cwe_id}] ${v.vuln_type}\nRoot Cause: ${v.root_cause}\nFix: ${v.fix_advice}`,
      severity: monaco.MarkerSeverity.Error,
    }))

    monaco.editor.setModelMarkers(model, 'shieldai-analyzer', markers)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0f1d] overflow-hidden relative">
      {/* Editor Sub-Header / Breadcrumb */}
      <div className="h-10 border-b border-white/10 bg-[#020617]/80 px-4 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-slate-300 font-semibold">{activeFile?.name || 'firmware.c'}</span>
          <span className="text-slate-600 font-mono">|</span>
          <span className="text-[11px] text-slate-400 font-mono">C99 / IoT MCU Target</span>
        </div>

        <div className="flex items-center gap-2">
          {candidatePatch && (
            <button
              onClick={onToggleDiffMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                isDiffMode
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Side-by-Side Diff Comparison"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isDiffMode ? 'Exit Diff View' : 'Compare Patch Diff'}</span>
            </button>
          )}

          {vulnerabilities.length > 0 && !candidatePatch && (
            <button
              onClick={() => onTriggerQuickFix(vulnerabilities[0])}
              className="btn-primary !py-1 !px-2.5 text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Fix with AI ({vulnerabilities.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline AI Candidate Patch Banner */}
      {candidatePatch && (
        <div className="p-3 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between text-xs animate-slide-up z-20">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white">Candidate Remediation Synthesized</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  candidatePatch.strategy === 'template'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {candidatePatch.strategy === 'template' ? '📋 Deterministic Template' : '🤖 DeepSeek-Coder LLM'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Attempt #{candidatePatch.attempt_number || 1}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] max-w-2xl truncate">
                {candidatePatch.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAcceptPatch}
              className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept & Verify</span>
            </button>
            <button
              onClick={onRejectPatch}
              className="btn-secondary !py-1.5 !px-2.5 text-xs text-red-300 hover:text-red-200 border-red-500/30 hover:border-red-500/50 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 w-full relative">
        {isDiffMode && candidatePatch ? (
          <DiffEditor
            height="100%"
            theme="vs-dark"
            language="c"
            original={code}
            modified={candidatePatch.full_patched_code || code}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <Editor
            height="100%"
            theme="vs-dark"
            language="c"
            value={code}
            onChange={onChangeCode}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true, scale: 0.75 },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              wordWrap: 'on',
              tabSize: 4,
              automaticLayout: true,
              renderValidationDecorations: 'on',
            }}
          />
        )}
      </div>
    </div>
  )
}
