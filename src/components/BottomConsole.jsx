import React, { useState } from 'react'
import { MessageSquare, Terminal, AlertTriangle, ShieldCheck, Send, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'

export default function BottomConsole({
  terminalLogs = [],
  onClearLogs,
  onSendConstraint,
  chatHistory = [],
  activeVuln = null,
  currentPatch = null
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'terminal' | 'asan'
  const [promptInput, setPromptInput] = useState('')

  const handleSendPrompt = (e) => {
    e.preventDefault()
    if (!promptInput.trim()) return
    onSendConstraint(promptInput.trim())
    setPromptInput('')
  }

  const presetConstraints = [
    'Use snprintf with strict sizeof bounds',
    'Keep stack allocation under 128 bytes',
    'Return -1 and log error on invalid buffer size',
    'Ensure explicit NULL termination'
  ]

  return (
    <div
      className={`border-t border-white/10 bg-[#020617]/95 backdrop-blur-md flex flex-col transition-all duration-300 select-none z-30 ${
        isOpen ? 'h-60' : 'h-9'
      }`}
    >
      {/* Console Tab Header */}
      <div className="h-9 px-4 border-b border-white/10 flex items-center justify-between text-xs bg-slate-950/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveTab('chat'); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t font-semibold text-xs transition-colors ${
              activeTab === 'chat' && isOpen
                ? 'bg-slate-900 text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI ChatRefine</span>
            {chatHistory.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 text-[10px] flex items-center justify-center font-bold">
                {chatHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('terminal'); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t font-semibold text-xs transition-colors ${
              activeTab === 'terminal' && isOpen
                ? 'bg-slate-900 text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Pipeline SSE Stream</span>
            {terminalLogs.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                {terminalLogs.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {terminalLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Clear terminal stream logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title={isOpen ? 'Collapse Console' : 'Expand Console'}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Console Tab Content */}
      {isOpen && (
        <div className="flex-1 overflow-hidden p-3 flex flex-col">
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Chat Message Scroll */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-3 text-slate-500 text-xs">
                    <p className="font-semibold text-slate-400 mb-1">
                      Conversational Repair & IoT Constraint Refinement
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-lg mx-auto mb-3">
                      Supply specific runtime restrictions (e.g., maximum stack allowance, safer library functions, or error return specifications) to iteratively refine the patch.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {presetConstraints.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSendConstraint(preset)}
                          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-white/5 transition-colors"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xl p-2.5 rounded-xl text-xs ${
                          item.role === 'user'
                            ? 'bg-sky-950/70 text-sky-200 border border-sky-500/30 font-medium'
                            : 'bg-slate-900/90 text-slate-200 border border-white/10'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 font-mono font-bold flex items-center gap-1">
                          {item.role === 'user' ? '👤 Engineer Constraint' : '🤖 CodeShield Synthesizer'}
                          <span className="text-slate-600 font-normal">({item.timestamp})</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{item.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendPrompt} className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Inject constraint (e.g. 'Use snprintf with sizeof bound', 'Keep stack usage under 128 bytes')..."
                  className="flex-1 bg-slate-900/90 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!promptInput.trim()}
                  className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Refine</span>
                </button>
              </form>
            </div>
          ) : (
            /* Terminal Logs View */
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/60 p-2.5 rounded-lg border border-white/5 text-slate-300">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-600 italic">No pipeline messages yet. Run Scan or Full Pipeline to stream execution events.</div>
              ) : (
                terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0 text-[10px]">{log.time}</span>
                    <span
                      className={`font-bold shrink-0 text-[10px] uppercase ${
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'warning'
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }`}
                    >
                      [{log.step || 'INFO'}]
                    </span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
