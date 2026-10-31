/**
 * App.jsx — Root Application Component
 *
 * Responsibility:
 *   Set up React Router and define the top-level route tree.
 *   Each route corresponds to one step in the IoT ShieldAI pipeline.
 *
 * Routes:
 *   /           → UploadPage      (Step 1: Upload firmware)
 *   /analyze    → AnalysisPage    (Step 2: View M1 detected vulnerabilities)
 *   /repair     → RepairPage      (Step 3: Review M2 patches)
 *   /verify     → VerificationPage (Step 4: M3 compile/ASan results)
 *   /report/:id → ReportPage      (Step 5: Full pipeline report + M4 metrics)
 *
 * TODO:
 *   - Add a persistent layout component (Navbar, sidebar pipeline stepper).
 *   - Add global error boundary.
 *   - Add authentication guard if auth is added later.
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import UploadPage       from './pages/UploadPage'
import AnalysisPage     from './pages/AnalysisPage'
import RepairPage       from './pages/RepairPage'
import VerificationPage from './pages/VerificationPage'
import ReportPage       from './pages/ReportPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<UploadPage />} />
        <Route path="/analyze"     element={<AnalysisPage />} />
        <Route path="/repair"      element={<RepairPage />} />
        <Route path="/verify"      element={<VerificationPage />} />
        <Route path="/report/:id"  element={<ReportPage />} />
        {/* Fallback */}
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
