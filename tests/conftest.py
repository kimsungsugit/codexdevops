from __future__ import annotations

import shutil
import sys
import types
import uuid
from pathlib import Path

import pytest


_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

# Optional MCP/LangChain dependencies are not required for most test paths.
# Stub them globally so app import does not fail in lean test environments.
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
        _stub.BaseTool = object  # type: ignore[attr-defined]
        _stub.StructuredTool = object  # type: ignore[attr-defined]
        sys.modules[_mod_name] = _stub


_TMP_ROOT = _REPO_ROOT / ".codex_tmp"
_TMP_ROOT.mkdir(parents=True, exist_ok=True)


@pytest.fixture()
def tmp_path() -> Path:
    path = _TMP_ROOT / f"pytest-{uuid.uuid4().hex[:12]}"
    path.mkdir(parents=True, exist_ok=True)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return _REPO_ROOT


@pytest.fixture(scope="session")
def fixtures_dir(repo_root: Path) -> Path:
    return repo_root / "tests" / "fixtures"
