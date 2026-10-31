# IoT ShieldAI — Full Codebase Audit

> Performed: 2026-10-31 ~19:15 IST (Task #3 Step 0)

## Legend
| Status | Meaning |
|---|---|
| **Done** | Fully implemented, functional, no TODOs in business logic |
| **Partial** | Core logic exists but incomplete (missing edge cases, integration, etc.) |
| **Stub** | File exists with correct structure but returns placeholder/mock data |
| **Missing** | File does not exist yet; required by the spec |
| **Broken** | File exists but has known defects or won't run |

---

## 1. Backend Core (`backend/app/core/`)

| File | Status | Notes |
|---|---|---|
| `config.py` | **Partial** | Works, loads from .env. **Missing**: `LLM_MODEL_STRONG`, `LLM_MODEL_FAST`, `LLM_MODEL_ESCALATION`, `MAX_REPAIR_ATTEMPTS`, `MAX_USER_REFINEMENTS`, `NOCHEAT_MIN_STATEMENT_RETENTION`, `NOCHEAT_MAX_LINES_OUTSIDE_SPAN`, `SANDBOX_MEMORY_LIMIT`, `SANDBOX_NETWORK_DISABLED`, `UPLOAD_DIR`, `REPORTS_DIR`, `DATABASE_URL`, `SEND_CODE_TO_EXTERNAL_LLM` fields. `LLM_API_KEY` has `repr=False` but not `SecretStr`. |
| `logger.py` | **Done** | structlog configured, dev/prod renderer. |

---

## 2. Backend Schemas (`backend/app/schemas/`)

| File | Status | Notes |
|---|---|---|
| `vulnerability.py` | **Done** | Pydantic v2, Severity enum, VulnerabilityList. Missing `confidence` field. |
| `patch.py` | **Done** | PatchStrategy enum, Patch model with diff. |
| `verification.py` | **Partial** | Model validator auto-computes status. **Missing**: `sanitizer_log`, `duration_seconds`, per-step PASS/FAIL/SKIPPED, `equivalence_passed` field, `functional_equivalence` check. |
| `report.py` | **Partial** | IoTMetrics + PipelineResult. **Missing**: `text_size`, `data_size`, `bss_size`, `stack_usage`, `runtime_ns` fields; `summary_html` for PDF. |
| `repair_session.py` | **Done** | LocalizationResult, Feedback, RepairAttempt, RepairSession, RefineSessionRequest. |
| `__init__.py` | **Done** | Exports all schemas. |

---

## 3. Backend API Routes (`backend/app/api/routes/`)

| File | Status | Notes |
|---|---|---|
| `upload.py` | **Stub** | Returns `{"status": "stub"}`. No file handling. |
| `analyze.py` | **Stub** | Returns `VulnerabilityList(total=0, vulnerabilities=[])`. No M1 integration. |
| `repair.py` | **Done** | Integrated with `repair_loop.py`, supports start/get/refine. Uses session-based URLs. **Missing**: session_id-based routing per spec (`/api/repair/{session_id}`). |
| `verify.py` | **Stub** | Returns all-false VerificationResult. No sandbox integration. |
| `report.py` | **Stub** | Always returns 404. No persistence, no PDF/JSON download. |
| **Missing routes** | **Missing** | `POST /api/pipeline/run/{session_id}`, `GET /api/pipeline/stream/{session_id}` (SSE), `GET /api/session/{session_id}`, `GET /api/demo/samples`, `POST /api/demo/load/{sample_id}`, `GET /api/report/{session_id}?format=json|pdf`. |

---

## 4. Backend Modules — M1 Analysis (`backend/app/modules/m1_analysis/`)

| File | Status | Notes |
|---|---|---|
| `static_analyzer.py` | **Stub** | Returns `[]`. No cppcheck/semgrep subprocess. |
| `code_parser.py` | **Stub** | Returns `{}`. No tree-sitter or libclang. |
| `localizer.py` | **Done** | Regex-based function finder, context extraction, symbol extraction. Works. |
| `root_cause.py` | **Stub** | Returns hardcoded string. No CWE→template mapping. |
| `severity.py` | **Partial** | Static CWE→Severity map covers 8 CWEs. Works but no context escalation. |
| `dl_classifier.py` | **Partial** | LLMVulnClassifier + CodeBERT hook. ClassificationResult schema. Functional with mock LLM. |

---

## 5. Backend Modules — M2 Repair (`backend/app/modules/m2_repair/`)

| File | Status | Notes |
|---|---|---|
| `llm_client.py` | **Done** | MockLLMClient with canned patches for all 5 CWEs. OpenAICompatibleClient implemented. **Missing**: AnthropicClient, GeminiClient, DeepSeekClient; multi-model routing (strong/fast/escalation). |
| `template_engine.py` | **Done** | 5 template handlers (CWE-121/476/134/416/190). `apply_template()` works. |
| `patch_generator.py` | **Stub** | Returns `None`. Not wired — repair_loop.py calls template_engine + llm_client directly. |
| `patch_applier.py` | **Stub** | Returns original path unchanged. No file writing. |
| `prompt_builder.py` | **Stub** | Returns basic dict. Not used by repair_loop (it builds prompts inline). |
| `fix_templates/` | **Partial** | Directory exists with `README.md` only. No individual template YAML/JSON files. |

---

## 6. Backend Modules — M3 Verification (`backend/app/modules/m3_verification/`)

| File | Status | Notes |
|---|---|---|
| `compiler.py` | **Stub** | Returns `{"success": False}`. No subprocess. |
| `sanitizer_runner.py` | **Stub** | Returns `{"passed": False}`. No subprocess. |
| `no_cheating_check.py` | **Done** | 5 checks: empty, identity, bypass return, call deletion, truncation. Works. **Missing**: statement retention threshold from config, max-lines-outside-span. |
| `feedback_loop.py` | **Done** | Pure transformer. Converts VerificationResult → Feedback. |

---

## 7. Backend Modules — M4 Explainability (`backend/app/modules/m4_explain_iot/`)

| File | Status | Notes |
|---|---|---|
| `explainer.py` | **Done** | GroundedExplanation schema, LLM-backed with fallback. Produces Markdown. |
| `resource_metrics.py` | **Stub** | Returns empty IoTMetrics. No `size`/`-fstack-usage` subprocess. |
| `report_builder.py` | **Stub** | Returns near-empty PipelineResult. No Jinja2/PDF/JSON export. |

---

## 8. Pipeline (`backend/app/pipeline/`)

| File | Status | Notes |
|---|---|---|
| `orchestrator.py` | **Partial** | `run_analysis()` returns `[]`. `run_repair()` delegates to repair_loop. `run_pipeline()` orchestrates but with no real M1 findings. Hardcoded IoTMetrics. |
| `repair_loop.py` | **Done** | Multi-tier escalation (Template → Template-Guided LLM → Free LLM), verification (no-cheating + basic syntax), M4 explanation, session persistence, refinement. **Issue**: verification is inline mock (not calling real sandbox/compiler/sanitizer). |

---

## 9. Backend Tests (`backend/app/tests/`)

| File | Status | Notes |
|---|---|---|
| `test_health.py` | **Done** | Tests GET /health. |
| `test_schemas.py` | **Done** | Tests schema construction and validation. |
| `test_repair_loop.py` | **Partial** | Tests repair loop and refinement. Needs expansion. |

---

## 10. Frontend (`frontend/src/`)

| File | Status | Notes |
|---|---|---|
| `main.jsx` | **Done** | React entry point. |
| `App.jsx` | **Partial** | Routes defined but no layout/navbar. Missing session state management. |
| `index.css` | **Partial** | Tailwind + basic custom styles. |
| `services/api.js` | **Stub** | All endpoint functions `throw new Error('not yet implemented')` except `checkHealth`. |
| `pages/UploadPage.jsx` | **Partial** | UI rendered, drag-drop shell, demo buttons. No API integration. |
| `pages/AnalysisPage.jsx` | **Stub** | Static placeholder, no data fetch. |
| `pages/RepairPage.jsx` | **Stub** | Static placeholder, no diff viewer. |
| `pages/VerificationPage.jsx` | **Stub** | Static placeholder, no verification data. |
| `pages/ReportPage.jsx` | **Stub** | Static placeholder, no report fetch. |
| `components/PipelineStepper.jsx` | **Partial** | Visual stepper component exists but not wired. |
| `components/VulnCard.jsx` | **Partial** | Card component exists but uses placeholder data. |
| `components/CodeDiffViewer.jsx` | **Partial** | Basic diff display but no syntax highlighting. |
| `components/MetricsChart.jsx` | **Partial** | Bar chart component exists but no real data. |
| `components/SeverityBadge.jsx` | **Done** | Simple badge component. |
| **Missing components** | **Missing** | `VerificationPanel`, `AttemptsTimeline`, `ChatRefine`, `Toast/ErrorBanner`. |

---

## 11. Sandbox (`sandbox/`)

| File | Status | Notes |
|---|---|---|
| `Dockerfile` | **Partial** | Ubuntu 22.04 with gcc, clang, cppcheck, semgrep. **Missing**: `binutils` (for `size` command), `libasan`/`libubsan` explicit install, tree-sitter, non-root user, read-only root, tmpfs, network isolation flags. |
| `run_in_sandbox.sh` | **Partial** | Shell wrapper exists. Not integrated with backend. |
| **Missing** | **Missing** | `run_in_sandbox.py` (Python wrapper), backend integration to invoke sandbox commands. |

---

## 12. Demo Firmware (`datasets/demo_firmware/`)

| File | Status | Notes |
|---|---|---|
| `stack_overflow.c` | **Done** | CWE-121, compiles, has ASan trigger comment. |
| `null_ptr_deref.c` | **Done** | CWE-476. |
| `format_string.c` | **Done** | CWE-134. |
| `use_after_free.c` | **Done** | CWE-416. |
| `integer_overflow.c` | **Done** | CWE-190. |
| **Missing** | **Missing** | `exploit_input`, `benign_input`, `expected.json` for each sample. No cheating patch sample. |

---

## 13. Scripts (`scripts/`)

| File | Status | Notes |
|---|---|---|
| `check_all.ps1` | **Done** | PowerShell check script. |
| `check_all.sh` | **Done** | Bash check script. |
| `run_pipeline.py` | **Partial** | CLI runner exists. |
| `setup.sh` | **Done** | Setup script. |

---

## 14. Configuration & Infra

| File | Status | Notes |
|---|---|---|
| `.env.example` | **Partial** | Missing many required variables from spec. |
| `docker-compose.yml` | **Partial** | Three services defined. **Missing**: backend/frontend Dockerfiles, `.env` passthrough for all vars, sandbox security flags. |
| `backend/pyproject.toml` | **Done** | Ruff config. |
| `frontend/package.json` | **Done** | React 18, Vite, Tailwind, Router, Axios. |
| **Missing** | **Missing** | `backend/Dockerfile`, `frontend/Dockerfile`, `PROJECT_TRACKER.md`, `frontend/.env`. |

---

## Summary Statistics

| Category | Done | Partial | Stub | Missing |
|---|---|---|---|---|
| Backend Core | 1 | 1 | 0 | 0 |
| Schemas | 3 | 2 | 0 | 0 |
| API Routes | 1 | 0 | 4 | 6 endpoints |
| M1 Analysis | 1 | 2 | 3 | 0 |
| M2 Repair | 2 | 1 | 3 | 0 |
| M3 Verification | 2 | 0 | 2 | 0 |
| M4 Explainability | 1 | 0 | 2 | 0 |
| Pipeline | 1 | 1 | 0 | 0 |
| Frontend Pages | 0 | 1 | 4 | 0 |
| Frontend Components | 1 | 3 | 0 | 4 components |
| Frontend Services | 0 | 0 | 1 | 0 |
| Sandbox | 0 | 2 | 0 | 1 |
| Demo Data | 5 | 0 | 0 | 15 files |
| Config/Infra | 2 | 2 | 0 | 4 |
| **Totals** | **20** | **15** | **19** | **30+** |
