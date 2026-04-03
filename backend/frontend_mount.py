"""Frontend-v2 mounting for the active SPA build."""
from __future__ import annotations

import logging
import mimetypes
from pathlib import Path

from fastapi import FastAPI, HTTPException

ACTIVE_FRONTEND_DIR = "frontend-v2"


def mount_active_frontend(app: FastAPI, repo_root: Path, logger: logging.Logger) -> None:
    """Serve the active frontend-v2 build when a production bundle exists."""
    frontend_dist = repo_root / ACTIVE_FRONTEND_DIR / "dist"
    index_path = frontend_dist / "index.html"
    assets_dir = frontend_dist / "assets"

    if not index_path.exists():
        logger.warning(
            "No %s dist/ found at %s - run 'cd %s && npm run build'",
            ACTIVE_FRONTEND_DIR,
            frontend_dist,
            ACTIVE_FRONTEND_DIR,
        )
        return

    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")
    mimetypes.add_type("image/svg+xml", ".svg")

    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/favicon.svg")
    async def favicon_svg():
        path = frontend_dist / "favicon.svg"
        if path.exists():
            return FileResponse(str(path), media_type="image/svg+xml")
        raise HTTPException(status_code=404)

    @app.get("/api/{api_path:path}")
    async def api_not_found(api_path: str):
        raise HTTPException(status_code=404, detail=f"API endpoint not found: /api/{api_path}")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        return FileResponse(str(index_path))

    logger.info("Active frontend build served from %s", frontend_dist)
