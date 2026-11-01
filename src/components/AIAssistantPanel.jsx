import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  ShieldAlert,
  Terminal,
  Cpu
} from 'lucide-react'
import { aiApi } from '../services/api'

export default function AIAssistantPanel({
  activeFile,
  vulnerabilities = [],
  activeVuln = null,
  candidatePatch = null,
  verificationResult = null,
  projectId = null
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [consentGranted, setConsentGranted] = useState(true)
  const messagesEndRef = useRef(null)

  const suggestedQuestions = [
    'Explain this vulnerability.',
    'How can I fix this issue?',
    'Explain this compiler error.',
    'Analyze the selected code.',
    'What should I fix first?'
  ]

  // Load chat history if project exists
  useEffect(() => {
    if (projectId) {
      loadHistory()
    }
  }, [projectId])

  const loadHistory = async () => {
    try {
      const data = await aiApi.getChats(projectId)
      if (data?.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map(m => ({
            role: m.role,
            text: m.text,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        )
      } else {
        // Welcome message
        setMessages([
          {
            role: 'assistant',
            text: `Hello! I am your CodeShield AI Embedded Security Co-pilot. I analyze your C/C++ firmware against real microcontroller constraints (Flash/ROM, SRAM, deterministic timing) and CWE memory-safety benchmarks. Ask me anything about ${activeFile?.name || 'your firmware'} or select a suggested prompt below.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (queryText = input) => {
    const textToSend = queryText.trim()
    if (!textToSend || loading) return

    if (!consentGranted) {
      alert('Please check the privacy consent box to enable sending firmware context to the AI assistant.')
      return
    }

    const userMsg = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Assemble real context
    const context = {
      filename: activeFile?.name || 'firmware.c',
      codeSnippet: activeFile?.code?.slice(0, 1200),
      vulnerabilities: vulnerabilities.map(v => ({
        cwe_id: v.cwe_id || v.cweId,
        vuln_type: v.vuln_type || v.vulnType,
        severity: v.severity,
        line_start: v.line_start || v.lineStart,
        description: v.description,
        root_cause: v.root_cause || v.rootCause
      })),
      candidatePatch: candidatePatch
        ? {
            strategy: candidatePatch.strategy,
            explanation: candidatePatch.explanation,
            patched_code: candidatePatch.patched_code || candidatePatch.patchedCode,
            model_used: candidatePatch.model_used || candidatePatch.modelUsed
          }
        : undefined,
      verificationResult: verificationResult
        ? {
            compiles: verificationResult.compiles,
            sanitizer_passed: verificationResult.sanitizer_passed ?? verificationResult.sanitizerPassed,
            no_cheating_passed: verificationResult.no_cheating_passed ?? verificationResult.noCheatingPassed,
            overall_status: verificationResult.overall_status ?? verificationResult.overallStatus,
            errors: verificationResult.errors
          }
        : undefined
    }

    try {
      const res = await aiApi.askAssistant(textToSend, projectId, context, true)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Error contacting AI Security Assistant: ${err?.message || 'Server timeout'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = async () => {
    if (projectId) {
      try {
        await aiApi.clearChats(projectId)
      } catch (e) {}
    }
    setMessages([
      {
        role: 'assistant',
        text: 'Chat history cleared. Context refreshed for current active buffer.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181D19] overflow-hidden text-xs select-none">
      {/* Top Banner */}
      <div className="px-3.5 py-2.5 bg-[#1D231E] border-b border-[#2B332D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#B7E36A]" />
          <span className="font-semibold text-[#F3F5EF] text-xs">AI Security Assistant</span>
          <span className="text-[10px] font-mono text-[#9AA39B] px-1 py-0.2 rounded bg-[#101310] border border-[#2B332D]">
            Gemini 3.8 Flash
          </span>
        </div>

        <button
          onClick={handleClearChat}
          title="Clear Conversation"
          className="text-[#9AA39B] hover:text-[#F07878] transition-colors p-1 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Privacy Consent Checkbox */}
      <div className="px-3.5 py-2 bg-[#101310] border-b border-[#2B332D] flex items-center justify-between text-[11px] text-[#9AA39B]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGranted}
            onChange={(e) => setConsentGranted(e.target.checked)}
            className="rounded border-[#2B332D] bg-[#181D19] text-[#B7E36A] focus:ring-0"
          />
          <span className="line-clamp-1">Share code & findings context with Gemini</span>
        </label>
        <Lock className="w-3 h-3 text-[#B7E36A] shrink-0 ml-2" />
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={idx}
              className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#626D64]">
                {isUser ? (
                  <>
                    <span>You</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#B7E36A] font-semibold">CodeShield AI</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`p-3 rounded-xl max-w-[92%] leading-relaxed text-xs ${
                  isUser
                    ? 'bg-[#B7E36A]/15 text-[#F3F5EF] border border-[#B7E36A]/30 font-medium'
                    : msg.isError
                    ? 'bg-[#F07878]/10 text-[#F07878] border border-[#F07878]/30 font-mono'
                    : 'bg-[#1D231E] text-[#F3F5EF] border border-[#2B332D] shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs space-y-1.5 selection:bg-[#B7E36A]/20">
                  {msg.text}
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1D231E] border border-[#2B332D] text-[#9AA39B] text-xs">
            <span className="cs-spinner" />
            <span className="font-mono text-[11px]">Analyzing firmware AST and compiler context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-3 py-2 bg-[#1D231E] border-t border-[#2B332D] space-y-1.5">
        <div className="text-[10px] uppercase font-mono text-[#626D64]">Suggested Inquiries:</div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[10px] px-2 py-1 rounded bg-[#101310] hover:bg-[#181D19] border border-[#2B332D] text-[#9AA39B] hover:text-[#B7E36A] transition-colors truncate max-w-[190px]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#181D19] border-t border-[#2B332D]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about buffer overflows, MISRA-C, or compiler logs..."
            disabled={loading}
            className="flex-1 bg-[#101310] border border-[#2B332D] rounded-lg py-2 px-3 text-xs text-[#F3F5EF] placeholder-[#626D64] focus:outline-none focus:border-[#B7E36A]/60 font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-lime !p-2 rounded-lg shrink-0 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
