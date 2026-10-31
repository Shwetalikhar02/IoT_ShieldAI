/**
 * App.jsx — Root Application with Premium Layout
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PipelineProvider } from './store/pipelineStore'

import UploadPage       from './pages/UploadPage'
import AnalysisPage     from './pages/AnalysisPage'
import RepairPage       from './pages/RepairPage'
import VerificationPage from './pages/VerificationPage'
import ReportPage       from './pages/ReportPage'
import Navbar           from './components/Navbar'
import Toast            from './components/Toast'

export default function App() {
  return (
    <PipelineProvider>
      <BrowserRouter>
        {/* Animated background grid */}
        <div className="bg-grid" aria-hidden="true" />
        
        <div className="min-h-screen flex flex-col relative z-10">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"            element={<UploadPage />} />
              <Route path="/analyze"     element={<AnalysisPage />} />
              <Route path="/repair"      element={<RepairPage />} />
              <Route path="/verify"      element={<VerificationPage />} />
              <Route path="/report/:id"  element={<ReportPage />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        
        {/* Global toast notifications */}
        <Toast />
      </BrowserRouter>
    </PipelineProvider>
  )
}
