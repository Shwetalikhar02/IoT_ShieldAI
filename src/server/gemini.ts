import { GoogleGenAI } from '@google/genai'

let genAIClient: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      })
    } catch (err) {
      console.warn('[Gemini] Failed to initialize GoogleGenAI client:', err)
    }
  }
  return genAIClient
}

export interface AssistantContext {
  filename?: string
  codeSnippet?: string
  vulnerabilities?: Array<{
    cwe_id: string
    vuln_type: string
    severity: string
    line_start: number
    description: string
    root_cause: string
  }>
  candidatePatch?: {
    strategy?: string
    explanation?: string
    patched_code?: string
    model_used?: string
  }
  verificationResult?: {
    compiles?: boolean
    sanitizer_passed?: boolean
    no_cheating_passed?: boolean
    overall_status?: string
    errors?: string[]
  }
}

export async function askGeminiSecurityAssistant(
  userQuery: string,
  context: AssistantContext,
  chatHistory: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<string> {
  const client = getGeminiClient()

  // Format context for the assistant
  const contextSummaryParts: string[] = []
  if (context.filename) {
    contextSummaryParts.push(`- Current Firmware Target File: ${context.filename}`)
  }
  if (context.vulnerabilities && context.vulnerabilities.length > 0) {
    const list = context.vulnerabilities
      .map(
        v =>
          `  * [${v.severity}] ${v.vuln_type} (${v.cwe_id}) at line ${v.line_start}: "${v.description}" (Root cause: ${v.root_cause})`
      )
      .join('\n')
    contextSummaryParts.push(`- Active Scanner Findings:\n${list}`)
  } else {
    contextSummaryParts.push(`- Active Scanner Findings: 0 active findings logged. Code is clean.`)
  }

  if (context.codeSnippet) {
    contextSummaryParts.push(`- Relevant Firmware Source Code Snippet:\n\`\`\`c\n${context.codeSnippet.slice(0, 1500)}\n\`\`\``)
  }

  if (context.candidatePatch) {
    contextSummaryParts.push(
      `- Proposed Fix Candidate (Strategy: ${context.candidatePatch.strategy || 'Template'}):\n\`\`\`c\n${context.candidatePatch.patched_code || ''}\n\`\`\`\nExplanation: ${context.candidatePatch.explanation || 'None'}`
    )
  }

  if (context.verificationResult) {
    contextSummaryParts.push(
      `- Verification Status: ${context.verificationResult.overall_status?.toUpperCase() || 'NOT RUN'}\n  * GCC Compiles: ${context.verificationResult.compiles ? 'PASS' : 'FAIL'}\n  * AddressSanitizer/UBSan: ${context.verificationResult.sanitizer_passed ? 'PASS' : 'FAIL'}\n  * Anti-Cheating AST Check: ${context.verificationResult.no_cheating_passed ? 'PASS' : 'FAIL'}`
    )
    if (context.verificationResult.errors && context.verificationResult.errors.length > 0) {
      contextSummaryParts.push(`  * Recorded Errors: ${context.verificationResult.errors.join('; ')}`)
    }
  }

  const systemInstruction = `You are the CodeShield AI Embedded Firmware Security Engineer.
Your role is to assist firmware developers, embedded systems engineers, and security auditors in securing C/C++ firmware for microcontrollers (ARM Cortex-M, ESP32, RISC-V).

Core Directives:
1. Speak as an authoritative, concise, and pragmatic embedded security professional.
2. Ground all explanations strictly in real C language semantics (C99/C11/MISRA-C), compiler behaviors (GCC/Clang flags, -Wall -Wextra -Werror), memory layouts (stack frames, heap, buffers), and standard CWE definitions (e.g. CWE-121, CWE-134, CWE-476, CWE-416, CWE-190).
3. Clearly distinguish scanner-confirmed static findings from AI suggestions. Never claim a fix is safe without sanitizer or compiler validation.
4. Keep microcontroller constraints in mind: deterministic execution, strict ROM/Flash limits, minimal stack depth, and no uncontrolled dynamic heap allocations in safety-critical loops.
5. Format your answers clearly using Markdown headers, bullet points, and syntax-highlighted C code snippets where helpful.`

  const promptContent = `System Context:\n${contextSummaryParts.join('\n\n')}\n\nRecent Conversation:\n${chatHistory
    .slice(-4)
    .map(m => `${m.role === 'user' ? 'Developer' : 'Security Assistant'}: ${m.text}`)
    .join('\n')}\n\nDeveloper Inquiry: ${userQuery}`

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction
        }
      })
      if (response && response.text) {
        return response.text
      }
    } catch (err: any) {
      console.warn('[Gemini] API error during assistant call:', err?.message || err)
    }
  }

  // High-fidelity embedded security fallback if Gemini is offline or unconfigured
  return generateDeterministicSecurityAdvice(userQuery, context)
}

function generateDeterministicSecurityAdvice(query: string, context: AssistantContext): string {
  const q = query.toLowerCase()
  const active = context.vulnerabilities?.[0]

  if (q.includes('strcpy') || q.includes('cwe-121') || q.includes('overflow')) {
    return `### Analysis: CWE-121 (Stack-based Buffer Overflow)

In C firmware, functions like \`strcpy()\` and \`strcat()\` perform unbounded memory copies that do not examine the destination buffer's capacity. If the input exceeds the fixed buffer, it overwrites neighboring stack variables and corrupts the saved Return Address (stored in the stack frame or Link Register $LR).

**Recommended Remediation:**
\`\`\`c
// 1. Use bounded string copy with explicit null-termination
strncpy(destination, source, sizeof(destination) - 1);
destination[sizeof(destination) - 1] = '\\0';

// 2. Or preferably use snprintf for formatted copy
snprintf(destination, sizeof(destination), "%s", source);
\`\`\`

**Verification Criteria:**
- Binary compiled with \`-fstack-protector-strong\` or tested under AddressSanitizer (ASan).
- Exploit vectors exceeding buffer size must be safely truncated without triggering memory access violations.`
  }

  if (q.includes('null') || q.includes('cwe-476') || q.includes('malloc') || q.includes('pointer')) {
    return `### Analysis: CWE-476 (NULL Pointer Dereference)

Embedded systems without MMU (Memory Management Unit) hardware protection can exhibit undefined behavior or hardware HardFault exceptions when accessing address \`0x00000000\`. If dynamic memory or sensor reads fail, dereferencing the returned pointer triggers immediate crash loops.

**Remediation Rule:**
\`\`\`c
SensorData *record = (SensorData *)malloc(sizeof(SensorData));
if (record == NULL) {
    // Handle error gracefully or enter safe fallback mode
    return -1;
}
// Safe to dereference record
record->temperature = 25.0f;
\`\`\``
  }

  if (q.includes('format') || q.includes('cwe-134') || q.includes('printf')) {
    return `### Analysis: CWE-134 (Uncontrolled Format String)

Passing external user input directly as the first argument of \`printf(buf)\` permits format specifier injection (\`%x\`, \`%n\`, \`%s\`). An attacker can leak internal stack contents or write arbitrary integers into memory via \`%n\`.

**Safe Alternative:**
\`\`\`c
// Always provide a static literal format string:
printf("%s", user_buffer);
\`\`\``
  }

  if (q.includes('compiler') || q.includes('asan') || q.includes('sanitizer')) {
    return `### Compiler & Sanitizer Insights

**Compilation Flags in CodeShield:**
- \`-Wall -Wextra -Werror\`: Enforces zero unhandled warnings, unused variables, and implicit type conversions.
- \`-fsanitize=address\`: Instruments memory access with shadow memory to catch out-of-bounds writes, heap-use-after-free, and stack corruption.
- \`-fsanitize=undefined\`: Checks for signed integer overflow, division by zero, and invalid pointer arithmetic.

Always verify that candidate patches compile without warnings and pass exploit fuzzing under ASan.`
  }

  if (q.includes('priorit') || q.includes('fix first') || q.includes('what should i fix')) {
    return `### Remediation Prioritization (CVSS & Exploitability)

1. **Top Priority: Critical Severity (CVSS 9.0+)**
   - **Stack Buffer Overflow (CWE-121)** & **Format String (CWE-134)**: These grant remote code execution or control-flow hijacking.
2. **Second Priority: High Severity (CVSS 7.0-8.9)**
   - **Use-After-Free (CWE-416)** & **NULL Pointer Dereference (CWE-476)**: Can trigger denial of service or arbitrary memory corruption.
3. **Third Priority: Medium / Edge Bounds**
   - **Integer Overflow in Allocation (CWE-190)**: Vulnerable if attacker can supply extremely large count parameters.`
  }

  return `### CodeShield Firmware Security Assistant

I have reviewed the active firmware context for \`${context.filename || 'your firmware module'}\`.

${
  active
    ? `Current target issue: **${active.vuln_type} (${active.cwe_id})** at line ${active.line_start}.
Root cause: ${active.root_cause}.

Remediation recommendation:
\`\`\`c
${context.candidatePatch?.patched_code || '// Inspect and apply bounded buffer controls'}
\`\`\`
`
    : `The firmware currently has 0 active scanner violations logged.`
}

You can ask me to:
- Explain specific CWE vulnerabilities in detail
- Walk through compiler warnings or AddressSanitizer logs
- Recommend MISRA-C compliant coding patterns
- Analyze IoT Flash (ROM) and SRAM stack footprint tradeoffs`
}
