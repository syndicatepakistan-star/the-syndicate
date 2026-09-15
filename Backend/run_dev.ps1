# Django API on port 8000 — matches Frontend-Dashboard .env.local NEXT_PUBLIC_SYNDICATE_API_URL
Set-Location $PSScriptRoot
$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
  & $venvPython manage.py runserver 127.0.0.1:8000
} else {
  Write-Host "Missing .venv — run: python -m venv .venv && .\.venv\Scripts\pip install -r requirements.txt"
  exit 1
}
