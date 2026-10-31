# IoT ShieldAI — Project History & Audit Log

---

## 1. Project Genesis

- **Project Name**: IoT ShieldAI
- **Problem Statement**: LLM-based autonomous vulnerability detection, repair, and verification for IoT firmware written in C/C++.
- **Team Size**: 4 members
- **Time Limit**: 24-hour hackathon
- **Tech Stack**:
  - **Backend**: Python 3.11, FastAPI, Pydantic v2, Uvicorn, Ruff, Pytest
  - **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios
  - **Sandbox**: Docker container with GCC, Clang, Cppcheck, Semgrep, AddressSanitizer (ASan), UndefinedBehaviorSanitizer (UBSan)
  - **LLM Integration**: Pluggable client (Gemini, OpenAI, or self-hosted models like DeepSeek-Coder / CodeLlama) configured via `.env`
- **Core Modules**:
  - **Module 1 (M1 Analysis)**: Static analysis, code parsing, root cause analysis, severity assessment, DL classifier.
  - **Module 2 (M2 Repair)**: Deterministic fix templates, prompt builder, LLM fallback client, patch generator and applier.
  - **Module 3 (M3 Verification)**: Sandbox compilation, sanitizer runner (ASan/UBSan), AST-based no-cheating check, feedback loop.
  - **Module 4 (M4 Explainability & IoT Metrics)**: Patch explanation, binary ROM/RAM/stack resource impact measurement, report generation.

---

## 2. Module Status

| Module | Scope / Component | Status | Lead / Assignee |
|---|---|---|---|
| **M1: Analysis** | Static analyzer, regex scanner, AST tokenizer, CVSS severity classification | Done | Lead Engineer |
| **M2: Repair** | Multi-tier repair engine, deterministic templates, conversational refinement | Done | Lead Engineer |
| **M3: Verification** | Compiler check, ASan/UBSan simulator, anti-cheating bypass verification | Done | Lead Engineer |
| **M4: Explainability** | IoT resource metrics (Flash/ROM delta, SRAM/Stack delta), audit report builder | Done | Lead Engineer |
| **Frontend IDE** | Full React AI Code IDE with Monaco Editor, DiffEditor, FileTree, ChatRefine | Done | Lead Engineer |
| **Benchmark Suite** | Automated benchmark evaluation across all demo & Juliet samples | Done | Lead Engineer |

---

## 3. Decisions Log

| Decision ID | Decision | Reason | Date |
|---|---|---|---|
| **DEC-001** | Use Pydantic v2 schemas for all data models across the pipeline | Provides strict data validation, OpenAPI compatibility, and serialisation speed across modules. | 2026-10-31 |
| **DEC-002** | Implement two-tier repair (deterministic templates first, LLM fallback second) | Guarantees zero hallucinations and instant fixes for standard CWEs, reserving LLM calls for complex contexts. | 2026-10-31 |
| **DEC-003** | Enforce AST "no-cheating" check in verification | Prevents LLMs from "fixing" sanitizer errors by commenting out functions or wiping buffers. | 2026-10-31 |
| **DEC-004** | Isolate C/C++ compilation and ASan execution in Docker | Untrusted firmware source code execution must never run directly on the host machine. | 2026-10-31 |
| **DEC-005** | Provide dual platform error checking scripts (`check_all.sh` and `check_all.ps1`) | Ensures seamless cross-platform verification on both Linux/macOS and Windows developer environments. | 2026-10-31 |
| **DEC-006** | Rewrite imported dynamic project as self-contained React AI Code IDE with Monaco Editor | Adheres to AI Studio cross-framework rewrite requirements while implementing the Problem Statement 15 IDE vision. | 2026-10-31 |

---

## 4. Known Issues

| Issue ID | Description | Impact | Mitigation / Next Steps |
|---|---|---|---|
| **ISSUE-001** | External cloud LLM calls require API keys | Offline mock mode default | Application defaults to `LLM_MOCK=true` with 100% offline coverage for all 5 demo CWEs. |

---

## 5. Plan Review Log

### Plan Review: Task #1 — Initial Base Repository Scaffolding & Documentation
- **Verdict**: APPROVED (Fixed then Approved)

### Plan Review: Task #2 — Connected 5-Feature Pipeline (F-A through F-E)
- **Verdict**: APPROVED

### Plan Review: Task #3 — Cross-Framework Rewrite to React AI Code IDE (Problem Statement 15)
- **Task**: Rewrite imported repository into a production-grade React AI Code IDE (Monaco Editor in center, inline AI repair with DiffEditor, right-hand Verify Panel, bottom ChatRefine console, 5 demo samples + Juliet cases, No-Cheating verification demo, and benchmark suite).
- **Issues Found in Initial Plan**:
  - Needed to ensure `@monaco-editor/react` is the sole editor and compiles cleanly under Vite port 3000.
  - Needed to include the deliberate cheating patch test requested for demonstrating that M3 No-Cheating checks catch adversarial sanitizer bypasses.
  - Needed to maintain complete offline reliability with zero network dependencies.
- **Fixes Applied**:
  - Structured application as an integrated AI Code IDE with Monaco Editor + DiffEditor.
  - Implemented M1 static scanner, M2 template & refinement repair, M3 compiler & ASan & anti-cheat verifier, and M4 IoT metrics as modular client-side services.
  - Added dedicated Cheating Demonstration modal showing why lazy deletions or return bypasses are rejected.
  - Added automated Benchmark Suite modal measuring detection recall, compile rate, ASan-clean rate, equivalence rate, and cheat rejection rate.
- **Final Verdict**: APPROVED

---

## 6. Prompt Log

| # | Date/Time | Prompt Summary | Plan Review (Approved / Fixed then Approved) | What It Did | Files Created/Changed | Status | Errors Found and Fixed |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-31 17:30 UTC | Base repository scaffolding for IoT ShieldAI | Fixed then Approved | Scaffolding completion: Created missing docs, README, SKILLS registry, PROJECT_HISTORY, git repo. | `PROJECT_HISTORY.md`, `SKILLS.md`, `README.md`, `docs/*` | Done | Missing docs and 5th starter skill detected during plan review; created all missing files and initialized git repository. |
| 2 | 2026-10-31 18:00 UTC | Connected 5-Feature Pipeline | Approved | Implemented `localizer.py`, `repair_session.py`, `repair_loop.py`, `no_cheating_check.py`, `explainer.py`, `llm_client.py`. | Backend modules, test suite | Done | Refactored feedback_loop.py to remove duplicate retry logic; ensured zero API key leakage in logs. |
| 3 | 2026-10-31 18:30 UTC | Cross-framework rewrite to React AI Code IDE (Problem Statement 15) | Approved | Rewrote application into a React AI Code IDE with Monaco Editor, DiffEditor, FileTree, VerifyPanel, BottomConsole (ChatRefine + SSE), Benchmark Suite, and Cheating Demo. Cleaned up original files. | `package.json`, `index.html`, `vite.config.js`, `src/*`, `README.md`, `PROJECT_HISTORY.md` | Done | Configured Monaco Editor, Tailwind theme, and full M1-M4 pipeline running seamlessly offline on port 3000. |
