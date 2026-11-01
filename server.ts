import express, { Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import bcrypt from 'bcryptjs'
import { createServer as createViteServer } from 'vite'
import { db, User } from './src/server/db'
import { requireAuth, generateToken, setAuthCookie, clearAuthCookie, AuthenticatedRequest } from './src/server/auth'
import { askGeminiSecurityAssistant } from './src/server/gemini'

// Reuse pure analysis & verification engines
import { analyzeFirmwareCode } from './src/services/analyzer'
import { applyTemplateFix, refinePatchWithConstraint, generateUnifiedDiff } from './src/services/repairEngine'
import { verifyPatchCandidate } from './src/services/verifier'
import { calculateIoTMetrics, buildExplainabilityReport } from './src/services/metrics'

const app = express()
const PORT = 3000
const HOST = '0.0.0.0'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '15mb' }))
app.use(cookieParser())

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword, agreeTerms } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }

    const existing = db.findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = db.createUser(name.trim(), email.trim(), hash)

    // Automatically create a default starter project with sample firmware for the new user
    const defaultProj = db.createProject(
      user.id,
      'My First Firmware Project',
      'Sample IoT Sensor Firmware initialized for vulnerability detection and verification.',
      'ARM Cortex-M4'
    )

    // Populate with 2 starter files
    db.addFile(
      defaultProj.id,
      user.id,
      'sensor_driver.c',
      `/*
 * IoT Sensor Driver — Cortex-M4
 */
#include <stdio.h>
#include <string.h>

void process_sensor_id(const char *raw_id) {
    char id_buffer[32];
    // Unsafe string copy
    strcpy(id_buffer, raw_id);
    printf("[sensor] Processed ID: %s\\n", id_buffer);
}

int main(void) {
    process_sensor_id("SEN-NODE-9901-ACTIVE");
    return 0;
}`,
      'embedded_driver'
    )

    db.addFile(
      defaultProj.id,
      user.id,
      'telemetry_alloc.c',
      `/*
 * Sensor Reading Allocator
 */
#include <stdio.h>
#include <stdlib.h>

void* allocate_reading(size_t sz) {
    void *buf = malloc(sz);
    // Unchecked dereference
    return buf;
}

int main(void) {
    void *m = allocate_reading(64);
    if (m) free(m);
    return 0;
}`,
      'firmware'
    )

    const token = generateToken(user)
    setAuthCookie(res, token)

    return res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (err: any) {
    console.error('[Register Error]', err)
    return res.status(500).json({ error: 'Failed to create user account. Please try again.' })
  }
})

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = db.findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' })
    }

    const token = generateToken(user)
    setAuthCookie(res, token)

    return res.json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (err: any) {
    console.error('[Login Error]', err)
    return res.status(500).json({ error: 'Authentication service encountered an unexpected error.' })
  }
})

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  })
})

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  clearAuthCookie(res)
  return res.json({ message: 'Logged out successfully.' })
})

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { email, newPassword } = req.body
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' })
  }

  const user = db.findUserByEmail(email)
  if (!user) {
    // Return friendly generic message to prevent account enumeration
    return res.json({ message: 'If an account exists for this email, your password has been reset.' })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  db.updateUser(user.id, { passwordHash: hash })
  return res.json({ message: 'Password has been successfully updated. You can now log in.' })
})

// PUT /api/auth/profile
app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty.' })
  }
  const updated = db.updateUser(req.user!.id, { name: name.trim() })
  return res.json({
    message: 'Profile updated.',
    user: {
      id: updated!.id,
      name: updated!.name,
      email: updated!.email,
      createdAt: updated!.createdAt
    }
  })
})

// PUT /api/auth/password
app.put('/api/auth/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' })
  }

  const isMatch = await bcrypt.compare(currentPassword, req.user!.passwordHash)
  if (!isMatch) {
    return res.status(401).json({ error: 'Current password is incorrect.' })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  db.updateUser(req.user!.id, { passwordHash: hash })
  return res.json({ message: 'Password updated successfully.' })
})

// DELETE /api/auth/account
app.delete('/api/auth/account', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { confirmationText } = req.body
  if (confirmationText !== 'DELETE') {
    return res.status(400).json({ error: 'Please type DELETE to confirm account removal.' })
  }
  const deleted = db.deleteUser(req.user!.id)
  clearAuthCookie(res)
  return res.json({ message: 'Account and associated projects successfully removed.' })
})

// -------------------------------------------------------------
// 2. PROJECT MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// GET /api/projects
app.get('/api/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projects = db.getProjectsByUser(userId)

  // Attach enriched summaries (file count, vulnerability count, verified count)
  const enriched = projects.map(p => {
    const files = db.getFilesByProject(p.id, userId)
    const vulns = db.getVulnerabilitiesByProject(p.id, userId)
    const verifications = db.getVerificationsByProject(p.id, userId)
    const passedVerifications = verifications.filter(v => v.overallStatus === 'passed').length

    return {
      ...p,
      fileCount: files.length,
      vulnerabilityCount: vulns.filter(v => v.status !== 'resolved').length,
      criticalCount: vulns.filter(v => v.severity === 'Critical' && v.status !== 'resolved').length,
      highCount: vulns.filter(v => v.severity === 'High' && v.status !== 'resolved').length,
      verifiedCount: passedVerifications
    }
  })

  return res.json({ projects: enriched })
})

// POST /api/projects
app.post('/api/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const { name, description, targetArch } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required.' })
  }

  const project = db.createProject(
    userId,
    name.trim(),
    (description || '').trim(),
    targetArch || 'ARM Cortex-M4'
  )

  // Add initial starter file
  db.addFile(
    project.id,
    userId,
    'main.c',
    `/*
 * ${name.trim()} — Embedded Firmware Entry
 * Architecture: ${targetArch || 'ARM Cortex-M4'}
 */
#include <stdio.h>
#include <string.h>

void init_subsystems(void) {
    printf("[boot] Initializing IoT firmware stack...\\n");
}

int main(void) {
    init_subsystems();
    return 0;
}`,
    'firmware'
  )

  return res.status(201).json({ project })
})

// GET /api/projects/:id
app.get('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  const files = db.getFilesByProject(projectId, userId)
  const vulnerabilities = db.getVulnerabilitiesByProject(projectId, userId)
  const patches = db.getPatchesByProject(projectId, userId)
  const reviews = db.getCodeReviewsByProject(projectId, userId)
  const verifications = db.getVerificationsByProject(projectId, userId)

  return res.json({
    project,
    files,
    vulnerabilities,
    patches,
    reviews,
    verifications
  })
})

// PUT /api/projects/:id
app.put('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  const { name, description, targetArch } = req.body

  const updated = db.updateProject(projectId, userId, {
    ...(name ? { name: name.trim() } : {}),
    ...(description !== undefined ? { description: description.trim() } : {}),
    ...(targetArch ? { targetArch } : {})
  })

  if (!updated) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  return res.json({ project: updated })
})

// DELETE /api/projects/:id
app.delete('/api/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id

  const deleted = db.deleteProject(projectId, userId)
  if (!deleted) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  return res.json({ message: 'Project deleted successfully.' })
})

// -------------------------------------------------------------
// 3. PROJECT FILES ENDPOINTS
// -------------------------------------------------------------

// POST /api/projects/:id/files
app.post('/api/projects/:id/files', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  const { name, code, category } = req.body

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'File name is required.' })
  }

  const file = db.addFile(
    projectId,
    userId,
    name.trim(),
    code || '// C Firmware Source\n',
    category || 'firmware'
  )

  return res.status(201).json({ file })
})

// PUT /api/projects/:id/files/:fileId
app.put('/api/projects/:id/files/:fileId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const { fileId } = req.params
  const { name, code, category } = req.body

  const updated = db.updateFile(fileId, userId, {
    ...(name ? { name: name.trim() } : {}),
    ...(code !== undefined ? { code } : {}),
    ...(category ? { category } : {})
  })

  if (!updated) {
    return res.status(404).json({ error: 'File not found.' })
  }

  return res.json({ file: updated })
})

// DELETE /api/projects/:id/files/:fileId
app.delete('/api/projects/:id/files/:fileId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const { fileId } = req.params

  const deleted = db.deleteFile(fileId, userId)
  if (!deleted) {
    return res.status(404).json({ error: 'File not found.' })
  }

  return res.json({ message: 'File deleted.' })
})

// -------------------------------------------------------------
// 4. SCAN, REPAIR, REVIEW & VERIFICATION
// -------------------------------------------------------------

// POST /api/projects/:id/scan
app.post('/api/projects/:id/scan', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  const files = db.getFilesByProject(projectId, userId)
  const allFindings: any[] = []

  files.forEach(f => {
    const fileFindings = analyzeFirmwareCode(f.code, f.name)
    fileFindings.forEach((finding, idx) => {
      // Prioritization calculation (CVSS 3.1 heuristic alignment)
      let priorityRank = 3 // default
      let impact = 'Potential stability or data anomaly'
      if (finding.severity === 'Critical') {
        priorityRank = 1
        impact = 'Remote code execution or control-flow hijacking via buffer corruption'
      } else if (finding.severity === 'High') {
        priorityRank = 2
        impact = 'Denial of service or memory disclosure on target microcontroller'
      }

      allFindings.push({
        id: `vuln_${f.id}_${idx + 1}_${Date.now() % 10000}`,
        filePath: f.name,
        lineStart: finding.line_start,
        lineEnd: finding.line_end,
        cweId: finding.cwe_id,
        vulnType: finding.vuln_type,
        severity: finding.severity,
        description: finding.description,
        rootCause: finding.root_cause,
        fixAdvice: finding.fix_advice,
        codeSnippet: finding.code_snippet,
        functionName: finding.function_name,
        priorityRank,
        impactAnalysis: impact,
        status: 'open',
        createdAt: new Date().toISOString()
      })
    })
  })

  const stored = db.setProjectVulnerabilities(projectId, userId, allFindings)

  return res.json({
    total: stored.length,
    criticalCount: stored.filter(v => v.severity === 'Critical').length,
    highCount: stored.filter(v => v.severity === 'High').length,
    vulnerabilities: stored
  })
})

// POST /api/projects/:id/repair
app.post('/api/projects/:id/repair', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  const { vulnerabilityId, constraint } = req.body

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  const vulns = db.getVulnerabilitiesByProject(projectId, userId)
  const targetVuln = vulns.find(v => v.id === vulnerabilityId) || vulns[0]

  if (!targetVuln) {
    return res.status(404).json({ error: 'Target vulnerability not found.' })
  }

  const files = db.getFilesByProject(projectId, userId)
  const file = files.find(f => f.name === targetVuln.filePath) || files[0]

  if (!file) {
    return res.status(404).json({ error: 'Source file not found.' })
  }

  // Format vuln object for repair engine
  const vulnObj = {
    id: targetVuln.id,
    cwe_id: targetVuln.cweId,
    vuln_type: targetVuln.vulnType,
    severity: targetVuln.severity,
    code_snippet: targetVuln.codeSnippet,
    file_path: targetVuln.filePath,
    line_start: targetVuln.lineStart
  }

  let patch = applyTemplateFix(vulnObj, file.code)

  if (patch && constraint && constraint.trim()) {
    patch = refinePatchWithConstraint(patch, constraint.trim(), file.code, vulnObj)
  }

  if (!patch) {
    return res.status(422).json({ error: 'Unable to synthesize deterministic patch for this CWE pattern.' })
  }

  // Save to DB
  const saved = db.savePatch({
    projectId,
    userId,
    vulnerabilityId: targetVuln.id,
    strategy: (patch.strategy as any) || 'template',
    originalCode: patch.original_code,
    patchedCode: patch.patched_code,
    fullPatchedCode: patch.full_patched_code,
    diff: patch.diff,
    explanation: patch.explanation,
    attemptNumber: patch.attempt_number || 1,
    modelUsed: patch.model_used || 'CodeShield-Synthesizer'
  })

  return res.json({ patch: saved })
})

// POST /api/projects/:id/reviews
app.post('/api/projects/:id/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  const { patchId, vulnerabilityId, decision, reviewNotes } = req.body

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  const patches = db.getPatchesByProject(projectId, userId)
  const patch = patches.find(p => p.id === patchId)
  if (!patch) {
    return res.status(404).json({ error: 'Patch not found.' })
  }

  const reviewRecord = db.saveCodeReview({
    projectId,
    userId,
    patchId,
    vulnerabilityId: vulnerabilityId || patch.vulnerabilityId,
    decision: decision || 'approved',
    reviewNotes
  })

  let verificationResult = null

  // If approved, safely apply fix to file AND run verification suite
  if (decision === 'approved') {
    const vulns = db.getVulnerabilitiesByProject(projectId, userId)
    const targetVuln = vulns.find(v => v.id === patch.vulnerabilityId)
    const files = db.getFilesByProject(projectId, userId)
    const file = files.find(f => f.name === (targetVuln?.filePath || ''))

    if (file && patch.fullPatchedCode) {
      db.updateFile(file.id, userId, { code: patch.fullPatchedCode })
    }

    // Run real verification on the patched code
    const ver = verifyPatchCandidate(
      {
        id: patch.id,
        original_code: patch.originalCode,
        patched_code: patch.patchedCode,
        full_patched_code: patch.fullPatchedCode
      },
      targetVuln
        ? {
            id: targetVuln.id,
            cwe_id: targetVuln.cweId,
            code_snippet: targetVuln.codeSnippet,
            file_path: targetVuln.filePath,
            line_start: targetVuln.lineStart
          }
        : null,
      patch.fullPatchedCode
    )

    verificationResult = db.saveVerification({
      projectId,
      userId,
      patchId: patch.id,
      vulnerabilityId: patch.vulnerabilityId,
      compiles: ver.compiles,
      sanitizerPassed: ver.sanitizer_passed,
      noCheatingPassed: ver.no_cheating_passed,
      equivalencePassed: ver.equivalence_passed,
      overallStatus: ver.overall_status,
      errors: ver.errors || [],
      violations: ver.violations || [],
      asanLog: ver.asan_log,
      compilerOutput: ver.compiler_output
    })

    // Mark vulnerability as resolved if verification passes
    if (ver.overall_status === 'passed') {
      db.updateVulnerabilityStatus(patch.vulnerabilityId, userId, 'resolved')
    }
  }

  return res.json({
    review: reviewRecord,
    verification: verificationResult,
    message: decision === 'approved' ? 'Patch approved and applied to firmware file.' : 'Patch rejected.'
  })
})

// POST /api/projects/:id/verify
app.post('/api/projects/:id/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  const { patchId, fileId } = req.body

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  const patches = db.getPatchesByProject(projectId, userId)
  const patch = patches.find(p => p.id === patchId) || patches[patches.length - 1]

  const files = db.getFilesByProject(projectId, userId)
  const file = files.find(f => f.id === fileId) || files[0]

  const codeToVerify = patch?.fullPatchedCode || file?.code || ''
  const vulns = db.getVulnerabilitiesByProject(projectId, userId)
  const targetVuln = vulns.find(v => v.id === patch?.vulnerabilityId) || vulns[0]

  const ver = verifyPatchCandidate(
    patch
      ? {
          id: patch.id,
          original_code: patch.originalCode,
          patched_code: patch.patchedCode,
          full_patched_code: patch.fullPatchedCode
        }
      : null,
    targetVuln
      ? {
          id: targetVuln.id,
          cwe_id: targetVuln.cweId,
          code_snippet: targetVuln.codeSnippet,
          file_path: targetVuln.filePath,
          line_start: targetVuln.lineStart
        }
      : null,
    codeToVerify
  )

  const verificationRecord = db.saveVerification({
    projectId,
    userId,
    patchId: patch?.id || `patch_manual_${Date.now()}`,
    vulnerabilityId: targetVuln?.id || 'manual_check',
    compiles: ver.compiles,
    sanitizerPassed: ver.sanitizer_passed,
    noCheatingPassed: ver.no_cheating_passed,
    equivalencePassed: ver.equivalence_passed,
    overallStatus: ver.overall_status,
    errors: ver.errors || [],
    violations: ver.violations || [],
    asanLog: ver.asan_log,
    compilerOutput: ver.compiler_output
  })

  // Calculate metrics
  const originalCode = file?.code || codeToVerify
  const metrics = calculateIoTMetrics(originalCode, codeToVerify, 1)

  return res.json({
    verification: verificationRecord,
    metrics
  })
})

// GET /api/projects/:id/report
app.get('/api/projects/:id/report', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id

  const project = db.getProjectById(projectId, userId)
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' })
  }

  const files = db.getFilesByProject(projectId, userId)
  const vulnerabilities = db.getVulnerabilitiesByProject(projectId, userId)
  const patches = db.getPatchesByProject(projectId, userId)
  const reviews = db.getCodeReviewsByProject(projectId, userId)
  const verifications = db.getVerificationsByProject(projectId, userId)

  const activeVulns = vulnerabilities.filter(v => v.status !== 'resolved')
  const resolvedVulns = vulnerabilities.filter(v => v.status === 'resolved')
  const approvedReviews = reviews.filter(r => r.decision === 'approved')
  const passedVerifications = verifications.filter(v => v.overallStatus === 'passed')

  const metrics = calculateIoTMetrics(
    files[0]?.code || '',
    patches[0]?.fullPatchedCode || files[0]?.code || '',
    patches.length || 1
  )

  return res.json({
    project,
    summary: {
      filesScanned: files.length,
      totalFindings: vulnerabilities.length,
      criticalFindings: vulnerabilities.filter(v => v.severity === 'Critical').length,
      highFindings: vulnerabilities.filter(v => v.severity === 'High').length,
      mediumFindings: vulnerabilities.filter(v => v.severity === 'Medium').length,
      resolvedFindings: resolvedVulns.length,
      pendingFindings: activeVulns.length,
      fixesSuggested: patches.length,
      fixesApproved: approvedReviews.length,
      fixesVerified: passedVerifications.length,
      failedVerificationChecks: verifications.filter(v => v.overallStatus === 'failed').length
    },
    metrics,
    files,
    vulnerabilities,
    patches,
    reviews,
    verifications
  })
})

// -------------------------------------------------------------
// 5. AI SECURITY ASSISTANT (GEMINI 3.8 FLASH)
// -------------------------------------------------------------

// POST /api/ai/assistant
app.post('/api/ai/assistant', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const { query, projectId, context, consentProvided } = req.body

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query prompt cannot be empty.' })
    }

    if (!consentProvided) {
      return res.status(403).json({
        error: 'Privacy safeguard: User consent required before submitting code context to the AI assistant.'
      })
    }

    // Retrieve previous conversation
    const historyRecords = projectId ? db.getChatMessages(projectId, userId) : []
    const chatHistory = historyRecords.map(h => ({
      role: h.role as 'user' | 'assistant',
      text: h.text
    }))

    // Query Gemini 3.8 Flash server-side
    const answer = await askGeminiSecurityAssistant(query.trim(), context || {}, chatHistory)

    // Save to DB if projectId provided
    if (projectId) {
      db.addChatMessage(projectId, userId, 'user', query.trim(), context?.codeSnippet)
      db.addChatMessage(projectId, userId, 'assistant', answer)
    }

    return res.json({
      answer,
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[AI Assistant Error]', err)
    return res.status(500).json({ error: 'Failed to generate AI security assessment.' })
  }
})

// GET /api/projects/:id/chats
app.get('/api/projects/:id/chats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  const messages = db.getChatMessages(projectId, userId)
  return res.json({ messages })
})

// DELETE /api/projects/:id/chats
app.delete('/api/projects/:id/chats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const projectId = req.params.id
  db.clearChatMessages(projectId, userId)
  return res.json({ message: 'Chat history cleared.' })
})

// -------------------------------------------------------------
// 6. REVIEWS & FEEDBACK (COMMUNITY & PRODUCT)
// -------------------------------------------------------------

// GET /api/reviews
app.get('/api/reviews', (req: Request, res: Response) => {
  const reviews = db.getAllUserReviews()
  const total = reviews.length
  const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '5.0'

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => {
    if (counts[r.rating] !== undefined) counts[r.rating]++
  })

  return res.json({
    reviews,
    stats: {
      total,
      averageRating: parseFloat(avg),
      distribution: counts
    }
  })
})

// POST /api/reviews
app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!
  const { rating, title, feedback, category } = req.body

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' })
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Review title is required.' })
  }

  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ error: 'Review written feedback is required.' })
  }

  const review = db.createUserReview(
    user.id,
    user.name,
    user.email,
    rating,
    title.trim(),
    feedback.trim(),
    category || 'Overall Experience'
  )

  return res.status(201).json({ review })
})

// PUT /api/reviews/:id
app.put('/api/reviews/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params
  const { rating, title, feedback, category } = req.body

  const review = db.getUserReviewById(id)
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' })
  }

  if (review.userId !== userId) {
    return res.status(403).json({ error: 'You are only authorized to edit your own review.' })
  }

  const updated = db.updateUserReview(id, userId, { rating, title, feedback, category })
  return res.json({ review: updated })
})

// DELETE /api/reviews/:id
app.delete('/api/reviews/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params

  const review = db.getUserReviewById(id)
  if (!review) {
    return res.status(404).json({ error: 'Review not found.' })
  }

  if (review.userId !== userId) {
    return res.status(403).json({ error: 'You are only authorized to delete your own review.' })
  }

  db.deleteUserReview(id, userId)
  return res.json({ message: 'Review successfully deleted.' })
})

// -------------------------------------------------------------
// 7. DEV & PROD SERVING (VITE MIDDLEWARE / STATIC)
// -------------------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production'

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.resolve(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, HOST, () => {
    console.log(`[CodeShield AI] Full-stack Server listening on http://${HOST}:${PORT}`)
  })
}

startServer().catch(err => {
  console.error('[Server Start Failure]', err)
})
