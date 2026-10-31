import React, { useState, useEffect } from 'react'
import NavigationSidebar from './components/NavigationSidebar'
import TopNav from './components/TopNav'
import FileExplorerPanel from './components/FileExplorerPanel'
import EditorView from './components/EditorView'
import SecurityInsightsPanel from './components/SecurityInsightsPanel'
import OverviewView from './components/views/OverviewView'
import FindingsView from './components/views/FindingsView'
import RepairWorkbenchView from './components/views/RepairWorkbenchView'
import VerificationConsoleView from './components/views/VerificationConsoleView'
import ReportsView from './components/views/ReportsView'
import SettingsView from './components/views/SettingsView'
import BenchmarkModal from './components/BenchmarkModal'
import CheatingDemoModal from './components/CheatingDemoModal'

import { FIRMWARE_SAMPLES } from './data/firmwareSamples'
import { analyzeFirmwareCode } from './services/analyzer'
import { applyTemplateFix, refinePatchWithConstraint } from './services/repairEngine'
import { verifyPatchCandidate } from './services/verifier'
import { calculateIoTMetrics, buildExplainabilityReport } from './services/metrics'

export default function App() {
  // Navigation View State ('explorer' | 'overview' | 'findings' | 'repair' | 'verify' | 'reports' | 'settings')
  const [activeView, setActiveView] = useState('explorer')

  // File state
  const [files, setFiles] = useState(FIRMWARE_SAMPLES)
  const [activeFileId, setActiveFileId] = useState('stack_overflow')
  const activeFile = files.find(f => f.id === activeFileId) || files[0]
  const [currentCode, setCurrentCode] = useState(activeFile?.code || '')

  // Analysis & Vulnerability state (M1)
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [activeVuln, setActiveVuln] = useState(null)

  // Repair state (M2)
  const [candidatePatch, setCandidatePatch] = useState(null)
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [appliedPatches, setAppliedPatches] = useState([])

  // Verification state (M3)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationsHistory, setVerificationsHistory] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)

  // Metrics & Report state (M4)
  const [metrics, setMetrics] = useState(null)
  const [reportExplanation, setReportExplanation] = useState('')

  // UI state
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [provider, setProvider] = useState('Mock (Offline)')
  const [chatHistory, setChatHistory] = useState([])

  // Modals
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false)
  const [showCheatingDemo, setShowCheatingDemo] = useState(false)

  // Sync code whenever active file changes
  useEffect(() => {
    if (activeFile) {
      setCurrentCode(activeFile.code)
      setCandidatePatch(null)
      setIsDiffMode(false)
      setVerificationResult(null)
      setMetrics(null)
      runAnalysis(activeFile.code, activeFile.name)
    }
  }, [activeFileId])

  // ── M1: Analysis ─────────────────────────────────────────────────────────────
  const runAnalysis = (sourceCode = currentCode, filename = activeFile?.name) => {
    const findings = analyzeFirmwareCode(sourceCode, filename)
    setVulnerabilities(findings)
    setActiveVuln(findings[0] || null)
    return findings
  }

  // ── M2: Fix with AI / Quick-Fix ───────────────────────────────────────────────
  const handleTriggerQuickFix = (vuln = vulnerabilities[0]) => {
    if (!vuln) return
    const patch = applyTemplateFix(vuln, currentCode)
    if (patch) {
      setCandidatePatch(patch)
      setIsDiffMode(true)
      setActiveVuln(vuln)
      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Synthesized remediation for ${vuln.vuln_type} (${vuln.cwe_id}):\n${patch.explanation}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ])
    }
  }

  // ── Accept Patch & Verify (M3) ──────────────────────────────────────────────
  const handleAcceptPatch = () => {
    if (!candidatePatch) return
    const newCode = candidatePatch.full_patched_code || currentCode
    setCurrentCode(newCode)
    setIsDiffMode(false)
    setAppliedPatches(prev => [...prev, candidatePatch])

    runVerification(candidatePatch, newCode)
    setCandidatePatch(null)
  }

  const handleRejectPatch = () => {
    setCandidatePatch(null)
    setIsDiffMode(false)
  }

  // ── M3: Verification ─────────────────────────────────────────────────────────
  const runVerification = (patch = candidatePatch, codeToVerify = currentCode) => {
    setIsVerifying(true)
    setTimeout(() => {
      const targetVuln = activeVuln || vulnerabilities[0] || activeFile
      const ver = verifyPatchCandidate(patch, targetVuln, codeToVerify)
      setVerificationResult(ver)
      setVerificationsHistory(prev => [...prev, ver])

      const remainingVulns = analyzeFirmwareCode(codeToVerify, activeFile?.name)
      setVulnerabilities(remainingVulns)

      const calculatedMetrics = calculateIoTMetrics(activeFile?.code, codeToVerify, 1)
      setMetrics(calculatedMetrics)

      const expl = buildExplainabilityReport(
        [targetVuln],
        [patch || { strategy: 'manual', explanation: 'Manual buffer modification', patched_code: '' }],
        [ver],
        calculatedMetrics
      )
      setReportExplanation(expl)
      setIsVerifying(false)
    }, 280)
  }

  // ── Conversational Refinement (ChatRefine) ──────────────────────────────────
  const handleSendConstraint = (constraint) => {
    setChatHistory(prev => [
      ...prev,
      { role: 'user', text: constraint, timestamp: new Date().toLocaleTimeString() }
    ])

    const targetVuln = activeVuln || vulnerabilities[0] || activeFile
    const basePatch = candidatePatch || applyTemplateFix(targetVuln, currentCode)

    if (basePatch) {
      const refined = refinePatchWithConstraint(basePatch, constraint, currentCode, targetVuln)
      setCandidatePatch(refined)
      setIsDiffMode(true)

      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Refined patch synthesized (Attempt #${refined.attempt_number}):\n${refined.explanation}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ])
    }
  }

  // ── Full Pipeline ────────────────────────────────────────────────────────────
  const handleRunPipeline = async () => {
    setPipelineRunning(true)
    const findings = runAnalysis(currentCode, activeFile.name)

    if (findings.length === 0) {
      setPipelineRunning(false)
      return
    }

    const targetVuln = findings[0]
    await new Promise(r => setTimeout(r, 200))
    const patch = applyTemplateFix(targetVuln, currentCode)

    if (patch) {
      setCandidatePatch(patch)
      setCurrentCode(patch.full_patched_code)
      setAppliedPatches([patch])

      await new Promise(r => setTimeout(r, 250))
      const ver = verifyPatchCandidate(patch, targetVuln, patch.full_patched_code)
      setVerificationResult(ver)
      setVerificationsHistory([ver])

      const remaining = analyzeFirmwareCode(patch.full_patched_code, activeFile.name)
      setVulnerabilities(remaining)

      const calculatedMetrics = calculateIoTMetrics(activeFile.code, patch.full_patched_code, 1)
      setMetrics(calculatedMetrics)

      const expl = buildExplainabilityReport([targetVuln], [patch], [ver], calculatedMetrics)
      setReportExplanation(expl)
    }

    setPipelineRunning(false)
  }

  // ── File upload / new file ──────────────────────────────────────────────────
  const handleFileUpload = (uploadedFiles) => {
    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        const newFile = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          name: file.name,
          category: 'custom',
          code: content,
          vuln_type: 'Uploaded Firmware',
          severity: 'Medium'
        }
        setFiles(prev => [...prev, newFile])
        setActiveFileId(newFile.id)
      }
      reader.readAsText(file)
    })
  }

  const handleNewFile = () => {
    const filename = `custom_firmware_${files.length + 1}.c`
    const skeleton = `/*
 * Embedded Firmware Routine
 */
#include <stdio.h>
#include <string.h>

void process_frame(const char *input) {
    char buf[64];
    // Implement firmware logic
    printf("[device] Frame processed\\n");
}

int main(void) {
    process_frame("ping");
    return 0;
}`
    const newFile = {
      id: `custom_${Date.now()}`,
      name: filename,
      category: 'custom',
      code: skeleton,
      vuln_type: 'Custom Source',
      severity: 'Low'
    }
    setFiles(prev => [...prev, newFile])
    setActiveFileId(newFile.id)
  }

  const handleInspectVuln = (vuln) => {
    const targetFile = files.find(f => f.name === vuln.file_path)
    if (targetFile && targetFile.id !== activeFileId) {
      setActiveFileId(targetFile.id)
    }
    setActiveVuln(vuln)
    setActiveView('explorer')
  }

  const handleTriggerFixFromView = (vuln) => {
    handleInspectVuln(vuln)
    handleTriggerQuickFix(vuln)
  }

  return (
    <div className="flex h-screen w-screen bg-[#101310] text-[#F3F5EF] overflow-hidden font-sans">
      {/* 1. Slim Left Navigation Sidebar */}
      <NavigationSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        vulnCount={vulnerabilities.length}
        verifiedCount={appliedPatches.length}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 2. Top Navigation Bar */}
        <TopNav
          activeFile={activeFile}
          activeView={activeView}
          onRunScan={() => runAnalysis(currentCode, activeFile.name)}
          onRunPipeline={handleRunPipeline}
          onOpenBenchmark={() => setShowBenchmarkModal(true)}
          onOpenCheatingDemo={() => setShowCheatingDemo(true)}
          pipelineRunning={pipelineRunning}
          vulnCount={vulnerabilities.length}
        />

        {/* 3. Main Workspace Viewport */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'explorer' && (
            <>
              {/* File Explorer */}
              <FileExplorerPanel
                files={files}
                activeFileId={activeFileId}
                onSelectFile={setActiveFileId}
                onFileUpload={handleFileUpload}
                onNewFile={handleNewFile}
                vulnerabilities={vulnerabilities}
              />

              {/* Source Code Editor in Center */}
              <EditorView
                code={currentCode}
                onChangeCode={setCurrentCode}
                activeFile={activeFile}
                vulnerabilities={vulnerabilities}
                activeVuln={activeVuln}
                candidatePatch={candidatePatch}
                onAcceptPatch={handleAcceptPatch}
                onRejectPatch={handleRejectPatch}
                onTriggerQuickFix={handleTriggerQuickFix}
                isDiffMode={isDiffMode}
                onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
              />

              {/* Security Insights on Right */}
              <SecurityInsightsPanel
                vulnerabilities={vulnerabilities}
                activeVuln={activeVuln}
                candidatePatch={candidatePatch}
                verificationResult={verificationResult}
                metrics={metrics}
                onTriggerQuickFix={handleTriggerQuickFix}
                onRunVerify={() => runVerification(candidatePatch, currentCode)}
                isVerifying={isVerifying}
              />
            </>
          )}

          {activeView === 'overview' && (
            <OverviewView
              files={files}
              vulnerabilities={vulnerabilities}
              patches={appliedPatches}
              verifications={verificationsHistory}
              metrics={metrics}
              onNavigateToExplorer={() => setActiveView('explorer')}
              onRunScan={() => runAnalysis(currentCode, activeFile.name)}
              onRunPipeline={handleRunPipeline}
            />
          )}

          {activeView === 'findings' && (
            <FindingsView
              vulnerabilities={vulnerabilities}
              onInspectVuln={handleInspectVuln}
              onTriggerFix={handleTriggerFixFromView}
            />
          )}

          {activeView === 'repair' && (
            <RepairWorkbenchView
              activeFile={activeFile}
              vulnerabilities={vulnerabilities}
              activeVuln={activeVuln}
              candidatePatch={candidatePatch}
              appliedPatches={appliedPatches}
              verificationResult={verificationResult}
              onTriggerQuickFix={handleTriggerQuickFix}
              onAcceptPatch={handleAcceptPatch}
              onRejectPatch={handleRejectPatch}
              onSendConstraint={handleSendConstraint}
              chatHistory={chatHistory}
            />
          )}

          {activeView === 'verify' && (
            <VerificationConsoleView
              verificationResult={verificationResult}
              onRunVerify={() => runVerification(candidatePatch, currentCode)}
              isVerifying={isVerifying}
              onOpenCheatingDemo={() => setShowCheatingDemo(true)}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              activeFile={activeFile}
              vulnerabilities={vulnerabilities}
              patches={appliedPatches.length > 0 ? appliedPatches : candidatePatch ? [candidatePatch] : []}
              verifications={verificationsHistory.length > 0 ? verificationsHistory : verificationResult ? [verificationResult] : []}
              metrics={metrics}
              explanation={reportExplanation}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              currentProvider={provider}
              onSelectProvider={setProvider}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <BenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
      />

      <CheatingDemoModal
        isOpen={showCheatingDemo}
        onClose={() => setShowCheatingDemo(false)}
      />
    </div>
  )
}
