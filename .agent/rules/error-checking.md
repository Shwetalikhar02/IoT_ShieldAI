# .agent/rules/error-checking.md — Parallel Error Checking Rules
# ================================================================
# This file defines the error-checking procedure that MUST be run after
# every implementation task in IoT ShieldAI.  See Section D of the prompt.

## When to Run

Run **after every task**, including:
- Adding or modifying any Python file
- Adding or modifying any React/JS file
- Adding or modifying any C demo firmware file
- Adding or modifying PROJECT_HISTORY.md or SKILLS.md

## How to Run

**On Windows (PowerShell):**
```powershell
pwsh -File scripts/check_all.ps1
```

**On Linux/macOS/Git Bash/WSL:**
```bash
bash scripts/check_all.sh
```

**Fast mode** (skips pytest and Vite build — use mid-task for quick lint checks):
```bash
bash scripts/check_all.sh --fast
```

## Checks Performed (in parallel where possible)

| # | Check | Command | Failure Action |
|---|-------|---------|---------------|
| 1 | Python syntax | `python -m compileall -q app/` | Fix syntax errors immediately |
| 2 | Ruff lint | `ruff check app/ --quiet` | Fix lint errors or add `# noqa` with justification |
| 3 | Pytest | `python -m pytest -q` | Fix failing tests; do NOT comment them out |
| 4 | ESLint | `npm run lint --silent` | Fix JS/JSX errors |
| 5 | Vite build | `npm run build` | Fix build errors before marking task Done |
| 6 | GCC syntax | `gcc -fsyntax-only *.c` on demo files | Fix C syntax errors |
| 7 | Docs check | `test -s PROJECT_HISTORY.md && test -s SKILLS.md` | Update the missing file |

## Handling Failures

1. **Fix the error** in the source file.
2. **Re-run the failed check** to confirm it passes.
3. **Log the error and fix** in the "Errors Found and Fixed" column of PROJECT_HISTORY.md (use the `update-history-log` skill).
4. **Do NOT mark a task as Done** until all checks pass.

## Fast-Path Exception

If a check is inapplicable (e.g., `gcc` not installed on Windows for firmware checks),
log "N/A — tool not available on host OS" in the check column and note that the
sandbox Docker image will catch it during CI.
