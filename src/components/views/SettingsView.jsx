import React, { useState } from 'react'
import {
  Cpu,
  Lock,
  Check,
  Server,
  Sliders,
  Shield,
  Save
} from 'lucide-react'

export default function SettingsView({
  currentProvider = 'Mock (Offline)',
  onSelectProvider
}) {
  const [provider, setProvider] = useState(currentProvider)
  const [timeoutSec, setTimeoutSec] = useState('30')
  const [optLevel, setOptLevel] = useState('-O1')
  const [saved, setSaved] = useState(false)

  const providers = [
    {
      id: 'Mock (Offline)',
      name: 'Deterministic Templates + Safe Mock (Default)',
      badge: 'Offline Mode',
      desc: '100% offline rule-based repairs for standard CWEs with zero network dependencies.',
      isLocal: true
    },
    {
      id: 'Ollama: DeepSeek-Coder 6.7B',
      name: 'Ollama Local LLM (DeepSeek-Coder:6.7b)',
      badge: 'Local Open-Source Code LLM',
      desc: 'Connects to localhost:11434. Keeps all firmware source code on-premise.',
      isLocal: true
    },
    {
      id: 'Google Gemini 2.5 Flash',
      name: 'Gemini API (Server-Side Proxy)',
      badge: 'Cloud High-Capacity LLM',
      desc: 'Advanced automated patch synthesis with multi-turn sanitizer feedback loop.',
      isLocal: false
    }
  ]

  const handleSave = () => {
    onSelectProvider(provider)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#101310] p-8 select-none text-xs">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#F3F5EF] tracking-tight">
              Platform & Synthesis Settings
            </h1>
            <p className="text-[#9AA39B] text-xs mt-1">
              Configure model providers, air-gap privacy boundaries, and compiler sandbox settings.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="btn-lime text-xs font-semibold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saved ? 'Saved ✓' : 'Save Settings'}</span>
          </button>
        </div>

        {/* AI Provider Section */}
        <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2B332D]">
            <Cpu className="w-4 h-4 text-[#B7E36A]" />
            <span className="font-semibold text-sm text-[#F3F5EF]">AI Synthesis Provider</span>
          </div>

          <div className="space-y-2">
            {providers.map((p) => {
              const isSelected = provider === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1D231E] border-[#B7E36A]/50 text-[#F3F5EF]'
                      : 'bg-[#181D19] border-[#2B332D] text-[#9AA39B] hover:border-[#2B332D]/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#F3F5EF]">{p.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#101310] text-[#B7E36A]">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9AA39B]">{p.desc}</p>
                  </div>

                  <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 border-[#2B332D]">
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#B7E36A]" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Privacy Safeguards */}
        <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2B332D]">
            <Lock className="w-4 h-4 text-[#B7E36A]" />
            <span className="font-semibold text-sm text-[#F3F5EF]">Air-Gap & Data Protection</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-[#101310] border border-[#2B332D]">
            <div>
              <div className="font-medium text-[#F3F5EF] text-xs">SEND_CODE_TO_EXTERNAL_LLM</div>
              <div className="text-[11px] text-[#9AA39B]">
                Enforces zero outbound network transmission of firmware source code.
              </div>
            </div>
            <span className="badge-verified-subtle font-mono text-[10px]">LOCKED (OFFLINE)</span>
          </div>
        </div>

        {/* Compiler Flags & Sandbox limits */}
        <div className="p-5 rounded-lg bg-[#181D19] border border-[#2B332D] space-y-3 font-mono">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2B332D]">
            <Sliders className="w-4 h-4 text-[#B7E36A]" />
            <span className="font-semibold text-sm text-[#F3F5EF] font-sans">Compiler & Sandbox Tuning</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] text-[#9AA39B]">Compiler Warnings</label>
              <input
                type="text"
                disabled
                value="-Wall -Wextra -Werror"
                className="w-full bg-[#101310] border border-[#2B332D] rounded p-2 text-xs text-[#F3F5EF] opacity-80"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#9AA39B]">AddressSanitizer Flags</label>
              <input
                type="text"
                disabled
                value="-fsanitize=address,undefined -g"
                className="w-full bg-[#101310] border border-[#2B332D] rounded p-2 text-xs text-[#F3F5EF] opacity-80"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
