/**
 * components/PipelineStepper.jsx — Pipeline Progress Stepper
 *
 * Responsibility:
 *   Show the user's current position in the 5-step IoT ShieldAI pipeline.
 *   Clicking a completed step navigates to that step's page.
 *
 * Props:
 *   - currentStep: number  — 1 (Upload) to 5 (Report)
 *
 * Steps:
 *   1 → Upload    /
 *   2 → Analyze   /analyze
 *   3 → Repair    /repair
 *   4 → Verify    /verify
 *   5 → Report    /report/:id
 *
 * TODO:
 *   - Animate step transitions.
 *   - Disable future steps until current step completes.
 *   - Pass upload_id / report_id through navigation state.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  { label: 'Upload',   icon: '📁', path: '/' },
  { label: 'Analyze',  icon: '🔍', path: '/analyze' },
  { label: 'Repair',   icon: '🔧', path: '/repair' },
  { label: 'Verify',   icon: '✅', path: '/verify' },
  { label: 'Report',   icon: '📊', path: '/report/latest' },
]

/**
 * @param {{ currentStep: number }} props
 */
export default function PipelineStepper({ currentStep = 1 }) {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-center gap-0 mb-10" aria-label="Pipeline steps">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isDone  = stepNum < currentStep
        const isCur   = stepNum === currentStep
        return (
          <React.Fragment key={step.label}>
            <button
              onClick={() => isDone && navigate(step.path)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all
                ${isCur  ? 'bg-shield-900/50 text-shield-300' : ''}
                ${isDone ? 'text-dark-300 hover:text-shield-400 cursor-pointer' : ''}
                ${!isDone && !isCur ? 'text-dark-600 cursor-default' : ''}
              `}
              disabled={!isDone && !isCur}
            >
              <span className="text-2xl">{step.icon}</span>
              <span className="text-xs mt-1 font-medium">{step.label}</span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`h-px w-8 ${isDone ? 'bg-shield-600' : 'bg-dark-700'}`} />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
