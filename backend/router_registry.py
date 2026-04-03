"""Centralized router registration for the active FastAPI surface."""
from __future__ import annotations

from fastapi import FastAPI

from backend.routers.auth import router as auth_router
from backend.routers.chat import router as chat_router
from backend.routers.code import router as code_router
from backend.routers.config import router as config_router
from backend.routers.excel import router as excel_router
from backend.routers.exports import router as exports_router
from backend.routers.health import router as health_router
from backend.routers.impact import router as impact_router
from backend.routers.jenkins import router as jenkins_router
from backend.routers.local import router as local_router
from backend.routers.profiles import router as profiles_router
from backend.routers.qac import router as qac_router
from backend.routers.scm import router as scm_router
from backend.routers.sessions import router as sessions_router
from backend.routers.test_gen import router as test_gen_router
from backend.routers.vcast import router as vcast_router

ACTIVE_ROUTERS = (
    health_router,
    chat_router,
    code_router,
    config_router,
    excel_router,
    exports_router,
    impact_router,
    profiles_router,
    qac_router,
    test_gen_router,
    vcast_router,
    jenkins_router,
    local_router,
    sessions_router,
    scm_router,
    auth_router,
)


def register_routers(app: FastAPI) -> None:
    """Attach the currently supported API routers to the app."""
    for router in ACTIVE_ROUTERS:
        app.include_router(router)
