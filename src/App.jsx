import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import FileTree from './components/FileTree'
import EditorView from './components/EditorView'
import VerifyPanel from './components/VerifyPanel'
import BottomConsole from './components/BottomConsole'
import ReportModal from './components/ReportModal'
import BenchmarkModal from './components/BenchmarkModal'
import CheatingDemoModal from './components/CheatingDemoModal'
import ProviderModal from './components/ProviderModal'
import { FIRMWARE_SAMPLES } from './data/firmwareSamples'
import { analyzeFirmwareCode } from './services/analyzer'
import { applyTemplateFix, refinePatchWithConstraint, generateCheatingPatch } from './services/repairEngine'
import { verifyPatchCandidate } from './services/verifier'
import { calculateIoTMetrics, buildExplainabilityReport } from './services/metrics'

export default function App() {
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
  const [terminalLogs, setTerminalLogs] = useState([])
  const [chatHistory, setChatHistory] = useState([])

  // Modals
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false)
  const [showCheatingDemo, setShowCheatingDemo] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)

  // Sync code whenever active file changes
  useEffect(() => {
    if (activeFile) {
      setCurrentCode(activeFile.code)
      setCandidatePatch(null)
      setIsDiffMode(false)
      setVerificationResult(null)
      setMetrics(null)
      // Automatically scan the new file
      runAnalysis(activeFile.code, activeFile.name)
    }
  }, [activeFileId])

  const addTerminalLog = (step, message, type = 'info') => {
    const time = new Date().toLocaleTimeString()
    setTerminalLogs(prev => [...prev.slice(-80), { time, step, message, type }])
  }

  // ── M1: Analysis ─────────────────────────────────────────────────────────────
  const runAnalysis = (sourceCode = currentCode, filename = activeFile?.name) => {
    addTerminalLog('M1_SCAN', `Initiating static analysis on ${filename}...`)
    const findings = analyzeFirmwareCode(sourceCode, filename)
    setVulnerabilities(findings)
    setActiveVuln(findings[0] || null)

    if (findings.length > 0) {
      addTerminalLog('M1_SCAN', `Detected ${findings.length} security findings in ${filename}.`, 'warning')
    } else {
      addTerminalLog('M1_SCAN', `Firmware ${filename} verified clean of pattern-based vulnerabilities.`, 'success')
    }
    return findings
  }

  // ── M2: Fix with AI / Quick-Fix ───────────────────────────────────────────────
  const handleTriggerQuickFix = (vuln = vulnerabilities[0]) => {
    if (!vuln) return
    addTerminalLog('M2_REPAIR', `Querying tier repair engine for ${vuln.cwe_id} (${vuln.vuln_type})...`)

    const patch = applyTemplateFix(vuln, currentCode)
    if (patch) {
      setCandidatePatch(patch)
      setIsDiffMode(true)
      addTerminalLog('M2_REPAIR', `Synthesized remediation patch using strategy '${patch.strategy}'.`, 'success')
      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          text: `I synthesized a remediation for ${vuln.vuln_type} (${vuln.cwe_id}):\n${patch.explanation}\n\nReview the diff above and click "Accept & Verify" to apply it to your firmware buffer.`,
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
    addTerminalLog('BUFFER', 'Candidate patch merged into firmware working buffer.', 'info')

    // Record patch
    setAppliedPatches(prev => [...prev, candidatePatch])

    // Run verification on the newly applied patch
    runVerification(candidatePatch, newCode)
    setCandidatePatch(null)
  }

  const handleRejectPatch = () => {
    addTerminalLog('M2_REPAIR', 'Candidate patch rejected by user.', 'warning')
    setCandidatePatch(null)
    setIsDiffMode(false)
  }

  // ── M3: Verification ─────────────────────────────────────────────────────────
  const runVerification = (patch = candidatePatch, codeToVerify = currentCode) => {
    setIsVerifying(true)
    addTerminalLog('M3_VERIFY', 'Launching verification sandbox (GCC -Wall -Wextra + ASan + UBSan)...')

    setTimeout(() => {
      const targetVuln = activeVuln || vulnerabilities[0] || activeFile
      const ver = verifyPatchCandidate(patch, targetVuln, codeToVerify)
      setVerificationResult(ver)
      setVerificationsHistory(prev => [...prev, ver])

      // Re-scan code to update vulnerability markers
      const remainingVulns = analyzeFirmwareCode(codeToVerify, activeFile?.name)
      setVulnerabilities(remainingVulns)

      // Calculate M4 metrics
      const calculatedMetrics = calculateIoTMetrics(activeFile?.code, codeToVerify, 1)
      setMetrics(calculatedMetrics)

      const expl = buildExplainabilityReport(
        [targetVuln],
        [patch || { strategy: 'manual', explanation: 'Manual buffer modification', patched_code: '' }],
        [ver],
        calculatedMetrics
      )
      setReportExplanation(expl)

      if (ver.overall_status === 'passed') {
        addTerminalLog('M3_VERIFY', 'Verification PASSED: Compilation clean, ASan verified, No-Cheat passed.', 'success')
      } else {
        addTerminalLog('M3_VERIFY', `Verification FAILED: ${ver.errors.join('; ')}`, 'error')
      }

      setIsVerifying(false)
    }, 350)
  }

  // ── Conversational Refinement (ChatRefine) ──────────────────────────────────
  const handleSendConstraint = (constraint) => {
    addTerminalLog('CHAT_REFINE', `Applying constraint: "${constraint}"...`)
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
      addTerminalLog('CHAT_REFINE', `Refined patch synthesized with constraint: "${constraint}"`, 'success')

      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Refinement synthesized (Attempt #${refined.attempt_number}):\n${refined.explanation}\n\nThe updated diff is ready for side-by-side inspection in Monaco DiffEditor.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ])
    }
  }

  // ── Full Closed-Loop Pipeline ───────────────────────────────────────────────
  const handleRunFullPipeline = async () => {
    setPipelineRunning(true)
    addTerminalLog('PIPELINE', 'Initiating full automated remediation pipeline (M1→M2→M3→M4)...')

    // Step 1: Detect
    await new Promise(r => setTimeout(r, 200))
    const findings = runAnalysis(currentCode, activeFile.name)

    if (findings.length === 0) {
      addTerminalLog('PIPELINE', 'No vulnerabilities detected. Pipeline terminated clean.', 'success')
      setPipelineRunning(false)
      return
    }

    // Step 2: Repair
    await new Promise(r => setTimeout(r, 250))
    const targetVuln = findings[0]
    addTerminalLog('PIPELINE', `Targeting ${targetVuln.cwe_id} at line ${targetVuln.line_start}...`)
    const patch = applyTemplateFix(targetVuln, currentCode)

    if (patch) {
      setCandidatePatch(patch)
      setCurrentCode(patch.full_patched_code)
      setAppliedPatches([patch])

      // Step 3: Verify
      await new Promise(r => setTimeout(r, 300))
      addTerminalLog('PIPELINE', 'Running M3 compilation and AddressSanitizer verification...')
      const ver = verifyPatchCandidate(patch, targetVuln, patch.full_patched_code)
      setVerificationResult(ver)
      setVerificationsHistory([ver])

      // Re-scan
      const remaining = analyzeFirmwareCode(patch.full_patched_code, activeFile.name)
      setVulnerabilities(remaining)

      // Step 4: Metrics & Report
      await new Promise(r => setTimeout(r, 200))
      const calculatedMetrics = calculateIoTMetrics(activeFile.code, patch.full_patched_code, 1)
      setMetrics(calculatedMetrics)

      const expl = buildExplainabilityReport([targetVuln], [patch], [ver], calculatedMetrics)
      setReportExplanation(expl)

      addTerminalLog('PIPELINE', 'Pipeline successfully completed. Verified patch ready.', 'success')
      setShowReportModal(true)
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
        addTerminalLog('UPLOAD', `Loaded firmware file ${file.name} (${content.length} bytes)`, 'success')
      }
      reader.readAsText(file)
    })
  }

  const handleNewFile = () => {
    const filename = `custom_firmware_${files.length + 1}.c`
    const skeleton = `/*
 * IoT Device Firmware Routine
 */
#include <stdio.h>
#include <string.h>

void handle_packet(const char *input) {
    char buffer[64];
    // Write your firmware logic here
    printf("[iot] Ready\\n");
}

int main(void) {
    handle_packet("test");
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
    addTerminalLog('EDITOR', `Created new firmware workspace file: ${filename}`, 'info')
  }

  const handleSelectVuln = (vuln) => {
    setActiveVuln(vuln)
    handleTriggerQuickFix(vuln)
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <Header
        activeFile={activeFile}
        onRunAnalysis={() => runAnalysis(currentCode, activeFile.name)}
        onRunFullPipeline={handleRunFullPipeline}
        onOpenCheatingDemo={() => setShowCheatingDemo(true)}
        onOpenReport={() => setShowReportModal(true)}
        onOpenBenchmark={() => setShowBenchmarkModal(true)}
        onOpenProviderModal={() => setShowProviderModal(true)}
        provider={provider}
        vulnStats={{
          total: vulnerabilities.length,
          critical: vulnerabilities.filter(v => v.severity === 'Critical').length,
          high: vulnerabilities.filter(v => v.severity === 'High').length
        }}
        pipelineRunning={pipelineRunning}
      />

      {/* Main IDE Workspace: FileTree | Monaco Editor | VerifyPanel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Tree & Findings Drawer */}
        <FileTree
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onFileUpload={handleFileUpload}
          onNewFile={handleNewFile}
          vulnerabilities={vulnerabilities}
          onSelectVuln={handleSelectVuln}
        />

        {/* Center: Monaco C/C++ Code & Diff Editor */}
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

        {/* Right Sidebar: Compile & Verify (M3) + IoT Metrics (M4) */}
        <VerifyPanel
          verificationResult={verificationResult}
          metrics={metrics}
          onRunVerify={() => runVerification(candidatePatch, currentCode)}
          isVerifying={isVerifying}
        />
      </div>

      {/* Bottom Collapsible Console: AI ChatRefine & Terminal Stream */}
      <BottomConsole
        terminalLogs={terminalLogs}
        onClearLogs={() => setTerminalLogs([])}
        onSendConstraint={handleSendConstraint}
        chatHistory={chatHistory}
        activeVuln={activeVuln}
        currentPatch={candidatePatch}
      />

      {/* Modals */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        activeFile={activeFile}
        vulnerabilities={vulnerabilities}
        patches={appliedPatches.length > 0 ? appliedPatches : candidatePatch ? [candidatePatch] : []}
        verifications={verificationsHistory.length > 0 ? verificationsHistory : verificationResult ? [verificationResult] : []}
        metrics={metrics}
        explanation={reportExplanation}
      />

      <BenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
      />

      <CheatingDemoModal
        isOpen={showCheatingDemo}
        onClose={() => setShowCheatingDemo(false)}
      />

      <ProviderModal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        currentProvider={provider}
        onSelectProvider={(p) => {
          setProvider(p)
          addTerminalLog('PROVIDER', `Switched LLM synthesis backend to: ${p}`, 'info')
        }}
      />
    </div>
  )
}
