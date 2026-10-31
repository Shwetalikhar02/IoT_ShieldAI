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
| **M1: Analysis** | Static analyzer, code parser, localizer, severity, DL classifier | In Progress | Member 1 |
| **M2: Repair** | Template engine, fix templates, pluggable/mock LLM client, repair loop | In Progress | Member 2 |
| **M3: Verification** | Sandbox runner, compiler, sanitizer runner, real no-cheating check, feedback loop | In Progress | Member 3 |
| **M4: Explainability** | Grounded patch explainer, resource metrics (Flash/RAM delta), report builder | In Progress | Member 4 |
| **Frontend** | React + Vite UI, router, pages (Upload, Analyze, Repair, Verify, Report), diff viewer | Scaffolded (In Progress) | Member 4 |
| **Sandbox** | Dockerfile, container runner script, build config | Scaffolded (Not Started) | Member 3 |

---

## 3. Decisions Log

| Decision ID | Decision | Reason | Date |
|---|---|---|---|
| **DEC-001** | Use Pydantic v2 schemas for all data models across the pipeline | Provides strict data validation, OpenAPI compatibility, and serialisation speed across modules. | 2026-10-31 |
| **DEC-002** | Implement two-tier repair (deterministic templates first, LLM fallback second) | Guarantees zero hallucinations and instant fixes for standard CWEs, reserving LLM calls for complex contexts. | 2026-10-31 |
| **DEC-003** | Enforce AST "no-cheating" check in verification | Prevents LLMs from "fixing" sanitizer errors by commenting out functions or wiping buffers. | 2026-10-31 |
| **DEC-004** | Isolate C/C++ compilation and ASan execution in Docker | Untrusted firmware source code execution must never run directly on the host machine. | 2026-10-31 |
| **DEC-005** | Provide dual platform error checking scripts (`check_all.sh` and `check_all.ps1`) | Ensures seamless cross-platform verification on both Linux/macOS and Windows developer environments. | 2026-10-31 |

---

## 4. Known Issues

| Issue ID | Description | Impact | Mitigation / Next Steps |
|---|---|---|---|
| **ISSUE-001** | Frontend dependencies not installed by default in CI/fresh clone | `check_all` skips ESLint and Vite build if `node_modules` is missing | Team members must run `npm install` inside `frontend/` before frontend checks run. |
| **ISSUE-002** | Local GCC with ASan may require WSL/Linux or MSYS2 on Windows hosts | Running M3 verification directly on Windows host without Docker may fail | All verification runs are containerized via Docker sandbox (`sandbox/Dockerfile`). |

---

## 5. Plan Review Log

### Plan Review: Task #1 — Initial Base Repository Scaffolding & Documentation
- **Task**: Create complete base repository scaffold for IoT ShieldAI (FastAPI backend with GET /health, Vite React frontend, Pydantic schemas, demo firmware, documentation, skills system, and check scripts).
- **Issues Found in Initial Plan**:
  - Starter skill `review-implementation-plan` was missing from `.agent/skills/`.
  - Documentation files (`docs/architecture.md`, `docs/problem_mapping.md`, `docs/api_contract.md`, `README.md`, `SKILLS.md`, `PROJECT_HISTORY.md`) were ungenerated.
  - Git repository was not initialized with initial scaffold commit.
- **Fixes Applied**:
  - Created `.agent/skills/review-implementation-plan/SKILL.md` satisfying the Section B2 gate requirement.
  - Created `SKILLS.md` registry registering all 5 starter skills.
  - Authored comprehensive documentation in `docs/` and `README.md`.
  - Added `PROJECT_HISTORY.md` with Genesis, Module Status, Decisions, Known Issues, Plan Review Log, and Prompt Log.
  - Initialized git repository, added files, and committed initial scaffold.
- **Final Verdict**: APPROVED (Fixed then Approved)

### Plan Review: Task #2 — Connected 5-Feature Pipeline (F-A through F-E)
- **Task**: Implement unified localization, repair loop with escalation, hybrid DL + template repair with pluggable/mock LLM client, explainable patches, real AST no-cheating checks, and conversation-driven refinement.
- **Issues Found in Initial Plan**:
  - Needed to ensure no API keys or secrets are logged or exposed.
  - Needed to eliminate duplicate retry logic in `m3_verification/feedback_loop.py` and delegate solely to `pipeline/repair_loop.py`.
  - Required deterministic offline mock mode (`LLM_MOCK=True`) for reliable CI and demo evaluation.
- **Fixes Applied**:
  - Made `LLM_API_KEY` hidden from repr and documentation.
  - Defined `Feedback` schema in `repair_session.py` and refactored `feedback_loop.py` to act as pure transformer.
  - Added canned mock responses for all 5 demo firmware CWEs in `llm_client.py`.
- **Final Verdict**: APPROVED

---

## 6. Prompt Log

| # | Date/Time | Prompt Summary | Plan Review (Approved / Fixed then Approved) | What It Did | Files Created/Changed | Status | Errors Found and Fixed |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-31 17:30 UTC | Base repository scaffolding for IoT ShieldAI (Architecture, Pydantic v2 schemas, FastAPI GET /health, React+Vite frontend, 5 demo firmware samples, Docker sandbox, scripts, skills system, and project history) | Fixed then Approved | Scaffolding completion: Created missing docs (architecture, problem_mapping, api_contract), README.md, SKILLS.md registry, review-implementation-plan skill, PROJECT_HISTORY.md, initialized Git repository and created initial commit, ran verification suite. | `PROJECT_HISTORY.md`, `SKILLS.md`, `README.md`, `docs/architecture.md`, `docs/problem_mapping.md`, `docs/api_contract.md`, `.agent/skills/review-implementation-plan/SKILL.md`, `.git/` | Done | Missing docs and 5th starter skill detected during plan review; created all missing files and initialized git repository. |
| 2 | 2026-10-31 18:00 UTC | Connected 5-Feature Pipeline: F-A Unified Localization & Repair Loop, F-B Hybrid DL/Template Repair (Pluggable/Mock LLM), F-C Explainable Patches, F-D Real No-Cheating Check, F-E Conversation-Driven Repair | Approved | Implemented `localizer.py`, `repair_session.py`, `repair_loop.py`, `no_cheating_check.py`, `explainer.py`, `llm_client.py` (mock + adapters), `dl_classifier.py`, `template_engine.py`, updated repair routes & orchestrator, added unit tests, tracker rules, and project tracker. | `localizer.py`, `repair_session.py`, `repair_loop.py`, `no_cheating_check.py`, `explainer.py`, `llm_client.py`, `dl_classifier.py`, `template_engine.py`, `feedback_loop.py`, `orchestrator.py`, `repair.py`, `config.py`, `.env.example`, `PROJECT_TRACKER.md`, `tracker-rules.md`, `test_repair_loop.py` | Done | Refactored feedback_loop.py to remove duplicate retry logic; ensured zero API key leakage in logs. |
