# scripts/check_all.ps1 — IoT ShieldAI Parallel Error Checker (Windows PowerShell)
# ==================================================================================
# Companion to check_all.sh for Windows environments.
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts/check_all.ps1

param([switch]$Fast)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendDir  = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$FirmwareDir = Join-Path $RepoRoot "datasets\demo_firmware"

# Detect Python interpreter (prefer virtual environments if present)
$PythonCmd = "python"
if (Test-Path "$BackendDir\.venv\Scripts\python.exe") {
    $PythonCmd = "$BackendDir\.venv\Scripts\python.exe"
} elseif (Test-Path "$RepoRoot\.venv\Scripts\python.exe") {
    $PythonCmd = "$RepoRoot\.venv\Scripts\python.exe"
}

$Pass = 0
$Fail = 0
$Errors = @()

function Run-Check {
    param([string]$Name, [scriptblock]$Cmd, [string]$Dir = $RepoRoot)
    Write-Host -NoNewline "  [CHECK] $Name ... "
    Push-Location $Dir
    $global:LASTEXITCODE = 0
    try {
        & $Cmd *>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[PASS]" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "[FAIL]" -ForegroundColor Red
            $script:Fail++
            $script:Errors += $Name
        }
    } catch {
        Write-Host "[FAIL]" -ForegroundColor Red
        $script:Fail++
        $script:Errors += $Name
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "===================================================="
Write-Host "  IoT ShieldAI - check_all.ps1"
Write-Host "===================================================="
Write-Host ""

Write-Host "-- Backend checks ----------------------------------"
Run-Check "Python compile check" { & $PythonCmd -m compileall -q app/ } $BackendDir

# Check if ruff is installed
$hasRuff = & $PythonCmd -c "import ruff" 2>$null
if ($LASTEXITCODE -eq 0) {
    Run-Check "Ruff lint" { & $PythonCmd -m ruff check app/ --quiet } $BackendDir
} else {
    Write-Host "  [SKIP] Ruff not installed - run: pip install ruff"
}

# Check if fastapi & pytest are installed
$hasFastAPI = & $PythonCmd -c "import fastapi, pydantic" 2>$null
if ($LASTEXITCODE -eq 0) {
    Run-Check "FastAPI import & health check" {
        & $PythonCmd -c "from app.main import app; from fastapi.testclient import TestClient; client = TestClient(app); res = client.get('/health'); assert res.status_code == 200 and res.json()['status'] == 'ok'"
    } $BackendDir
} else {
    Write-Host "  [SKIP] FastAPI/Pydantic not in Python environment - run: pip install -r backend/requirements.txt"
}

$hasPytest = & $PythonCmd -c "import pytest" 2>$null
if ($hasPytest -and (-not $Fast)) {
    Run-Check "Pytest suite" { & $PythonCmd -m pytest -q } $BackendDir
} elseif (-not $hasPytest) {
    Write-Host "  [SKIP] Pytest not installed - run: pip install pytest"
}

Write-Host ""
Write-Host "-- Demo firmware checks ----------------------------"
$gccExists = Get-Command gcc -ErrorAction SilentlyContinue
if ($gccExists) {
    $cFiles = Get-ChildItem -Path $FirmwareDir -Filter "*.c"
    foreach ($file in $cFiles) {
        Run-Check "gcc syntax check: $($file.Name)" { gcc -fsyntax-only $file.FullName } $FirmwareDir
    }
} else {
    Write-Host "  [SKIP] gcc not found in PATH (syntax check runs in Docker sandbox)"
}

Write-Host ""
Write-Host "-- Frontend checks ---------------------------------"
$nodeModules = Join-Path $FrontendDir "node_modules"
if (Test-Path $nodeModules) {
    Run-Check "ESLint" { npm run lint --silent } $FrontendDir
    if (-not $Fast) {
        Run-Check "Vite build" { npm run build } $FrontendDir
    }
} else {
    Write-Host "  [SKIP] Frontend checks - node_modules not installed. Run: cd frontend; npm install"
}

Write-Host ""
Write-Host "-- Documentation checks ----------------------------"
Run-Check "PROJECT_HISTORY.md non-empty" {
    $f = Get-Item "$RepoRoot\PROJECT_HISTORY.md" -ErrorAction Stop
    if ($f.Length -le 0) { throw "File is empty" }
} $RepoRoot

Run-Check "SKILLS.md non-empty" {
    $f = Get-Item "$RepoRoot\SKILLS.md" -ErrorAction Stop
    if ($f.Length -le 0) { throw "File is empty" }
} $RepoRoot

Run-Check "README.md non-empty" {
    $f = Get-Item "$RepoRoot\README.md" -ErrorAction Stop
    if ($f.Length -le 0) { throw "File is empty" }
} $RepoRoot

Run-Check "docs/ directory complete" {
    if (-not (Test-Path "$RepoRoot\docs\architecture.md")) { throw "Missing architecture.md" }
    if (-not (Test-Path "$RepoRoot\docs\problem_mapping.md")) { throw "Missing problem_mapping.md" }
    if (-not (Test-Path "$RepoRoot\docs\api_contract.md")) { throw "Missing api_contract.md" }
} $RepoRoot

Write-Host ""
Write-Host "===================================================="
Write-Host "  Results: $Pass passed, $Fail failed"
Write-Host "===================================================="

if ($Fail -gt 0) {
    Write-Host ""
    Write-Host "ERRORS:" -ForegroundColor Red
    $Errors | ForEach-Object { Write-Host "  [FAIL] $_" -ForegroundColor Red }
    exit 1
}

Write-Host ""
Write-Host "  All executed checks passed successfully! [OK]" -ForegroundColor Green
Write-Host ""
