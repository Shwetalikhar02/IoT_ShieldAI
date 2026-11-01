import React, { useRef, useEffect } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { Wand2, Check, X, GitCompare, Code2, AlertTriangle, Cpu } from 'lucide-react'

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

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Define refined custom dark theme matching #101310
    monaco.editor.defineTheme('codeshield-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '626D64', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'B7E36A' },
        { token: 'string', foreground: 'A3D685' },
        { token: 'number', foreground: 'E5A854' },
        { token: 'type', foreground: '78B3E0' },
        { token: 'function', foreground: 'F3F5EF', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'F3F5EF' },
      ],
      colors: {
        'editor.background': '#101310',
        'editor.foreground': '#F3F5EF',
        'editorLineNumber.foreground': '#364039',
        'editorLineNumber.activeForeground': '#9AA39B',
        'editor.lineHighlightBackground': '#181D19',
        'editor.selectionBackground': '#2A362D',
        'editorCursor.foreground': '#B7E36A',
        'editorGutter.background': '#101310',
        'editorIndentGuide.background': '#1D231E',
        'editorIndentGuide.activeBackground': '#2B332D',
      }
    })
    monaco.editor.setTheme('codeshield-dark')

    updateMonacoMarkers(editor, monaco, vulnerabilities)
  }

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      updateMonacoMarkers(editorRef.current, monacoRef.current, vulnerabilities)
    }
  }, [vulnerabilities])

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
      message: `[${v.cwe_id}] ${v.vuln_type}\nRoot Cause: ${v.root_cause}\nRecommended Remediation: ${v.fix_advice}`,
      severity: monaco.MarkerSeverity.Error,
    }))

    monaco.editor.setModelMarkers(model, 'codeshield-analyzer', markers)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#101310] overflow-hidden relative">
      {/* Editor Sub-Header */}
      <div className="h-10 border-b border-[#2B332D] bg-[#181D19] px-4 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-[#B7E36A]" />
          <span className="font-mono text-[#F3F5EF] font-medium">{activeFile?.name || 'firmware.c'}</span>
          <span className="text-[#626D64] font-mono">·</span>
          <span className="text-[11px] text-[#9AA39B] font-mono">C99 / Bare-metal Target</span>
        </div>

        <div className="flex items-center gap-2">
          {candidatePatch && (
            <button
              onClick={onToggleDiffMode}
              className={`btn-quiet text-xs !py-1 !px-2.5 ${
                isDiffMode ? '!border-[#B7E36A] !text-[#B7E36A]' : ''
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isDiffMode ? 'Buffer Editor' : 'Side-by-Side Diff'}</span>
            </button>
          )}

          {vulnerabilities.length > 0 && !candidatePatch && (
            <button
              onClick={() => onTriggerQuickFix(vulnerabilities[0])}
              className="btn-lime text-xs !py-1 !px-2.5 font-medium"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Fix ({vulnerabilities.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Candidate Patch Review Banner */}
      {candidatePatch && (
        <div className="px-4 py-2.5 bg-[#181D19] border-b border-[#2B332D] flex items-center justify-between text-xs animate-slide-up z-20">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#B7E36A]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F3F5EF]">Synthesized Patch Candidate</span>
                <span className="text-[10px] font-mono text-[#9AA39B] px-1.5 py-0.5 rounded bg-[#1D231E] border border-[#2B332D]">
                  {candidatePatch.strategy === 'template' ? 'Deterministic Rule' : 'DeepSeek-Coder LLM'}
                </span>
              </div>
              <p className="text-[#9AA39B] text-[11px] line-clamp-1 mt-0.5">
                {candidatePatch.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAcceptPatch}
              className="btn-lime text-xs !py-1.5 !px-3 font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Fix</span>
            </button>
            <button
              onClick={onRejectPatch}
              className="btn-quiet text-xs !py-1.5 !px-2.5 text-[#F07878] hover:text-[#F07878]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Surface */}
      <div className="flex-1 w-full relative">
        {isDiffMode && candidatePatch ? (
          <DiffEditor
            height="100%"
            theme="codeshield-dark"
            language="c"
            original={code}
            modified={candidatePatch.full_patched_code || code}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <Editor
            height="100%"
            theme="codeshield-dark"
            language="c"
            value={code}
            onChange={onChangeCode}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true, scale: 0.75 },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
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
