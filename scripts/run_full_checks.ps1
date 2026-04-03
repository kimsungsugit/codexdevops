$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "backend\.venv\Scripts\python.exe not found. Create the CPython 3.12 venv first."
}

Write-Host "== Backend unit + integration =="
& $python -m pytest `
    tests/unit/test_export_suts_vectorcast.py `
    tests/unit/test_generate_periodic_reports.py `
    tests/unit/test_app_factory.py `
    tests/unit/test_routers.py `
    tests/integration `
    -q --tb=short

Write-Host "== Frontend tests =="
Push-Location (Join-Path $repoRoot "frontend-v2")
try {
    npm test -- --run
}
finally {
    Pop-Location
}

Write-Host "== E2E tests =="
$frontendJob = Start-Job -ScriptBlock {
    param($frontendPath)
    Set-Location $frontendPath
    npm run dev -- --host 127.0.0.1
} -ArgumentList (Join-Path $repoRoot "frontend-v2")

$backendJob = Start-Job -ScriptBlock {
    param($repo, $pythonExe)
    Set-Location $repo
    & $pythonExe -m uvicorn backend.main:app --host 127.0.0.1 --port 7000
} -ArgumentList $repoRoot, $python

try {
    $frontendReady = $false
    $backendReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $frontendReady = (Invoke-WebRequest -Uri "http://127.0.0.1:5174" -UseBasicParsing -TimeoutSec 2).StatusCode -ge 200
        }
        catch {}
        try {
            $backendReady = (Invoke-WebRequest -Uri "http://127.0.0.1:7000/api/health" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200
        }
        catch {}
        if ($frontendReady -and $backendReady) {
            break
        }
        Start-Sleep -Seconds 2
    }

    if (-not $frontendReady -or -not $backendReady) {
        throw "Frontend or backend did not become ready for E2E tests."
    }

    $env:E2E_BASE_URL = "http://127.0.0.1:5174"
    $env:E2E_BACKEND_URL = "http://127.0.0.1:7000"
    & $python -m pytest tests/e2e -q --tb=short
}
finally {
    Stop-Job $frontendJob, $backendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $frontendJob, $backendJob -Force -ErrorAction SilentlyContinue | Out-Null
}
