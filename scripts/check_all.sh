#!/usr/bin/env bash
# scripts/check_all.sh — IoT ShieldAI Parallel Error Checker
# =============================================================
# REQUIRES: Git Bash or WSL on Windows. On native PowerShell, use check_all.ps1.
#
# Responsibility:
#   Run all quality checks in parallel (where independent) and report results.
#   Any failure causes the script to exit with a non-zero code.
#   This script is run automatically after every task as part of Section D.
#
# Usage:
#   bash scripts/check_all.sh          # run all checks
#   bash scripts/check_all.sh --fast   # skip slow checks (pytest, build)
#
# Checks performed:
#   1. Backend: python -m compileall (syntax)
#   2. Backend: ruff (lint)
#   3. Backend: pytest (unit tests, including /health)
#   4. Frontend: npm run lint
#   5. Frontend: npm run build
#   6. Demo firmware: gcc -fsyntax-only on all .c files
#   7. Docs: confirm PROJECT_HISTORY.md and SKILLS.md are not empty

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
FRONTEND_DIR="${REPO_ROOT}/frontend"
FIRMWARE_DIR="${REPO_ROOT}/datasets/demo_firmware"
FAST_MODE="${1:-}"

PASS=0
FAIL=0
declare -a ERRORS=()

run_check() {
    local name="$1"
    local cmd="$2"
    local dir="${3:-${REPO_ROOT}}"
    echo -n "  [CHECK] ${name} ... "
    if (cd "$dir" && eval "$cmd" > /tmp/check_output_$$.txt 2>&1); then
        echo "✓ PASS"
        ((PASS++)) || true
    else
        echo "✗ FAIL"
        ((FAIL++)) || true
        ERRORS+=("${name}: $(cat /tmp/check_output_$$.txt | tail -5)")
    fi
    rm -f /tmp/check_output_$$.txt
}

echo ""
echo "════════════════════════════════════════════════════"
echo "  IoT ShieldAI — check_all.sh"
echo "════════════════════════════════════════════════════"
echo ""

echo "── Backend checks ──────────────────────────────────"
run_check "Python compile check"  "python -m compileall -q app/"           "${BACKEND_DIR}"
run_check "Ruff lint"             "ruff check app/ --quiet"                 "${BACKEND_DIR}"
if [[ "$FAST_MODE" != "--fast" ]]; then
    run_check "Pytest"            "python -m pytest -q"                     "${BACKEND_DIR}"
fi

echo ""
echo "── Frontend checks ─────────────────────────────────"
if [[ -d "${FRONTEND_DIR}/node_modules" ]]; then
    run_check "ESLint"            "npm run lint --silent"                   "${FRONTEND_DIR}"
    if [[ "$FAST_MODE" != "--fast" ]]; then
        run_check "Vite build"    "npm run build"                           "${FRONTEND_DIR}"
    fi
else
    echo "  [SKIP] Frontend checks — node_modules not installed. Run: cd frontend && npm install"
fi

echo ""
echo "── Demo firmware syntax check ──────────────────────"
for c_file in "${FIRMWARE_DIR}"/*.c; do
    fname=$(basename "$c_file")
    run_check "gcc -fsyntax-only ${fname}" "gcc -fsyntax-only '${c_file}'"
done

echo ""
echo "── Documentation checks ────────────────────────────"
run_check "PROJECT_HISTORY.md exists and non-empty" \
    "test -s '${REPO_ROOT}/PROJECT_HISTORY.md'"
run_check "SKILLS.md exists and non-empty" \
    "test -s '${REPO_ROOT}/SKILLS.md'"

echo ""
echo "════════════════════════════════════════════════════"
echo "  Results: ${PASS} passed, ${FAIL} failed"
echo "════════════════════════════════════════════════════"

if [[ ${FAIL} -gt 0 ]]; then
    echo ""
    echo "ERRORS:"
    for err in "${ERRORS[@]}"; do
        echo "  ✗ ${err}"
    done
    echo ""
    exit 1
fi

echo "  All checks passed! ✓"
echo ""
