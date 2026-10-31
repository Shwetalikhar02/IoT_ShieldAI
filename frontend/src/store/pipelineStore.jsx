/**
 * store/pipelineStore.js — Simple React Context + useReducer State Store
 *
 * Tracks: upload_id, analysis results, repair sessions,
 *         pipeline result, and current step.
 */

import { createContext, useContext, useReducer } from 'react'

const initialState = {
  step: 'upload',          // upload | analyze | repair | verify | report
  uploadId: null,
  uploadFiles: [],
  demoSampleId: null,
  // M1
  vulnerabilities: [],
  totalVulns: 0,
  // M2/M3 (per-vuln)
  sessions: {},            // { [vuln_id]: RepairSession }
  patches: [],
  verifications: [],
  // M4
  pipelineResult: null,
  reportId: null,
  // UI
  loading: false,
  error: null,
  sseLog: [],              // SSE progress messages
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.payload }
    case 'SET_UPLOAD': return { ...state, uploadId: action.payload.uploadId, uploadFiles: action.payload.files || [], demoSampleId: null, error: null }
    case 'SET_DEMO': return { ...state, uploadId: action.payload.uploadId, demoSampleId: action.payload.sampleId, error: null }
    case 'SET_VULNS': return { ...state, vulnerabilities: action.payload, totalVulns: action.payload.length }
    case 'ADD_SESSION': return { ...state, sessions: { ...state.sessions, [action.payload.vuln_id]: action.payload.session } }
    case 'SET_PATCHES': return { ...state, patches: action.payload }
    case 'SET_VERIFICATIONS': return { ...state, verifications: action.payload }
    case 'SET_PIPELINE_RESULT': return { ...state, pipelineResult: action.payload, reportId: action.payload?.id }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false }
    case 'CLEAR_ERROR': return { ...state, error: null }
    case 'ADD_SSE_LOG': return { ...state, sseLog: [...state.sseLog.slice(-50), action.payload] }
    case 'CLEAR_SSE_LOG': return { ...state, sseLog: [] }
    case 'RESET': return { ...initialState }
    default: return state
  }
}

const PipelineContext = createContext(null)

export function PipelineProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <PipelineContext.Provider value={{ state, dispatch }}>
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipeline() {
  const ctx = useContext(PipelineContext)
  if (!ctx) throw new Error('usePipeline must be used inside PipelineProvider')
  return ctx
}
