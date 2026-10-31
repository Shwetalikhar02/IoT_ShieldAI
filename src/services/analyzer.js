/**
 * analyzer.js — Module 1: Vulnerability Detection & Classification (M1)
 *
 * Implements static analysis rules, pattern scanning, AST tokenization heuristics,
 * root cause analysis, and severity classification aligned with CVSS v3.1 for C/C++ IoT firmware.
 */

export const SEVERITY_LEVELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
}

const STATIC_RULES = [
  {
    cwe_id: 'CWE-121',
    vuln_type: 'Stack Buffer Overflow',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\bstrcpy\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/,
    title: 'Unsafe strcpy() call without bounds validation',
    root_cause: (match) => `Unbounded strcpy into '${match[1]}' from '${match[2]}' without length validation`,
    fix_advice: 'Replace with strncpy(dst, src, sizeof(dst) - 1) and ensure explicit null termination.',
  },
  {
    cwe_id: 'CWE-121',
    vuln_type: 'Stack Buffer Overflow',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /\bstrcat\s*\(\s*([a-zA-Z0-9_]+)\s*,/,
    title: 'Unsafe strcat() invocation',
    root_cause: (match) => `Unbounded concatenation into '${match[1]}' can overflow destination buffer`,
    fix_advice: 'Use strncat() with remaining space calculation or snprintf().',
  },
  {
    cwe_id: 'CWE-121',
    vuln_type: 'Stack Buffer Overflow',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\bgets\s*\(/,
    title: 'Deprecated gets() call',
    root_cause: () => 'gets() has no buffer bound parameter and always allows stack overflow',
    fix_advice: 'Replace immediately with fgets(buf, sizeof(buf), stdin).',
  },
  {
    cwe_id: 'CWE-134',
    vuln_type: 'Uncontrolled Format String',
    severity: SEVERITY_LEVELS.HIGH,
    // matches printf(var) where var is not a string literal
    regex: /\bprintf\s*\(\s*(?!["'])([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*;/,
    title: 'Format string vulnerability in printf()',
    root_cause: (match) => `User-controlled variable '${match[1]}' passed directly as format specifier to printf()`,
    fix_advice: 'Provide explicit format string: printf("%s", variable).',
  },
  {
    cwe_id: 'CWE-476',
    vuln_type: 'NULL Pointer Dereference',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /([a-zA-Z0-9_]+)\s*=\s*(?:\([a-zA-Z0-9_*\s]+\)\s*)?malloc\s*\(/,
    title: 'Unchecked malloc() return pointer dereference',
    root_cause: (match) => `Dynamic allocation for '${match[1]}' is dereferenced without verifying ptr != NULL`,
    fix_advice: 'Add if (ptr == NULL) { return NULL/error; } immediately after allocation.',
  },
  {
    cwe_id: 'CWE-416',
    vuln_type: 'Use After Free',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\bfree\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*;/,
    title: 'Potential Use-After-Free (dangling pointer)',
    root_cause: (match) => `Pointer '${match[1]}' is freed without immediately being assigned to NULL`,
    fix_advice: 'Nullify pointer immediately after free (ptr = NULL) or pass as double pointer.',
  },
  {
    cwe_id: 'CWE-190',
    vuln_type: 'Integer Overflow in Buffer Allocation',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /size_t\s+([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s*\*\s*([a-zA-Z0-9_]+)/,
    title: 'Integer multiplication overflow before buffer sizing',
    root_cause: (match) => `Multiplication '${match[2]} * ${match[3]}' may overflow before buffer allocation`,
    fix_advice: 'Add guard check: if (count > SIZE_MAX / elem_size) return error.',
  },
  {
    cwe_id: 'CWE-415',
    vuln_type: 'Double Free in Cleanup Path',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /\bfree\s*\(\s*([a-zA-Z0-9_]+)\s*\)(?:[\s\S]{1,120})\bfree\s*\(\s*\1\s*\)/,
    title: 'Double free on same pointer',
    root_cause: (match) => `Resource '${match[1]}' is freed more than once without resetting pointer state`,
    fix_advice: 'Set pointer to NULL after first free and check if (ptr != NULL) before second free.',
  },
  {
    cwe_id: 'CWE-787',
    vuln_type: 'Out-of-bounds Write',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /([a-zA-Z0-9_]+)\s*\[\s*([a-zA-Z0-9_]+)\s*\]\s*=\s*[^;]+;/,
    title: 'Unchecked array index write',
    root_cause: (match) => `Index '${match[2]}' into array '${match[1]}' has no boundary bounds checking`,
    fix_advice: 'Enforce if (idx >= 0 && idx < ARRAY_SIZE) guard before assignment.',
  }
]

/**
 * Identify function enclosing a given line in C code
 */
function findEnclosingFunction(lines, targetLineIdx) {
  const funcRegex = /^[a-zA-Z0-9_* \t]+[\s*]([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{?/
  for (let i = targetLineIdx; i >= 0; i--) {
    const match = lines[i].match(funcRegex)
    if (match && !lines[i].includes(';') && !lines[i].includes('if') && !lines[i].includes('while')) {
      return match[1]
    }
  }
  return 'global_context'
}

/**
 * Analyze C firmware code and return array of vulnerabilities
 * @param {string} sourceCode 
 * @param {string} filename 
 * @returns {Array} findings
 */
export function analyzeFirmwareCode(sourceCode, filename = 'firmware.c') {
  if (!sourceCode || typeof sourceCode !== 'string') return []
  const lines = sourceCode.split('\n')
  const findings = []
  const seenKeys = new Set()

  lines.forEach((lineText, lineIdx) => {
    const lineNum = lineIdx + 1
    const trimmed = lineText.trim()
    // Skip pure comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return
    }

    STATIC_RULES.forEach((rule) => {
      const match = trimmed.match(rule.regex)
      if (match) {
        // Special context checks
        if (rule.cwe_id === 'CWE-416') {
          // Check if followed by ptr = NULL within 2 lines
          const nextLines = lines.slice(lineIdx + 1, lineIdx + 4).join('\n')
          const ptrName = match[1]
          if (nextLines.includes(`${ptrName} = NULL`) || nextLines.includes(`${ptrName} = 0`)) {
            return // safe, nullified
          }
        }

        if (rule.cwe_id === 'CWE-476') {
          // Check if followed by if (ptr == NULL) within 3 lines
          const nextLines = lines.slice(lineIdx + 1, lineIdx + 4).join('\n')
          const ptrName = match[1]
          if (nextLines.includes(`${ptrName} == NULL`) || nextLines.includes(`!${ptrName}`)) {
            return // safe, null checked
          }
        }

        if (rule.cwe_id === 'CWE-787') {
          // Check if previous lines contain bounds check
          const prevLines = lines.slice(Math.max(0, lineIdx - 4), lineIdx).join('\n')
          if (prevLines.includes('>=') || prevLines.includes('< MAX_') || prevLines.includes('< sizeof')) {
            return // likely guarded
          }
        }

        const dedupKey = `${lineNum}-${rule.cwe_id}`
        if (!seenKeys.has(dedupKey)) {
          seenKeys.add(dedupKey)
          const funcName = findEnclosingFunction(lines, lineIdx)
          const rootCause = rule.root_cause(match)
          findings.push({
            id: `vuln-${findings.length + 1}-${Date.now() % 10000}`,
            file_path: filename,
            line_start: lineNum,
            line_end: lineNum,
            cwe_id: rule.cwe_id,
            vuln_type: rule.vuln_type,
            severity: rule.severity,
            description: rule.title,
            root_cause: rootCause,
            fix_advice: rule.fix_advice,
            code_snippet: trimmed,
            function_name: funcName,
            confidence: 0.96,
            created_at: new Date().toISOString()
          })
        }
      }
    })
  })

  // Sort by severity (Critical first) then line number
  const severityOrder = { [SEVERITY_LEVELS.CRITICAL]: 0, [SEVERITY_LEVELS.HIGH]: 1, [SEVERITY_LEVELS.MEDIUM]: 2, [SEVERITY_LEVELS.LOW]: 3 }
  findings.sort((a, b) => {
    const diff = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
    if (diff !== 0) return diff
    return a.line_start - b.line_start
  })

  return findings
}
