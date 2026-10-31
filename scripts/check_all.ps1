# scripts/check_all.ps1 — IoT ShieldAI Parallel Error Checker (Windows PowerShell)
# ==================================================================================
# Windows-native companion to check_all.sh.
# Run from the repo root: pwsh -File scripts/check_all.ps1
#
# Requirements:
#   - Python 3.11+ in PATH
#   - Node.js 18+ in PATH
#   - gcc (via MSYS2/MinGW or WSL) for the firmware syntax check (optional)
#
# TODO: Add parallel job execution using PowerShell jobs for faster runs.

param([switch]$Fast)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendDir  = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$FirmwareDir = Join-Path $RepoRoot "datasets\demo_firmware"

$Pass = 0
$Fail = 0
$Errors = @()

function Run-Check {
    param([string]$Name, [scriptblock]$Cmd, [string]$Dir = $RepoRoot)
    Write-Host -NoNewline "  [CHECK] $Name ... "
    Push-Location $Dir
    try {
        & $Cmd *>&1 | Out-Null
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
            Write-Host "✓ PASS" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red
            $script:Fail++
            $script:Errors += $Name
        }
    } catch {
        Write-Host "✗ ERROR: $_" -ForegroundColor Red
        $script:Fail++
        $script:Errors += $Name
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════"
Write-Host "  IoT ShieldAI — check_all.ps1"
Write-Host "════════════════════════════════════════════════════"
Write-Host ""

Write-Host "── Backend checks ──────────────────────────────────"
Run-Check "Python compile check" { python -m compileall -q app/ } $BackendDir
Run-Check "Ruff lint"            { python -m ruff check app/ --quiet } $BackendDir
if (-not $Fast) {
    Run-Check "Pytest" { python -m pytest -q } $BackendDir
}

Write-Host ""
Write-Host "── Frontend checks ─────────────────────────────────"
$nodeModules = Join-Path $FrontendDir "node_modules"
if (Test-Path $nodeModules) {
    Run-Check "ESLint" { npm run lint --silent } $FrontendDir
    if (-not $Fast) {
        Run-Check "Vite build" { npm run build } $FrontendDir
    }
} else {
    Write-Host "  [SKIP] Frontend checks — run: cd frontend; npm install"
}

Write-Host ""
Write-Host "── Documentation checks ────────────────────────────"
Run-Check "PROJECT_HISTORY.md non-empty" {
    if ((Get-Item "$RepoRoot\PROJECT_HISTORY.md").Length -gt 0) { exit 0 } else { exit 1 }
} $RepoRoot
Run-Check "SKILLS.md non-empty" {
    if ((Get-Item "$RepoRoot\SKILLS.md").Length -gt 0) { exit 0 } else { exit 1 }
} $RepoRoot

Write-Host ""
Write-Host "════════════════════════════════════════════════════"
Write-Host "  Results: $Pass passed, $Fail failed"
Write-Host "════════════════════════════════════════════════════"

if ($Fail -gt 0) {
    Write-Host ""
    Write-Host "ERRORS:" -ForegroundColor Red
    $Errors | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Red }
    exit 1
}

Write-Host "  All checks passed! ✓" -ForegroundColor Green
