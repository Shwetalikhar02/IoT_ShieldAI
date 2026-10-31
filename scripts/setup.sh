#!/usr/bin/env bash
# scripts/setup.sh — One-Shot Development Environment Setup
# ==========================================================
# REQUIRES: Git Bash or WSL on Windows.
# Installs all backend and frontend dependencies.
#
# Usage:
#   bash scripts/setup.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "🛡️  IoT ShieldAI — Development Setup"
echo "══════════════════════════════════════"
echo ""

# ── Copy .env if missing ──────────────────────────────────────────────────────
if [[ ! -f "${REPO_ROOT}/.env" ]]; then
    cp "${REPO_ROOT}/.env.example" "${REPO_ROOT}/.env"
    echo "✓ Created .env from .env.example — please fill in LLM_API_KEY"
else
    echo "✓ .env already exists"
fi

# ── Backend ───────────────────────────────────────────────────────────────────
echo ""
echo "── Backend Setup ───────────────────────────────────"
cd "${REPO_ROOT}/backend"

if ! command -v python3 &>/dev/null; then
    echo "✗ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

echo "  Creating virtual environment..."
python3 -m venv .venv

echo "  Activating and installing dependencies..."
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo "✓ Backend dependencies installed"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "── Frontend Setup ──────────────────────────────────"
cd "${REPO_ROOT}/frontend"

if ! command -v node &>/dev/null; then
    echo "✗ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "  Installing npm packages..."
npm install --silent

echo "✓ Frontend dependencies installed"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "✓ Setup complete!"
echo ""
echo "  Start backend:   cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "  Start frontend:  cd frontend && npm run dev"
echo "  Run checks:      bash scripts/check_all.sh"
echo ""
