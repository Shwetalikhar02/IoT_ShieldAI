import React, { useState } from 'react'
import { X, Cpu, Shield, Check, Lock, AlertCircle, Server } from 'lucide-react'

export default function ProviderModal({
  isOpen,
  onClose,
  currentProvider = 'Mock (Offline)',
  onSelectProvider
}) {
  const [selected, setSelected] = useState(currentProvider)
  const [sendExternal, setSendExternal] = useState(false)

  if (!isOpen) return null

  const providers = [
    {
      id: 'Mock (Offline)',
      title: 'Deterministic Templates + Safe Mock (Default)',
      badge: 'Offline Hackathon Mode',
      desc: 'Instant rule-based repairs for CWE-121, 476, 134, 416, 190, 415, 787 with 0 external network dependencies and 100% test pass rate.',
      isLocal: true,
      tierFast: 'Rule Engine v2',
      tierStrong: 'CWE Template Engine',
      tierEscalation: 'Multi-Pass Synthesis'
    },
    {
      id: 'Ollama: DeepSeek-Coder 6.7B',
      title: 'Ollama Local LLM (DeepSeek-Coder:6.7b)',
      badge: 'Local Open-Source Code LLM',
      desc: 'Runs on localhost:11434. Keeps all firmware source code on-premise inside the local machine boundary with zero telemetry.',
      isLocal: true,
      tierFast: 'deepseek-coder:6.7b-instruct',
      tierStrong: 'deepseek-coder:6.7b-instruct',
      tierEscalation: 'codellama:7b-instruct'
    },
    {
      id: 'Google Gemini 2.5 Flash',
      title: 'Gemini API (Server-Side Proxy)',
      badge: 'Cloud High-Capacity LLM',
      desc: 'Advanced automated patch synthesis with multi-turn sanitizer feedback loop. Requires SEND_CODE_TO_EXTERNAL_LLM=true.',
      isLocal: false,
      tierFast: 'gemini-2.5-flash',
      tierStrong: 'gemini-2.5-flash',
      tierEscalation: 'gemini-2.5-pro'
    }
  ]

  const handleApply = () => {
    onSelectProvider(selected, sendExternal)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">LLM Provider & Model Tier Settings</h2>
              <p className="text-xs text-slate-400 font-mono">Configure synthesis backend & privacy boundaries</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="space-y-3">
            {providers.map((prov) => {
              const isSelected = selected === prov.id
              return (
                <div
                  key={prov.id}
                  onClick={() => setSelected(prov.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/40 shadow-lg shadow-sky-500/5'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-white">{prov.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-sky-300 border border-white/10 font-medium">
                          {prov.badge}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed mb-2">
                        {prov.desc}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                        <span>Fast: <strong className="text-slate-300">{prov.tierFast}</strong></span>
                        <span>Strong: <strong className="text-slate-300">{prov.tierStrong}</strong></span>
                        <span>Escalation: <strong className="text-slate-300">{prov.tierEscalation}</strong></span>
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-sky-400 bg-sky-500/20 text-sky-300' : 'border-slate-600'
                    }">
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Privacy & Air-Gap Indicator */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-200">Firmware Source Code Privacy</span>
                <p className="text-[11px] text-slate-400">
                  {selected.includes('Mock') || selected.includes('Ollama')
                    ? '100% On-Premise Air-Gapped. No code leaves local memory.'
                    : 'External API mode requires explicit opt-in confirmation.'}
                </p>
              </div>
            </div>

            <span className="badge-pass text-[10px]">
              {selected.includes('Mock') || selected.includes('Ollama') ? 'AIR-GAPPED' : 'REMOTE'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary !py-2 !px-4 text-xs">
              Cancel
            </button>
            <button onClick={handleApply} className="btn-primary !py-2 !px-5 text-xs font-semibold">
              Apply Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
