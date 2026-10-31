# .agent/rules/project-conventions.md — IoT ShieldAI Project Conventions
# =========================================================================
# These conventions apply to ALL code, documentation, and tools in the project.

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Python modules | snake_case | `static_analyzer.py` |
| Python classes | PascalCase | `VulnerabilityList` |
| Python constants | UPPER_SNAKE | `MAX_ATTEMPTS = 3` |
| React components | PascalCase | `VulnCard.jsx` |
| React pages | PascalCase + "Page" | `UploadPage.jsx` |
| CSS classes | kebab-case or Tailwind | `.badge-critical` |
| API routes | kebab-case | `/api/upload`, `/api/analyze` |
| Git branches | `feature/<name>`, `fix/<name>` | `feature/m1-static-analyzer` |

## Module Ownership

| Module | Owner | Files |
|--------|-------|-------|
| M1 Analysis | Member 1 | `app/modules/m1_analysis/` |
| M2 Repair | Member 2 | `app/modules/m2_repair/` |
| M3 Verification + Sandbox | Member 3 | `app/modules/m3_verification/`, `sandbox/` |
| M4 + Frontend | Member 4 | `app/modules/m4_explain_iot/`, `frontend/` |

## Code Style

- **Python**: PEP 8, enforced by ruff. Max line length: 100 chars.
- **JavaScript/JSX**: ESLint with React plugin. Prefer functional components + hooks.
- **C Demo Files**: Each file must have a CWE header comment, compile with gcc, and have a `main()`.
- **Docstrings**: Every Python module must have a module docstring with Responsibility/Inputs/Outputs/TODO.
- **Stub files**: Stubs return minimal valid data (not `None` if a schema object is expected).

## Security Rules

- **NEVER** commit `.env` or any file containing real API keys.
- **NEVER** hard-code API keys, passwords, or tokens in Python/JS source files.
- **ALWAYS** load secrets from `settings` (Pydantic BaseSettings) in Python, or from Vite env vars in JS.
- **ALWAYS** validate file uploads: check extension, size, and content type.

## Git Workflow

- Commit after every task with a conventional commit message:
  - `feat:` — new feature or module
  - `fix:` — bug fix
  - `chore:` — scaffolding, config, docs
  - `test:` — adding or updating tests
  - `docs:` — documentation only
- Every commit must pass `check_all` before pushing.

## Documentation Rules

- PROJECT_HISTORY.md must be updated after every task (use the `update-history-log` skill).
- SKILLS.md must be updated when a new skill is created.
- All architecture decisions must be recorded in the "Decisions Log" of PROJECT_HISTORY.md.
