/**
 * components/Navbar.jsx — Premium Top Navigation Bar
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePipeline } from '../store/pipelineStore'

const STEPS = [
  { path: '/',        icon: '📁', label: 'Upload',   key: 'upload',   num: 1 },
  { path: '/analyze', icon: '🔍', label: 'Analyze',  key: 'analyze',  num: 2 },
  { path: '/repair',  icon: '🔧', label: 'Repair',   key: 'repair',   num: 3 },
  { path: '/verify',  icon: '✅', label: 'Verify',   key: 'verify',   num: 4 },
  { path: '/report',  icon: '📊', label: 'Report',   key: 'report',   num: 5 },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = usePipeline()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const currentStepIdx = STEPS.findIndex(s => {
    if (s.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(s.path)
  })

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/8 shadow-2xl shadow-black/40'
          : 'border-b border-white/5'
      }`}
      style={{
        background: scrolled
          ? 'rgba(2, 6, 23, 0.95)'
          : 'rgba(2, 6, 23, 0.80)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 shrink-0 hover:opacity-85 transition-all duration-200 group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.2), rgba(14,165,233,0.15))', border: '1px solid rgba(22,163,74,0.3)' }}
            >
              🛡️
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="font-bold text-sm text-gradient">IoT ShieldAI</span>
            <span className="text-[10px] text-dark-600 font-medium tracking-wider">FIRMWARE SECURITY</span>
          </div>
        </button>

        {/* Pipeline stepper — center */}
        <nav className="flex-1 flex items-center justify-center gap-0.5 overflow-x-auto no-scrollbar">
          {STEPS.map((step, i) => {
            const isActive = i === currentStepIdx
            const isDone   = i < currentStepIdx
            const isPending = i > currentStepIdx
            const canNavigate = i === 0 || state.uploadId

            return (
              <React.Fragment key={step.key}>
                {/* Connector line */}
                {i > 0 && (
                  <div
                    className="w-5 md:w-8 h-px shrink-0 transition-all duration-500"
                    style={{
                      background: isDone
                        ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                        : 'rgba(255,255,255,0.08)'
                    }}
                  />
                )}

                <button
                  onClick={() => canNavigate && navigate(step.path)}
                  disabled={!canNavigate}
                  title={step.label}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                    transition-all duration-200 shrink-0 whitespace-nowrap
                    ${isActive
                      ? 'text-shield-300'
                      : isDone
                        ? 'text-dark-300 hover:text-dark-100 cursor-pointer'
                        : 'text-dark-600 cursor-not-allowed opacity-50'
                    }
                  `}
                  style={isActive ? {
                    background: 'rgba(22,163,74,0.12)',
                    border: '1px solid rgba(22,163,74,0.25)',
                    boxShadow: '0 0 12px rgba(22,163,74,0.15)'
                  } : isDone ? {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent'
                  }}
                >
                  <span className="text-sm">{step.icon}</span>
                  <span className="hidden md:block">{step.label}</span>
                  {isDone && (
                    <span className="text-shield-400 text-xs">✓</span>
                  )}
                </button>
              </React.Fragment>
            )
          })}
        </nav>

        {/* Status pill — right */}
        <div className="flex items-center gap-2.5 shrink-0">
          {state.loading ? (
            <div className="flex items-center gap-2 text-xs text-cyber-300 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              <div className="spinner w-3 h-3" />
              <span className="hidden sm:block font-medium">Processing…</span>
            </div>
          ) : state.error ? (
            <div className="flex items-center gap-1.5 text-xs text-red-300 px-2.5 py-1.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <span>⚠</span>
              <span className="hidden sm:block max-w-[100px] truncate">{state.error}</span>
            </div>
          ) : state.uploadId ? (
            <div className="flex items-center gap-1.5 text-xs text-dark-400 px-2.5 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-shield-400" />
              <span className="hidden sm:block font-mono text-dark-500">{state.uploadId.slice(0, 8)}…</span>
            </div>
          ) : (
            <div className="text-xs text-dark-700 hidden sm:block px-2">No session</div>
          )}
        </div>
      </div>
    </header>
  )
}
