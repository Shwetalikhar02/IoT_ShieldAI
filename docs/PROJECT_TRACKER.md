# IoT ShieldAI — Project Tracker

## 1. Feature Registry

| Feature ID | Feature Name | Description | Module | Status | Depends On |
|---|---|---|---|---|---|
| **F-0** | Base Repository Scaffold | FastAPI backend, Vite frontend, Pydantic v2 schemas, demo firmware, check scripts, project history. | All | Done | None |
| **F-A** | Unified Localization + Repair Loop | Code localizer (minimal context), `RepairSession` schemas, `repair_loop.py` engine, and updated repair route. | M1 / M2 / Pipeline | Done | F-0 |
| **F-B** | Hybrid DL + Template Repair | Pluggable `llm_client.py` (mock + adapters), `dl_classifier.py` LLM backend + CodeBERT hook, 3-tier repair routing. | M1 / M2 | Done | F-A |
| **F-C** | Explainable Patches | Grounded, structured explanation generator (`explainer.py`) explaining root causes, memory safety, and IoT metrics. | M4 | Done | F-B |
| **F-D** | No-Cheating Check | Real AST/lexical verification preventing deletion of calls, early returns, buffer wiping, or dummy patches. | M3 | Done | F-A |
| **F-E** | Conversation-Driven Repair | Interactive refinement loop allowing user constraints (max 5 per session) and session persistence. | M2 / API | Done | F-A, F-B, F-C, F-D |

---

## 2. Task Registry

| Task ID | Feature ID | Task Description | Assignee | Status | Commit |
|---|---|---|---|---|---|
| **T-001** | F-0 | Initial IoT ShieldAI base repository scaffold, docs, skills, and check_all script. | Lead Architect | Done | `d5cfd8d`, `4e0157e` |
| **T-002** | F-A | Implement Unified Localization (`localizer.py`), `repair_session.py` schemas, `repair_loop.py` engine, refactor `feedback_loop.py`, and update `/api/repair`. | Member 1 & 2 | Done | `feat(pipeline)` |
| **T-003** | F-B | Implement config settings, `llm_client.py` (with OpenAI/Anthropic adapters + deterministic mock), `dl_classifier.py`, and 3-tier repair routing. | Member 2 | Done | `feat(pipeline)` |
| **T-004** | F-C | Implement explainable patches in `explainer.py` with structured reasoning, memory safety rationale, and IoT footprint. | Member 4 | Done | `feat(pipeline)` |
| **T-005** | F-D | Implement real AST and lexical no-cheating check in `no_cheating_check.py` with violation tracking. | Member 3 | Done | `feat(pipeline)` |
| **T-006** | F-E | Implement conversation-driven repair endpoint (`/api/repair/{session_id}/refine`), user constraint injection, and session persistence. | Member 2 & 4 | Done | `feat(pipeline)` |
