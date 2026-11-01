import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const DATA_DIR = path.resolve(process.cwd(), '.data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export interface FirmwareFile {
  id: string
  projectId: string
  userId: string
  name: string
  category: string
  code: string
  sizeBytes: number
  targetArch?: string
  createdAt: string
  updatedAt: string
}

export interface VulnerabilityRecord {
  id: string
  projectId: string
  userId: string
  filePath: string
  lineStart: number
  lineEnd: number
  cweId: string
  vulnType: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  rootCause: string
  fixAdvice: string
  codeSnippet: string
  functionName: string
  status: 'open' | 'reviewed' | 'resolved'
  priorityRank?: number
  impactAnalysis?: string
  createdAt: string
}

export interface PatchRecord {
  id: string
  projectId: string
  userId: string
  vulnerabilityId: string
  strategy: 'template' | 'llm' | 'manual'
  originalCode: string
  patchedCode: string
  fullPatchedCode: string
  diff: string
  explanation: string
  attemptNumber: number
  modelUsed: string
  createdAt: string
}

export interface CodeReviewRecord {
  id: string
  projectId: string
  userId: string
  patchId: string
  vulnerabilityId: string
  decision: 'approved' | 'rejected' | 'requested_revision'
  reviewNotes?: string
  createdAt: string
}

export interface VerificationRecord {
  id: string
  projectId: string
  userId: string
  patchId: string
  vulnerabilityId: string
  compiles: boolean
  sanitizerPassed: boolean
  noCheatingPassed: boolean
  equivalencePassed: boolean
  overallStatus: 'passed' | 'failed'
  errors: string[]
  violations: string[]
  asanLog: string
  compilerOutput: string
  verifiedAt: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string
  targetArch: string // 'ARM Cortex-M4' | 'ESP32 (Xtensa)' | 'RISC-V RV32' | 'x86_64 Generic'
  createdAt: string
  updatedAt: string
}

export interface UserReview {
  id: string
  userId: string
  userName: string
  userEmail: string
  rating: number // 1 - 5
  title: string
  feedback: string
  category: string // 'User Experience' | 'AI Assistant' | 'Vulnerability Detection' | 'Code Fixing' | 'Verification' | 'Overall Experience'
  createdAt: string
  updatedAt: string
}

export interface ChatMessageRecord {
  id: string
  projectId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  text: string
  contextSnippet?: string
  timestamp: string
}

export interface DatabaseSchema {
  users: User[]
  projects: Project[]
  files: FirmwareFile[]
  vulnerabilities: VulnerabilityRecord[]
  patches: PatchRecord[]
  codeReviews: CodeReviewRecord[]
  verifications: VerificationRecord[]
  userReviews: UserReview[]
  chatMessages: ChatMessageRecord[]
}

const DEFAULT_DB: DatabaseSchema = {
  users: [],
  projects: [],
  files: [],
  vulnerabilities: [],
  patches: [],
  codeReviews: [],
  verifications: [],
  userReviews: [],
  chatMessages: []
}

class Database {
  private data: DatabaseSchema = DEFAULT_DB
  private initialized = false

  constructor() {
    this.init()
  }

  private init() {
    if (this.initialized) return
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        this.data = JSON.parse(raw)
      } catch (err) {
        console.warn('[DB] Failed reading db.json, creating fallback', err)
        this.data = DEFAULT_DB
        this.save()
      }
    } else {
      this.data = DEFAULT_DB
      this.seedDefaultData()
      this.save()
    }
    this.initialized = true
  }

  public save() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8')
      fs.renameSync(tempPath, DB_FILE)
    } catch (err) {
      console.error('[DB] Write error:', err)
    }
  }

  private seedDefaultData() {
    const demoPasswordHash = bcrypt.hashSync('ShieldDemo2026!', 10)
    const demoUser: User = {
      id: 'usr_demo_01',
      name: 'DevSecOps Engineer',
      email: 'demo@codeshield.ai',
      passwordHash: demoPasswordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.users.push(demoUser)

    const defaultProject: Project = {
      id: 'proj_demo_gateway',
      userId: demoUser.id,
      name: 'IoT Gateway Core Firmware',
      description: 'Bare-metal C communications and sensor ingest module for ARM Cortex-M4 gateway device.',
      targetArch: 'ARM Cortex-M4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.projects.push(defaultProject)

    // Seed Initial User Reviews
    const initialReviews: UserReview[] = [
      {
        id: 'rev_01',
        userId: 'usr_community_1',
        userName: 'Alex Chen',
        userEmail: 'alex.chen@embed-sec.org',
        rating: 5,
        title: 'Outstanding memory-safety verification for Cortex-M',
        feedback: 'The anti-cheating gate and AddressSanitizer simulation are incredible. It caught two subtle buffer truncations that other static linters completely missed.',
        category: 'Verification',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'rev_02',
        userId: 'usr_community_2',
        userName: 'Elena Rostova',
        userEmail: 'e.rostova@firmwarelab.io',
        rating: 5,
        title: 'AI Security Assistant understands true embedded constraints',
        feedback: 'Having the Gemini assistant explain compiler flags and ROM/RAM overhead in context makes reviewing C patches 10x faster.',
        category: 'AI Assistant',
        createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString()
      }
    ]
    this.data.userReviews.push(...initialReviews)

    // Seed canonical firmware files
    const sampleFiles = [
      {
        name: 'stack_overflow.c',
        code: `/*
 * IoT Sensor Telemetry Packet Processor
 * Target: ARM Cortex-M4 (Bare Metal)
 */
#include <stdio.h>
#include <string.h>

void process_device_name(const char *input) {
    char device_name[32]; // Fixed 32-byte stack buffer
    
    // VULNERABILITY (CWE-121): Unsafe strcpy() without length validation
    strcpy(device_name, input);
    
    printf("[telemetry] Ingested device name: %s\\n", device_name);
}

int main(int argc, char *argv[]) {
    const char *payload = argc > 1 ? argv[1] : "Sensor_Node_Alpha_7749";
    process_device_name(payload);
    return 0;
}`
      },
      {
        name: 'null_ptr_deref.c',
        code: `/*
 * Sensor Reading Allocator & Ingest
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    float temperature;
    float humidity;
} SensorData;

SensorData* allocate_sensor_record(void) {
    // VULNERABILITY (CWE-476): Unchecked dynamic allocation
    SensorData *reading = (SensorData *)malloc(sizeof(SensorData));
    
    // Direct dereference without checking reading != NULL
    reading->temperature = 24.5f;
    reading->humidity = 58.2f;
    return reading;
}

int main(void) {
    SensorData *record = allocate_sensor_record();
    if (record) free(record);
    return 0;
}`
      },
      {
        name: 'format_string.c',
        code: `/*
 * Telemetry Diagnostic Logger
 */
#include <stdio.h>

void log_device_event(const char *event_message) {
    // VULNERABILITY (CWE-134): Format string vulnerability
    printf(event_message);
    printf("\\n");
}

int main(void) {
    log_device_event("Device booted into safe recovery mode");
    return 0;
}`
      },
      {
        name: 'use_after_free.c',
        code: `/*
 * Circular Ring Buffer Packet Free
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    char payload[64];
} TelemetryPacket;

void release_packet(TelemetryPacket *pkt) {
    if (pkt) {
        // VULNERABILITY (CWE-416): Pointer freed without nullification
        free(pkt);
    }
}

int main(void) {
    TelemetryPacket *p = (TelemetryPacket *)malloc(sizeof(TelemetryPacket));
    release_packet(p);
    return 0;
}`
      },
      {
        name: 'integer_overflow.c',
        code: `/*
 * Batch Calibration Ingest
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

void allocate_calibration_table(size_t record_count) {
    // VULNERABILITY (CWE-190): Integer multiplication overflow before sizing
    size_t total_bytes = record_count * sizeof(uint32_t);
    uint32_t *table = (uint32_t *)malloc(total_bytes);
    if (table) {
        printf("[calib] Table allocated: %zu bytes\\n", total_bytes);
        free(table);
    }
}

int main(void) {
    allocate_calibration_table(100);
    return 0;
}`
      }
    ]

    sampleFiles.forEach((f, idx) => {
      this.data.files.push({
        id: `file_${defaultProject.id}_${idx + 1}`,
        projectId: defaultProject.id,
        userId: demoUser.id,
        name: f.name,
        category: 'embedded_driver',
        code: f.code,
        sizeBytes: Buffer.byteLength(f.code, 'utf-8'),
        targetArch: 'ARM Cortex-M4',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })
  }

  // --- Users ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id)
  }

  public createUser(name: string, email: string, passwordHash: string): User {
    const user: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.users.push(user)
    this.save()
    return user
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id)
    if (!user) return undefined
    Object.assign(user, updates, { updatedAt: new Date().toISOString() })
    this.save()
    return user
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id)
    if (idx === -1) return false
    this.data.users.splice(idx, 1)
    // Cascade delete user projects and associated records
    this.data.projects = this.data.projects.filter(p => p.userId !== id)
    this.data.files = this.data.files.filter(f => f.userId !== id)
    this.data.vulnerabilities = this.data.vulnerabilities.filter(v => v.userId !== id)
    this.data.patches = this.data.patches.filter(p => p.userId !== id)
    this.data.codeReviews = this.data.codeReviews.filter(r => r.userId !== id)
    this.data.verifications = this.data.verifications.filter(v => v.userId !== id)
    this.data.chatMessages = this.data.chatMessages.filter(c => c.userId !== id)
    this.save()
    return true
  }

  // --- Projects ---
  public getProjectsByUser(userId: string): Project[] {
    return this.data.projects.filter(p => p.userId === userId)
  }

  public getProjectById(projectId: string, userId: string): Project | undefined {
    return this.data.projects.find(p => p.id === projectId && p.userId === userId)
  }

  public createProject(userId: string, name: string, description: string, targetArch = 'ARM Cortex-M4'): Project {
    const project: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      name,
      description,
      targetArch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.projects.push(project)
    this.save()
    return project
  }

  public updateProject(projectId: string, userId: string, updates: Partial<Project>): Project | undefined {
    const project = this.getProjectById(projectId, userId)
    if (!project) return undefined
    Object.assign(project, updates, { updatedAt: new Date().toISOString() })
    this.save()
    return project
  }

  public deleteProject(projectId: string, userId: string): boolean {
    const idx = this.data.projects.findIndex(p => p.id === projectId && p.userId === userId)
    if (idx === -1) return false
    this.data.projects.splice(idx, 1)
    this.data.files = this.data.files.filter(f => f.projectId !== projectId)
    this.data.vulnerabilities = this.data.vulnerabilities.filter(v => v.projectId !== projectId)
    this.data.patches = this.data.patches.filter(p => p.projectId !== projectId)
    this.data.codeReviews = this.data.codeReviews.filter(r => r.projectId !== projectId)
    this.data.verifications = this.data.verifications.filter(v => v.projectId !== projectId)
    this.data.chatMessages = this.data.chatMessages.filter(c => c.projectId !== projectId)
    this.save()
    return true
  }

  // --- Files ---
  public getFilesByProject(projectId: string, userId: string): FirmwareFile[] {
    return this.data.files.filter(f => f.projectId === projectId && f.userId === userId)
  }

  public getFileById(fileId: string, userId: string): FirmwareFile | undefined {
    return this.data.files.find(f => f.id === fileId && f.userId === userId)
  }

  public addFile(projectId: string, userId: string, name: string, code: string, category = 'firmware'): FirmwareFile {
    const file: FirmwareFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      userId,
      name,
      category,
      code,
      sizeBytes: Buffer.byteLength(code, 'utf-8'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.files.push(file)
    this.save()
    return file
  }

  public updateFile(fileId: string, userId: string, updates: Partial<FirmwareFile>): FirmwareFile | undefined {
    const file = this.getFileById(fileId, userId)
    if (!file) return undefined
    if (updates.code !== undefined) {
      updates.sizeBytes = Buffer.byteLength(updates.code, 'utf-8')
    }
    Object.assign(file, updates, { updatedAt: new Date().toISOString() })
    this.save()
    return file
  }

  public deleteFile(fileId: string, userId: string): boolean {
    const idx = this.data.files.findIndex(f => f.id === fileId && f.userId === userId)
    if (idx === -1) return false
    const file = this.data.files[idx]
    this.data.files.splice(idx, 1)
    this.data.vulnerabilities = this.data.vulnerabilities.filter(v => v.filePath !== file.name || v.projectId !== file.projectId)
    this.save()
    return true
  }

  // --- Vulnerabilities ---
  public getVulnerabilitiesByProject(projectId: string, userId: string): VulnerabilityRecord[] {
    return this.data.vulnerabilities.filter(v => v.projectId === projectId && v.userId === userId)
  }

  public setProjectVulnerabilities(projectId: string, userId: string, findings: Omit<VulnerabilityRecord, 'projectId' | 'userId'>[]): VulnerabilityRecord[] {
    // Retain resolved status if previously resolved
    const existing = this.getVulnerabilitiesByProject(projectId, userId)
    const resolvedCwes = new Set(existing.filter(e => e.status === 'resolved').map(e => `${e.filePath}:${e.cweId}`))

    // Replace current open findings with new scan results
    this.data.vulnerabilities = this.data.vulnerabilities.filter(v => !(v.projectId === projectId && v.userId === userId))
    const mapped: VulnerabilityRecord[] = findings.map(f => ({
      ...f,
      projectId,
      userId,
      status: resolvedCwes.has(`${f.filePath}:${f.cweId}`) ? 'resolved' : f.status || 'open'
    }))
    this.data.vulnerabilities.push(...mapped)
    this.save()
    return mapped
  }

  public updateVulnerabilityStatus(vulnId: string, userId: string, status: 'open' | 'reviewed' | 'resolved'): boolean {
    const vuln = this.data.vulnerabilities.find(v => v.id === vulnId && v.userId === userId)
    if (!vuln) return false
    vuln.status = status
    this.save()
    return true
  }

  // --- Patches & Reviews ---
  public savePatch(patch: Omit<PatchRecord, 'id' | 'createdAt'>): PatchRecord {
    const record: PatchRecord = {
      ...patch,
      id: `patch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    }
    this.data.patches.push(record)
    this.save()
    return record
  }

  public getPatchesByProject(projectId: string, userId: string): PatchRecord[] {
    return this.data.patches.filter(p => p.projectId === projectId && p.userId === userId)
  }

  public saveCodeReview(review: Omit<CodeReviewRecord, 'id' | 'createdAt'>): CodeReviewRecord {
    const record: CodeReviewRecord = {
      ...review,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    }
    this.data.codeReviews.push(record)
    this.save()
    return record
  }

  public getCodeReviewsByProject(projectId: string, userId: string): CodeReviewRecord[] {
    return this.data.codeReviews.filter(r => r.projectId === projectId && r.userId === userId)
  }

  // --- Verifications ---
  public saveVerification(ver: Omit<VerificationRecord, 'id' | 'verifiedAt'>): VerificationRecord {
    const record: VerificationRecord = {
      ...ver,
      id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      verifiedAt: new Date().toISOString()
    }
    this.data.verifications.push(record)
    this.save()
    return record
  }

  public getVerificationsByProject(projectId: string, userId: string): VerificationRecord[] {
    return this.data.verifications.filter(v => v.projectId === projectId && v.userId === userId)
  }

  // --- Reviews & Feedback (Public / Community) ---
  public getAllUserReviews(): UserReview[] {
    return [...this.data.userReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  public getUserReviewById(reviewId: string): UserReview | undefined {
    return this.data.userReviews.find(r => r.id === reviewId)
  }

  public createUserReview(userId: string, userName: string, userEmail: string, rating: number, title: string, feedback: string, category: string): UserReview {
    const review: UserReview = {
      id: `apprev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      userEmail,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      title: title.trim(),
      feedback: feedback.trim(),
      category: category || 'Overall Experience',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.userReviews.unshift(review)
    this.save()
    return review
  }

  public updateUserReview(reviewId: string, userId: string, updates: { rating?: number; title?: string; feedback?: string; category?: string }): UserReview | undefined {
    const review = this.data.userReviews.find(r => r.id === reviewId && r.userId === userId)
    if (!review) return undefined
    if (updates.rating !== undefined) review.rating = Math.min(5, Math.max(1, Math.round(updates.rating)))
    if (updates.title !== undefined) review.title = updates.title.trim()
    if (updates.feedback !== undefined) review.feedback = updates.feedback.trim()
    if (updates.category !== undefined) review.category = updates.category.trim()
    review.updatedAt = new Date().toISOString()
    this.save()
    return review
  }

  public deleteUserReview(reviewId: string, userId: string): boolean {
    const idx = this.data.userReviews.findIndex(r => r.id === reviewId && r.userId === userId)
    if (idx === -1) return false
    this.data.userReviews.splice(idx, 1)
    this.save()
    return true
  }

  // --- Chat Messages ---
  public getChatMessages(projectId: string, userId: string): ChatMessageRecord[] {
    return this.data.chatMessages.filter(c => c.projectId === projectId && c.userId === userId)
  }

  public addChatMessage(projectId: string, userId: string, role: 'user' | 'assistant' | 'system', text: string, contextSnippet?: string): ChatMessageRecord {
    const msg: ChatMessageRecord = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      userId,
      role,
      text,
      contextSnippet,
      timestamp: new Date().toISOString()
    }
    this.data.chatMessages.push(msg)
    this.save()
    return msg
  }

  public clearChatMessages(projectId: string, userId: string): boolean {
    this.data.chatMessages = this.data.chatMessages.filter(c => !(c.projectId === projectId && c.userId === userId))
    this.save()
    return true
  }
}

export const db = new Database()
