"""DevOps Pro API entry point.

`backend.main` now exposes only the active ASGI application.
App wiring lives in `backend.app_factory` so the runtime surface can be tested
and maintained without growing this module into another monolith.
"""
from __future__ import annotations

from backend.app_factory import create_app

app = create_app()
