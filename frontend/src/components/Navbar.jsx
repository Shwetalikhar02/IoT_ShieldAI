/**
 * components/Navbar.jsx — Top Navigation Bar with Pipeline Steps
 */

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePipeline } from '../store/pipelineStore'

const STEPS = [
  { path: '/',        icon: '📁', label: 'Upload',   key: 'upload'   },
  { path: '/analyze', icon: '🔍', label: 'Analyze',  key: 'analyze'  },
  { path: '/repair',  icon: '🔧', label: 'Repair',   key: 'repair'   },
  { path: '/verify',  icon: '✅', label: 'Verify',   key: 'verify'   },
  { path: '/report',  icon: '📊', label: 'Report',   key: 'report'   },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = usePipeline()

  const currentStep = STEPS.findIndex(s => {
    if (s.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(s.path)
  })

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-dark-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-base text-gradient hidden sm:block">
            IoT ShieldAI
          </span>
        </button>

        {/* Pipeline steps */}
        <nav className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep
            const isDone   = i < currentStep
            const isFirst  = i === 0

            // Check if step is accessible
            const canNavigate = isFirst || state.uploadId

            return (
              <React.Fragment key={step.key}>
                {i > 0 && (
                  <div className={`w-6 h-px mx-0.5 ${isDone ? 'bg-shield-600' : 'bg-white/10'}`} />
                )}
                <button
                  onClick={() => canNavigate && navigate(step.path)}
                  disabled={!canNavigate}
                  title={step.label}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                    transition-all duration-200
                    ${isActive
                      ? 'bg-shield-600/20 text-shield-300 border border-shield-500/40'
                      : isDone
                        ? 'text-dark-300 hover:text-dark-100 hover:bg-white/5 cursor-pointer'
                        : 'text-dark-500 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  <span>{step.icon}</span>
                  <span className="hidden md:block">{step.label}</span>
                  {isDone && <span className="text-shield-400 hidden lg:block">✓</span>}
                </button>
              </React.Fragment>
            )
          })}
        </nav>

        {/* Status pill */}
        <div className="flex items-center gap-2 shrink-0">
          {state.loading ? (
            <div className="flex items-center gap-2 text-xs text-cyber-400">
              <div className="spinner w-3.5 h-3.5" />
              <span className="hidden sm:block">Running...</span>
            </div>
          ) : state.error ? (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <span>⚠</span>
              <span className="hidden sm:block max-w-[120px] truncate">{state.error}</span>
            </div>
          ) : state.uploadId ? (
            <div className="flex items-center gap-1.5 text-xs text-dark-400">
              <div className="status-dot bg-shield-500" />
              <span className="hidden sm:block font-mono">{state.uploadId.slice(0, 8)}…</span>
            </div>
          ) : (
            <div className="text-xs text-dark-600 hidden sm:block">No session</div>
          )}
        </div>
      </div>
    </header>
  )
}
