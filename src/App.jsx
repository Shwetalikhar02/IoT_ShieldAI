import React, { useState, useEffect } from 'react'
import IDELayout, { WelcomePage } from './components/IDELayout'
import EditorView from './components/EditorView'
import LandingPage from './components/LandingPage'
import AuthModal from './components/AuthModal'
import ProjectCreateModal from './components/ProjectCreateModal'

// Views
import OverviewView from './components/views/OverviewView'
import ProjectsView from './components/views/ProjectsView'
import FindingsView from './components/views/FindingsView'
import CodeReviewView from './components/views/CodeReviewView'
import RepairWorkbenchView from './components/views/RepairWorkbenchView'
import VerificationConsoleView from './components/views/VerificationConsoleView'
import ReportsView from './components/views/ReportsView'
import UserReviewsView from './components/views/UserReviewsView'
import SettingsView from './components/views/SettingsView'
import ProfileView from './components/views/ProfileView'

// Modals
import BenchmarkModal from './components/BenchmarkModal'
import CheatingDemoModal from './components/CheatingDemoModal'

// APIs & Services
import { authApi, projectsApi, reviewsApi } from './services/api'
import { FIRMWARE_SAMPLES } from './data/firmwareSamples'
import { analyzeFirmwareCode } from './services/analyzer'
import { applyTemplateFix, refinePatchWithConstraint } from './services/repairEngine'
import { verifyPatchCandidate } from './services/verifier'
import { calculateIoTMetrics, buildExplainabilityReport } from './services/metrics'

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')

  // Navigation View State
  // 'overview' | 'projects' | 'explorer' | 'findings' | 'repair' | 'assistant' | 'verify' | 'reports' | 'reviews' | 'settings' | 'profile'
  const [activeView, setActiveView] = useState('overview')

  // Projects State
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)

  // Files & Editor State
  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const activeFile = files.find(f => f.id === activeFileId) || files[0]
  const [currentCode, setCurrentCode] = useState('')

  // Analysis & Vulnerability State (M1)
  const [vulnerabilities, setVulnerabilities] = useState([])
  const [activeVuln, setActiveVuln] = useState(null)

  // Repair & Code Review State (M2)
  const [candidatePatch, setCandidatePatch] = useState(null)
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [appliedPatches, setAppliedPatches] = useState([])
  const [appliedReviews, setAppliedReviews] = useState([])

  // Verification State (M3)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationsHistory, setVerificationsHistory] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)

  // Metrics & Reporting State (M4)
  const [metrics, setMetrics] = useState(null)
  const [reportExplanation, setReportExplanation] = useState('')

  // UI state
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [provider, setProvider] = useState('Google Gemini 2.5 Flash')
  const [chatHistory, setChatHistory] = useState([])

  // Modals
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false)
  const [showCheatingDemo, setShowCheatingDemo] = useState(false)

  // 1. Initial Authentication Check
  useEffect(() => {
    checkAuthSession()
  }, [])

  const checkAuthSession = async () => {
    setAuthLoading(true)
    try {
      const data = await authApi.getMe()
      if (data?.user) {
        setCurrentUser(data.user)
        await loadUserProjects(data.user.id)
      }
    } catch (err) {
      setCurrentUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  // 2. Load User Projects
  const loadUserProjects = async (userId) => {
    try {
      const data = await projectsApi.list()
      const list = data?.projects || []
      setProjects(list)
      if (list.length > 0) {
        const targetId = activeProjectId && list.some(p => p.id === activeProjectId)
          ? activeProjectId
          : list[0].id
        setActiveProjectId(targetId)
        await loadProjectDetails(targetId)
      } else {
        // Fallback to sample data if user has no projects
        setFiles(FIRMWARE_SAMPLES)
        setActiveFileId('stack_overflow')
        setCurrentCode(FIRMWARE_SAMPLES[0]?.code || '')
        runLocalAnalysis(FIRMWARE_SAMPLES[0]?.code, FIRMWARE_SAMPLES[0]?.name)
      }
    } catch (err) {
      console.warn('Failed to fetch projects:', err)
      // Fallback to bundled sample data
      setFiles(FIRMWARE_SAMPLES)
      setActiveFileId('stack_overflow')
      setCurrentCode(FIRMWARE_SAMPLES[0]?.code || '')
      runLocalAnalysis(FIRMWARE_SAMPLES[0]?.code, FIRMWARE_SAMPLES[0]?.name)
    }
  }

  // 3. Load Project Details (Files, Findings, Reviews)
  const loadProjectDetails = async (projectId) => {
    try {
      const data = await projectsApi.get(projectId)
      if (data) {
        const projectFiles = data.files || []
        setFiles(projectFiles)
        setVulnerabilities(data.vulnerabilities || [])
        setAppliedPatches(data.patches || [])
        setAppliedReviews(data.reviews || [])
        setVerificationsHistory(data.verifications || [])

        if (projectFiles.length > 0) {
          const first = projectFiles[0]
          setActiveFileId(first.id)
          setCurrentCode(first.code)
          if (data.vulnerabilities?.length > 0) {
            setActiveVuln(data.vulnerabilities[0])
          } else {
            runLocalAnalysis(first.code, first.name)
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load project details:', err)
    }
  }

  // Sync editor buffer when active file changes
  useEffect(() => {
    if (activeFile) {
      setCurrentCode(activeFile.code)
      setCandidatePatch(null)
      setIsDiffMode(false)
      runLocalAnalysis(activeFile.code, activeFile.name)
    }
  }, [activeFileId])

  // ── M1: Analysis ─────────────────────────────────────────────────────────────
  const runLocalAnalysis = (sourceCode = currentCode, filename = activeFile?.name) => {
    const findings = analyzeFirmwareCode(sourceCode, filename)
    setVulnerabilities(findings)
    setActiveVuln(findings[0] || null)
    return findings
  }

  const handleRunScan = async () => {
    if (activeProjectId) {
      setPipelineRunning(true)
      try {
        const res = await projectsApi.scan(activeProjectId)
        setVulnerabilities(res.vulnerabilities || [])
        if (res.vulnerabilities?.length > 0) {
          setActiveVuln(res.vulnerabilities[0])
        }
      } catch (err) {
        runLocalAnalysis(currentCode, activeFile?.name)
      } finally {
        setPipelineRunning(false)
      }
    } else {
      runLocalAnalysis(currentCode, activeFile?.name)
    }
  }

  // ── M2: Fix with AI / Quick-Fix ───────────────────────────────────────────────
  const handleTriggerQuickFix = (vuln = vulnerabilities[0]) => {
    if (!vuln) return
    const patch = applyTemplateFix(
      {
        id: vuln.id,
        cwe_id: vuln.cwe_id || vuln.cweId,
        vuln_type: vuln.vuln_type || vuln.vulnType,
        severity: vuln.severity,
        code_snippet: vuln.code_snippet || vuln.codeSnippet,
        file_path: vuln.file_path || vuln.filePath,
        line_start: vuln.line_start || vuln.lineStart
      },
      currentCode
    )
    if (patch) {
      setCandidatePatch(patch)
      setIsDiffMode(true)
      setActiveVuln(vuln)
      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Synthesized remediation for ${vuln.vuln_type || vuln.vulnType} (${vuln.cwe_id || vuln.cweId}):\n${patch.explanation}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ])
    }
  }

  // ── M5: AI Code Review & Fix Approval ─────────────────────────────────────────
  const handleApprovePatch = async (patch = candidatePatch, vuln = activeVuln, reviewNotes = '') => {
    if (!patch) return
    const newCode = patch.full_patched_code || patch.fullPatchedCode || currentCode

    if (activeProjectId && patch.id) {
      try {
        const res = await projectsApi.submitReview(
          activeProjectId,
          patch.id,
          vuln?.id,
          'approved',
          reviewNotes
        )
        if (res.review) {
          setAppliedReviews(prev => [res.review, ...prev])
        }
        if (res.verification) {
          setVerificationResult(res.verification)
          setVerificationsHistory(prev => [res.verification, ...prev])
        }
      } catch (err) {
        console.warn('Backend review submission failed, applying locally:', err)
      }
    }

    // Apply code locally & execute verification
    setCurrentCode(newCode)
    setIsDiffMode(false)
    setAppliedPatches(prev => [...prev, patch])
    runVerification(patch, newCode)
    setCandidatePatch(null)

    // Mark as resolved in local list
    setVulnerabilities(prev =>
      prev.map(v => (v.id === vuln?.id ? { ...v, status: 'resolved' } : v))
    )
  }

  const handleRejectPatch = async (patch = candidatePatch, vuln = activeVuln, reviewNotes = '') => {
    if (activeProjectId && patch?.id) {
      try {
        const res = await projectsApi.submitReview(
          activeProjectId,
          patch.id,
          vuln?.id,
          'rejected',
          reviewNotes
        )
        if (res.review) setAppliedReviews(prev => [res.review, ...prev])
      } catch (e) {}
    }
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
    const findings = runLocalAnalysis(currentCode, activeFile?.name)

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

      const remaining = analyzeFirmwareCode(patch.full_patched_code, activeFile?.name)
      setVulnerabilities(remaining)

      const calculatedMetrics = calculateIoTMetrics(activeFile?.code, patch.full_patched_code, 1)
      setMetrics(calculatedMetrics)

      const expl = buildExplainabilityReport([targetVuln], [patch], [ver], calculatedMetrics)
      setReportExplanation(expl)
    }

    setPipelineRunning(false)
  }

  // ── Projects CRUD Handlers ───────────────────────────────────────────────────
  const handleCreateProject = async (name, description, targetArch) => {
    try {
      const res = await projectsApi.create(name, description, targetArch)
      if (res?.project) {
        setProjects(prev => [res.project, ...prev])
        setActiveProjectId(res.project.id)
        await loadProjectDetails(res.project.id)
        setActiveView('overview')
      }
    } catch (err) {
      alert(err?.message || 'Failed to create project.')
    }
  }

  const handleUpdateProject = async (id, data) => {
    try {
      const res = await projectsApi.update(id, data)
      if (res?.project) {
        setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...res.project } : p)))
      }
    } catch (err) {
      alert(err?.message || 'Failed to update project.')
    }
  }

  const handleDeleteProject = async (id) => {
    try {
      await projectsApi.delete(id)
      const remaining = projects.filter(p => p.id !== id)
      setProjects(remaining)
      if (activeProjectId === id) {
        if (remaining.length > 0) {
          setActiveProjectId(remaining[0].id)
          await loadProjectDetails(remaining[0].id)
        } else {
          setActiveProjectId(null)
          setFiles([])
        }
      }
    } catch (err) {
      alert(err?.message || 'Failed to delete project.')
    }
  }

  // ── File upload / new file ──────────────────────────────────────────────────
  const handleFileUpload = (uploadedFiles) => {
    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target.result
        if (activeProjectId) {
          try {
            const res = await projectsApi.addFile(activeProjectId, file.name, content, 'firmware')
            if (res.file) {
              setFiles(prev => [...prev, res.file])
              setActiveFileId(res.file.id)
            }
            return
          } catch (err) {}
        }
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

  const handleNewFile = async () => {
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
    if (activeProjectId) {
      try {
        const res = await projectsApi.addFile(activeProjectId, filename, skeleton, 'firmware')
        if (res.file) {
          setFiles(prev => [...prev, res.file])
          setActiveFileId(res.file.id)
        }
        return
      } catch (err) {}
    }

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
    const targetFile = files.find(f => f.name === (vuln.file_path || vuln.filePath))
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

  const handleLogout = async () => {
    await authApi.logout()
    setCurrentUser(null)
    setActiveView('overview')
  }

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0]

  // If session is still loading
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#101310] text-[#F3F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div className="cs-spinner w-6 h-6 border-2" />
          <span className="font-mono text-xs text-[#9AA39B]">Initializing CodeShield AI session...</span>
        </div>
      </div>
    )
  }

  // If user is unauthenticated, show professional Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            if (mode === 'demo') {
              setAuthModalMode('login')
              setShowAuthModal(true)
            } else {
              setAuthModalMode(mode)
              setShowAuthModal(true)
            }
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user)
            setShowAuthModal(false)
            loadUserProjects(user.id)
          }}
        />
      </>
    )
  }

  // ── Render the editor view (for IDE mode) ──
  const renderEditorView = () => (
    <EditorView
      code={currentCode}
      onChangeCode={setCurrentCode}
      activeFile={activeFile}
      vulnerabilities={vulnerabilities}
      activeVuln={activeVuln}
      candidatePatch={candidatePatch}
      onAcceptPatch={handleApprovePatch}
      onRejectPatch={handleRejectPatch}
      onTriggerQuickFix={handleTriggerQuickFix}
      isDiffMode={isDiffMode}
      onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
    />
  )

  // ── Render the active non-editor view ──
  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <WelcomePage />

      case 'projects':
        return (
          <ProjectsView
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => {
              setActiveProjectId(id)
              loadProjectDetails(id)
              setActiveView('overview')
            }}
            onCreateProject={() => setShowProjectModal(true)}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        )

      case 'findings':
        return (
          <FindingsView
            vulnerabilities={vulnerabilities}
            onInspectVuln={handleInspectVuln}
            onTriggerFix={handleTriggerFixFromView}
          />
        )

      case 'repair':
        return (
          <CodeReviewView
            vulnerabilities={vulnerabilities}
            activeVuln={activeVuln}
            candidatePatch={candidatePatch}
            appliedReviews={appliedReviews}
            onApproveFix={handleApprovePatch}
            onRejectFix={handleRejectPatch}
            onGenerateFix={handleTriggerQuickFix}
            onRequestRefinement={handleSendConstraint}
            onRunVerification={() => runVerification(candidatePatch, currentCode)}
            isVerifying={isVerifying}
            verificationResult={verificationResult}
            onSelectVuln={setActiveVuln}
          />
        )

      case 'assistant':
        return (
          <div className="flex-1 h-full p-6 flex flex-col bg-[#101310]">
            <div className="max-w-4xl w-full mx-auto flex-1 rounded-2xl overflow-hidden border border-[#2B332D] shadow-2xl flex flex-col">
              <SecurityInsightsPanelWrapper
                activeFile={activeFile}
                vulnerabilities={vulnerabilities}
                activeVuln={activeVuln}
                candidatePatch={candidatePatch}
                verificationResult={verificationResult}
                metrics={metrics}
                onTriggerQuickFix={handleTriggerQuickFix}
                onRunVerify={() => runVerification(candidatePatch, currentCode)}
                isVerifying={isVerifying}
                projectId={activeProjectId}
                defaultTab="assistant"
              />
            </div>
          </div>
        )

      case 'verify':
        return (
          <VerificationConsoleView
            verificationResult={verificationResult}
            onRunVerify={() => runVerification(candidatePatch, currentCode)}
            isVerifying={isVerifying}
            onOpenCheatingDemo={() => setShowCheatingDemo(true)}
          />
        )

      case 'reports':
        return (
          <ReportsView
            activeProject={activeProject}
            activeFile={activeFile}
            vulnerabilities={vulnerabilities}
            patches={appliedPatches.length > 0 ? appliedPatches : candidatePatch ? [candidatePatch] : []}
            verifications={verificationsHistory.length > 0 ? verificationsHistory : verificationResult ? [verificationResult] : []}
            reviews={appliedReviews}
            metrics={metrics}
            explanation={reportExplanation}
          />
        )

      case 'reviews':
        return <UserReviewsView currentUser={currentUser} />

      case 'profile':
        return (
          <ProfileView
            currentUser={currentUser}
            projects={projects}
            onUpdateUser={setCurrentUser}
            onLogout={handleLogout}
          />
        )

      case 'settings':
        return (
          <SettingsView
            currentProvider={provider}
            onSelectProvider={setProvider}
          />
        )

      default:
        return <WelcomePage />
    }
  }

  // Authenticated IDE Experience
  return (
    <>
      <IDELayout
        // Auth
        currentUser={currentUser}
        onLogout={handleLogout}

        // Navigation
        activeView={activeView}
        onSelectView={setActiveView}

        // Projects
        activeProject={activeProject}
        projects={projects}
        onSelectProject={(id) => {
          setActiveProjectId(id)
          loadProjectDetails(id)
        }}
        onCreateProject={() => setShowProjectModal(true)}

        // Files
        files={files}
        activeFileId={activeFileId}
        activeFile={activeFile}
        onSelectFile={setActiveFileId}
        onFileUpload={handleFileUpload}
        onNewFile={handleNewFile}

        // Editor
        currentCode={currentCode}
        onChangeCode={setCurrentCode}
        candidatePatch={candidatePatch}
        isDiffMode={isDiffMode}
        onToggleDiffMode={() => setIsDiffMode(!isDiffMode)}
        onAcceptPatch={handleApprovePatch}
        onRejectPatch={handleRejectPatch}

        // Analysis
        vulnerabilities={vulnerabilities}
        activeVuln={activeVuln}
        onTriggerQuickFix={handleTriggerQuickFix}
        onInspectVuln={handleInspectVuln}

        // Pipeline
        pipelineRunning={pipelineRunning}
        onRunScan={handleRunScan}
        onRunPipeline={handleRunPipeline}

        // Verification
        verificationResult={verificationResult}
        isVerifying={isVerifying}
        onRunVerify={() => runVerification(candidatePatch, currentCode)}

        // Metrics
        metrics={metrics}

        // Modals
        onOpenBenchmark={() => setShowBenchmarkModal(true)}
        onOpenCheatingDemo={() => setShowCheatingDemo(true)}

        // Project ID
        projectId={activeProjectId}

        // View Renderers
        renderEditorView={renderEditorView}
        renderActiveView={renderActiveView}
      />

      {/* Modals */}
      <ProjectCreateModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreate={handleCreateProject}
      />

      <BenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
      />

      <CheatingDemoModal
        isOpen={showCheatingDemo}
        onClose={() => setShowCheatingDemo(false)}
      />
    </>
  )
}

// Lazy wrapper for SecurityInsightsPanel to avoid circular dependency
function SecurityInsightsPanelWrapper(props) {
  const [Panel, setPanel] = useState(null)

  useEffect(() => {
    import('./components/SecurityInsightsPanel').then(mod => {
      setPanel(() => mod.default)
    })
  }, [])

  if (!Panel) return <div className="flex-1 flex items-center justify-center text-[#626D64] text-xs">Loading assistant...</div>
  return <Panel {...props} />
}
