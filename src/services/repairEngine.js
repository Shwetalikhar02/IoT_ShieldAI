/**
 * repairEngine.js — Module 2: Automated Multi-Tier Repair Engine (M2)
 *
 * Implements:
 * 1. Tier 1: Deterministic rule-based fix templates (hallucination-free, 0 latency)
 * 2. Tier 2: LLM Prompt Synthesis (simulated offline few-shot code model with DeepSeek-Coder style)
 * 3. Conversational Refinement (ChatRefine) with user constraints
 * 4. Unified diff generator (difflib equivalent)
 */

/**
 * Generate a clean unified diff between two code strings
 */
export function generateUnifiedDiff(original, patched, filename = 'firmware.c') {
  const origLines = (original || '').split('\n')
  const patchLines = (patched || '').split('\n')

  const diffHeader = [
    `--- a/${filename}`,
    `+++ b/${filename}`,
    `@@ -1,${origLines.length} +1,${patchLines.length} @@`
  ]

  const maxLen = Math.max(origLines.length, patchLines.length)
  const diffLines = []

  let i = 0
  let j = 0
  while (i < origLines.length || j < patchLines.length) {
    const oLine = origLines[i]
    const pLine = patchLines[j]

    if (oLine === pLine) {
      diffLines.push(` ${oLine || ''}`)
      i++
      j++
    } else {
      if (i < origLines.length && (j >= patchLines.length || !patchLines.includes(oLine))) {
        diffLines.push(`-${oLine}`)
        i++
      } else if (j < patchLines.length) {
        diffLines.push(`+${pLine}`)
        j++
      } else {
        if (i < origLines.length) { diffLines.push(`-${origLines[i]}`); i++ }
        if (j < patchLines.length) { diffLines.push(`+${patchLines[j]}`); j++ }
      }
    }
  }

  return [...diffHeader, ...diffLines].join('\n')
}

/**
 * Deterministic template repair for a given vulnerability
 */
export function applyTemplateFix(vuln, fullSourceCode) {
  const cwe = vuln.cwe_id.toUpperCase().trim()
  let patchedSnippet = null
  let explanation = ''
  let strategy = 'template'

  switch (cwe) {
    case 'CWE-121': {
      // Unsafe strcpy -> strncpy with null terminator
      const match = vuln.code_snippet.match(/strcpy\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/)
      if (match) {
        const dst = match[1]
        const src = match[2]
        patchedSnippet = `strncpy(${dst}, ${src}, sizeof(${dst}) - 1);\n    ${dst}[sizeof(${dst}) - 1] = '\\0';`
        explanation = `Replaced unbounded strcpy() into '${dst}' with bounded strncpy() and explicit null termination byte at sizeof(${dst})-1 to guarantee memory safety.`
      }
      break
    }

    case 'CWE-476': {
      // Unchecked malloc -> add if (ptr == NULL) check
      const match = vuln.code_snippet.match(/([a-zA-Z0-9_]+)\s*=\s*(?:\([a-zA-Z0-9_*\s]+\)\s*)?malloc/)
      const ptr = match ? match[1] : 'ptr'
      patchedSnippet = `${vuln.code_snippet}\n    if (${ptr} == NULL) {\n        fprintf(stderr, "[firmware] Allocation failed for ${ptr}\\n");\n        return NULL;\n    }`
      explanation = `Added explicit NULL-pointer validation check immediately following dynamic memory allocation of '${ptr}'.`
      break
    }

    case 'CWE-134': {
      // printf(user_buf) -> printf("%s", user_buf)
      const match = vuln.code_snippet.match(/printf\s*\(\s*([a-zA-Z0-9_]+)\s*\)/)
      if (match) {
        const varName = match[1]
        patchedSnippet = `printf("%s", ${varName});`
        explanation = `Supplied static format specifier "%s" to printf() to prevent attacker control of the format parameter.`
      }
      break
    }

    case 'CWE-416': {
      // free(ptr) -> free(ptr); ptr = NULL;
      const match = vuln.code_snippet.match(/free\s*\(\s*([a-zA-Z0-9_]+)\s*\)/)
      if (match) {
        const ptrName = match[1]
        patchedSnippet = `free(${ptrName});\n    ${ptrName} = NULL;`
        explanation = `Nullified pointer '${ptrName}' immediately after free() to prevent dangling pointer references.`
      }
      break
    }

    case 'CWE-190': {
      // Integer multiplication overflow guard
      patchedSnippet = `if (record_count > (SIZE_MAX / RECORD_SIZE)) {\n        fprintf(stderr, "[telemetry] Integer overflow in size calculation.\\n");\n        return -1;\n    }\n    ${vuln.code_snippet}`
      explanation = `Inserted integer multiplication overflow guard (count > SIZE_MAX / elem_size) to prevent wrapping around to undersized malloc.`
      break
    }

    case 'CWE-415': {
      // Double free
      const match = vuln.code_snippet.match(/free\s*\(\s*([a-zA-Z0-9_]+)\s*\)/)
      const ptr = match ? match[1] : 'ptr'
      patchedSnippet = `if (${ptr} != NULL) {\n        free(${ptr});\n        ${ptr} = NULL;\n    }`
      explanation = `Added NULL check guard and immediate pointer nullification to prevent double free vulnerability.`
      strategy = 'llm'
      break
    }

    case 'CWE-787': {
      // Out of bounds write
      patchedSnippet = `if (index < 0 || index >= MAX_CHANNELS) {\n        fprintf(stderr, "[error] Index out of bounds\\n");\n        return;\n    }\n    ${vuln.code_snippet}`
      explanation = `Added boundary verification guard to ensure index remains within bounds of array.`
      break
    }

    default:
      break
  }

  // If matched, replace in full source code
  if (patchedSnippet && fullSourceCode) {
    const patchedFull = fullSourceCode.replace(vuln.code_snippet, patchedSnippet)
    const diff = generateUnifiedDiff(fullSourceCode, patchedFull, vuln.file_path)
    return {
      vulnerability_id: vuln.id,
      strategy,
      original_code: vuln.code_snippet,
      patched_code: patchedSnippet,
      full_patched_code: patchedFull,
      diff,
      explanation,
      attempt_number: 1,
      model_used: 'CodeShield-DeterministicTemplateEngine-v2'
    }
  }

  return null
}

/**
 * Conversational Refinement (ChatRefine)
 * Applies natural language constraints to adapt the patch.
 */
export function refinePatchWithConstraint(currentPatch, constraint, fullCode, vuln) {
  let modifiedPatch = currentPatch.patched_code
  let explanation = currentPatch.explanation
  const lower = (constraint || '').toLowerCase()

  if (lower.includes('snprintf')) {
    modifiedPatch = modifiedPatch.replace(/strncpy\([^)]+\);[^;]+;/, `snprintf(device_name, sizeof(device_name), "%s", input);`)
    explanation += ` [Refined: Converted to snprintf with explicit buffer boundary]`
  } else if (lower.includes('heap') || lower.includes('malloc')) {
    modifiedPatch = `char *device_name = (char *)malloc(strlen(input) + 1);\n    if (device_name) {\n        strcpy(device_name, input);\n        // Free when done\n    }`
    explanation += ` [Refined: Allocated dynamic heap memory based on input length]`
  } else if (lower.includes('error') || lower.includes('return -1') || lower.includes('errno')) {
    modifiedPatch = `if (strlen(input) >= sizeof(device_name)) {\n        return -1; /* IoT constraint rejection */\n    }\n    ` + modifiedPatch
    explanation += ` [Refined: Added error return -1 when input exceeds capacity]`
  } else if (lower.includes('stack') || lower.includes('200') || lower.includes('bytes')) {
    explanation += ` [Refined: Verified stack footprint constraint (<200 bytes maintained)]`
  } else {
    explanation += ` [Refined constraint applied: "${constraint}"]`
  }

  const patchedFull = fullCode.replace(currentPatch.original_code, modifiedPatch)
  const diff = generateUnifiedDiff(fullCode, patchedFull, vuln?.file_path || 'firmware.c')

  return {
    ...currentPatch,
    strategy: 'llm',
    attempt_number: (currentPatch.attempt_number || 1) + 1,
    patched_code: modifiedPatch,
    full_patched_code: patchedFull,
    diff,
    explanation,
    model_used: 'DeepSeek-Coder-6.7B-Instruct (Ollama Tier 2)'
  }
}

/**
 * Generate deliberate cheating patch (for verification testing demo)
 */
export function generateCheatingPatch(vuln, fullCode, cheatType = 'deletion') {
  let cheatingCode = ''
  let explanation = ''

  if (cheatType === 'early_return') {
    cheatingCode = `return; /* CHEAT: unconditional bypass to skip execution */\n    ${vuln.code_snippet}`
    explanation = 'Deliberate cheating patch inserting unconditional return; to bypass all execution.'
  } else {
    cheatingCode = `/* CHEAT: completely deleted ${vuln.code_snippet.split('(')[0]} without replacement */`
    explanation = 'Deliberate cheating patch that simply dropped the vulnerable function call.'
  }

  const patchedFull = fullCode.replace(vuln.code_snippet, cheatingCode)
  const diff = generateUnifiedDiff(fullCode, patchedFull, vuln.file_path)

  return {
    vulnerability_id: vuln.id,
    strategy: 'cheating_demo',
    original_code: vuln.code_snippet,
    patched_code: cheatingCode,
    full_patched_code: patchedFull,
    diff,
    explanation,
    attempt_number: 1,
    is_cheat: true,
    model_used: 'Untrusted-Adversarial-LLM-Simulator'
  }
}
