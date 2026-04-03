# DevOps Analysis Toolkit

Current runtime:

- Backend: `backend` FastAPI app on port `7000`
- Frontend: `frontend-v2` Vite/React app on port `5174`
- Legacy `frontend/` has been removed from the active code path

## Active Structure

```text
backend/
  app_factory.py
  frontend_mount.py
  main.py
  router_registry.py
  routers/

frontend-v2/
  src/
  package.json

tests/
  unit/
  integration/
  e2e/
```

## Backend

Create a virtual environment and install dependencies.
Recommended: Windows CPython `3.12` using a standard venv. Python `3.13` on MSYS2/MinGW may fail to install some binary packages used by this repo.

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Standard local environment:

- Python: Windows CPython `3.12`
- Virtual environment: repository root `.venv`
- `backend/.venv` is legacy compatibility only and should not be used for new setup

Run the API:

```powershell
uvicorn backend.main:app --host 0.0.0.0 --port 7000 --reload
```

## Frontend

Install dependencies and run the active frontend:

```powershell
cd frontend-v2
npm install
npm run dev
```

Build the frontend:

```powershell
cd frontend-v2
npm run build
```

## Tests

Stabilization baseline:

- Branch: `codex/runtime-cleanup-stabilization`
- For release validation or CI debugging, prefer a fresh clone or a new git worktree instead of a dirty working tree with unrelated edits

Recommended bootstrap for a new clone or worktree:

```powershell
git config core.hooksPath .githooks
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
```

Quick local smoke checks:

```powershell
git config core.hooksPath .githooks
bash .githooks/pre-commit
```

Full validation:

```powershell
git config core.hooksPath .githooks
python -m playwright install chromium
powershell -ExecutionPolicy Bypass -File .\scripts\run_full_checks.ps1
```

Backend unit and integration tests:

```powershell
python -m pytest tests/unit tests/integration -q --tb=short
```

Frontend tests:

```powershell
cd frontend-v2
npm test -- --run
```

E2E tests require Playwright plus both servers running:

```powershell
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python -m pytest tests/e2e -q --tb=short
```

## Notes

- The app factory in `backend/app_factory.py` is the supported FastAPI entry path.
- Router registration is centralized in `backend/router_registry.py`.
- Static frontend mounting is handled by `backend/frontend_mount.py`.
- Report classification and periodic summaries treat `frontend-v2` as the only active frontend.
- The Vite dev server runs on `5174` and proxies backend requests to `127.0.0.1:7000`.
- The backend API runtime and Docker container use port `7000`.
- `requirements.txt` is the umbrella install for local development and CI.
- The tracked git hook lives in `.githooks/pre-commit`; run `git config core.hooksPath .githooks` once per clone.
- Docker runtime verification is handled in CI. If Docker is installed locally, validate with `docker build` and `docker run -p 7000:7000`.
- The pre-commit hook is intentionally a smoke gate, not a full regression suite.
- Git remotes must not embed tokens or passwords in the URL. Use a credential helper or interactive PAT flow instead.
