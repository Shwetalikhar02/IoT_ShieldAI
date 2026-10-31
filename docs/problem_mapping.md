# IoT ShieldAI — Problem Mapping & Technical Scope

## 1. Hackathon Challenge Context
- **Problem Statement**: Autonomous detection, repair, and rigorous verification of vulnerabilities in C/C++ IoT firmware using LLMs and deterministic engines.
- **Time Limit**: 24-hour hackathon.
- **Team Size**: 4 members.

---

## 2. Why IoT Firmware Repair is Unique
Unlike cloud microservices or web applications, repairing IoT firmware requires special handling of resource and hardware constraints:

1. **Strict Memory Constraints (RAM/Flash)**:
   - Typical microcontrollers (e.g. ARM Cortex-M0/M4, ESP32, STM32) have SRAM ranging from 16 KB to 512 KB and Flash under 2 MB.
   - Patches cannot introduce heavy memory allocations, unbounded recursion, or bloated runtime libraries.
2. **Direct Hardware & Pointer Semantics**:
   - Firmware code frequently interacts with memory-mapped registers (MMIO), volatile variables, and direct pointer arithmetic.
   - Generic code transformation tools often break low-level timing or register access semantics.
3. **The "Cheat Patch" Problem in LLMs**:
   - When asked to fix an ASan error, generic LLMs often "cheat" by commenting out the vulnerable function call, returning `0` immediately, or truncating buffers to zero.
   - In IoT devices, suppressing logic breaks sensor polling, actuator control, or communication protocols. IoT ShieldAI prevents this via AST-level `no-cheating` verification.
4. **Real-Time Determinism**:
   - Adding blocking loops, mutex contention, or unbounded string processing can trigger watchdog timer (WDT) resets or disrupt control loops.

---

## 3. Targeted CWE Mapping & Firmware Vulnerability Benchmark

| CWE ID | Vulnerability Class | IoT Firmware Occurrence | Demo Sample |
|---|---|---|---|
| **CWE-121** | Stack Buffer Overflow | Unchecked `strcpy`, `sprintf`, `gets` reading packets from radio/UART into small stack buffers. | `datasets/demo_firmware/stack_overflow.c` |
| **CWE-476** | NULL Pointer Dereference | Unchecked `malloc` or unvalidated pointer from packet decoder under low-memory (OOM) conditions. | `datasets/demo_firmware/null_ptr_deref.c` |
| **CWE-134** | Format String Vulnerability | Direct pass of user/sensor input strings into `printf` or logging macros without format specifiers. | `datasets/demo_firmware/format_string.c` |
| **CWE-416** | Use-After-Free | Packet or telemetry buffer freed in callback handler but accessed in subsequent processing routines. | `datasets/demo_firmware/use_after_free.c` |
| **CWE-190** | Integer Overflow | Arithmetic overflow in packet length calculations leading to undersized buffer allocation. | `datasets/demo_firmware/integer_overflow.c` |

---

## 4. Multi-Tier Remediation Strategy
To achieve reliable results within a 24-hour hackathon timeframe, IoT ShieldAI implements a two-tier repair model:
1. **Tier 1 (Deterministic Rule Templates)**: High-precision regex and AST transformations for standard unsafe patterns (e.g., `strcpy(dst, src)` $\to$ `strncpy(dst, src, sizeof(dst) - 1)` with explicit null-termination). Zero hallucinations and instant execution.
2. **Tier 2 (Few-Shot LLM Generation with ASan Feedback)**: For complex or context-dependent bugs, prompts are synthesized with strict IoT constraints. If the patch fails compilation or ASan checks in M3, stderr diagnostic logs are provided back to the model for iterative refinement (max 3 rounds).
