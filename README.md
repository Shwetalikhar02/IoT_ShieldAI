# CodeShield AI — Autonomous Firmware Vulnerability Repair IDE

> **Problem Statement 15**: Automated Code Vulnerability Repair and Secure Software Synthesizer for IoT Firmware  
> **Domain**: AI for Software Engineering and Embedded IoT Security

CodeShield AI scans C/C++ IoT firmware, detects critical memory-safety vulnerabilities (buffer overflow, NULL dereference, format string, use-after-free, integer overflow, double free), synthesizes secure, syntactically valid patches with zero performance regression, and rigorously verifies them using compiler sanitizers (AddressSanitizer / UBSan) and anti-cheating AST heuristics.

---

## Architecture & Product Vision

The primary screen is an **AI Code IDE Workspace** centered on C/C++ firmware development:
- **Left Explorer**: File tree featuring the 5 canonical Hackathon demo firmware samples, extended Juliet benchmark cases, custom firmware uploads, and live vulnerability navigation markers.
- **Center Editor**: Interactive Monaco Editor (`@monaco-editor/react`) for C/C++ with syntax highlighting, inline problem squiggles, and integrated Monaco DiffEditor for side-by-side patch review before applying.
- **Right Verify Panel**: Real-time M3 Sandbox Verification executing GCC strict warning checks (`-Wall -Wextra -Werror`), AddressSanitizer/UBSan runtime validation against exploit payloads, No-Cheating anti-bypass guards, and IoT resource footprint telemetry (Flash/ROM, SRAM/Stack delta, Cyclomatic complexity).
- **Bottom Console**: Collapsible drawer featuring **AI ChatRefine** (conversational constraint injection such as "Keep stack usage under 128 bytes") and real-time SSE execution logs.

---

## Remediation Pipeline (M1 → M4)

1. **Module 1 (M1) — Detection & Classification**:
   - Analyzes C/C++ source code for unsafe functions (`strcpy`, `strcat`, `gets`, `printf(var)`), unchecked `malloc()`, dangling pointers after `free()`, and integer wrap-around before buffer allocation.
   - Accurately classifies severity (`Critical`, `High`, `Medium`, `Low`) aligned with CVSS v3.1 and pinpoints exact root causes.

2. **Module 2 (M2) — Multi-Tier Repair Engine**:
   - **Tier 1 (Deterministic Fix Templates)**: Rule-based, zero-latency, hallucination-free repairs (e.g. `strncpy` + explicit NUL byte, NULL pointer check injection).
   - **Tier 2 (AI Code LLM)**: Open-source code LLM synthesis (DeepSeek-Coder / CodeLlama) with localized context and conversational refinement.

3. **Module 3 (M3) — Sandbox Verification & Anti-Cheating**:
   - **Compiler Strict Check**: Verifies syntax with GCC/Clang flags.
   - **AddressSanitizer (ASan) & UBSan**: Tests patched firmware against exploit vectors to verify zero memory leaks or overflows.
   - **No-Cheating Heuristics**: Detects and rejects evasive patches (e.g., deleting critical function calls without safe alternatives or inserting premature unconditional returns).

4. **Module 4 (M4) — IoT Metrics & Explainability**:
   - Measures Flash/ROM byte delta, stack delta, and cyclomatic complexity changes.
   - Generates downloadable formal audit reports in JSON format.

---

## Benchmark Evaluation Results

| Benchmark Sample | CWE ID | Vulnerability Class | M1 Detection | M3 ASan Clean | Equivalence | Flash Delta | Status |
|---|---|---|---|---|---|---|---|
| `stack_overflow.c` | CWE-121 | Stack Buffer Overflow | ✓ Pass | ✓ Clean | ✓ Pass | +16 B | PASSED |
| `null_ptr_deref.c` | CWE-476 | NULL Pointer Dereference | ✓ Pass | ✓ Clean | ✓ Pass | +24 B | PASSED |
| `format_string.c` | CWE-134 | Uncontrolled Format String | ✓ Pass | ✓ Clean | ✓ Pass | +8 B | PASSED |
| `use_after_free.c` | CWE-416 | Use After Free | ✓ Pass | ✓ Clean | ✓ Pass | +16 B | PASSED |
| `integer_overflow.c` | CWE-190 | Integer Overflow in Buffer | ✓ Pass | ✓ Clean | ✓ Pass | +28 B | PASSED |
| `double_free.c` | CWE-415 | Double Free | ✓ Pass | ✓ Clean | ✓ Pass | +20 B | PASSED |
| `oob_write.c` | CWE-787 | Out-of-bounds Write | ✓ Pass | ✓ Clean | ✓ Pass | +22 B | PASSED |
| `cheat_early_return.c` | CHEAT-1 | Early Return Bypass | ✓ Caught | ⛔ Intercepted | ⛔ Blocked | -- | REJECTED |
| `cheat_deletion.c` | CHEAT-2 | Function Deletion Cheat | ✓ Caught | ⛔ Intercepted | ⛔ Blocked | -- | REJECTED |

- **Detection Recall**: 100%
- **Compile Rate**: 100%
- **ASan Clean Rate**: 100%
- **Equivalence Rate**: 100%
- **No-Cheating Rejection Rate**: 100%

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application runs on port 3000 at `http://localhost:3000`.
