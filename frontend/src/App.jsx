/**
 * App.jsx — Root Application with Layout
 *
 * Provides the PipelineProvider state wrapper and a persistent sidebar
 * with the pipeline step indicator.
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

export default function App() {
  return (
    <PipelineProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
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
      </BrowserRouter>
    </PipelineProvider>
  )
}
