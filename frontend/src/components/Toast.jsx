/**
 * components/Toast.jsx — Global Toast Notification System
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

let _addToast = null

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { success: () => {}, error: () => {}, info: () => {} }
  return ctx
}

// Global helper — can be called from anywhere
export const toast = {
  success: (msg) => _addToast?.({ type: 'success', message: msg }),
  error: (msg) => _addToast?.({ type: 'error', message: msg }),
  info: (msg) => _addToast?.({ type: 'info', message: msg }),
}

function ToastItem({ id, type, message, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4500)
    return () => clearTimeout(t)
  }, [id, onRemove])

  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  const borders = {
    success: 'border-l-shield-500',
    error: 'border-l-red-500',
    info: 'border-l-cyber-500',
  }

  return (
    <div className={`toast toast-${type} animate-slide-up`}>
      <span className="text-base shrink-0 mt-0.5">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-dark-100 text-sm leading-snug">{message}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="text-dark-500 hover:text-dark-200 transition-colors shrink-0 text-lg leading-none ml-1"
      >
        ×
      </button>
    </div>
  )
}

export default function Toast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type, message }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { id, type, message }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Set global reference
  _addToast = addToast

  return (
    <ToastContext.Provider value={{
      success: (msg) => addToast({ type: 'success', message: msg }),
      error: (msg) => addToast({ type: 'error', message: msg }),
      info: (msg) => addToast({ type: 'info', message: msg }),
    }}>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
