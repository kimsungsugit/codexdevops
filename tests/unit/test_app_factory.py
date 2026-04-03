from __future__ import annotations

import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

from fastapi import FastAPI

for _mod_name in [
    "langchain_core",
    "langchain_core.tools",
    "langchain_mcp_adapters",
    "langchain_mcp_adapters.tools",
    "mcp",
    "mcp.client",
    "mcp.client.stdio",
]:
    if _mod_name not in sys.modules:
        _stub = types.ModuleType(_mod_name)
        _stub.BaseTool = MagicMock  # type: ignore[attr-defined]
        _stub.StructuredTool = MagicMock  # type: ignore[attr-defined]
        sys.modules[_mod_name] = _stub

from backend.app_factory import create_app
from backend.frontend_mount import ACTIVE_FRONTEND_DIR


def test_create_app_registers_active_runtime_routes(tmp_path: Path):
    frontend_dist = tmp_path / ACTIVE_FRONTEND_DIR / "dist" / "assets"
    frontend_dist.mkdir(parents=True)
    (frontend_dist.parent / "index.html").write_text("<html>ok</html>", encoding="utf-8")

    app = create_app(repo_root=tmp_path)

    routes = {route.path for route in app.routes}
    assert "/api/health" in routes
    assert "/api/{api_path:path}" in routes
    assert "/{full_path:path}" in routes


def test_create_app_returns_fastapi_instance(tmp_path: Path):
    app = create_app(repo_root=tmp_path)
    assert isinstance(app, FastAPI)
