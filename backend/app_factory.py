"""Application factory for the active FastAPI deployment."""
from __future__ import annotations

import json
import logging
import os
import socket
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.error_handler import global_exception_handler, http_exception_handler
from backend.frontend_mount import mount_active_frontend
from backend.middleware import RateLimitMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from backend.router_registry import register_routers
from backend.user_context import UserContextMiddleware


class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter activated via LOG_FORMAT=json."""

    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data, ensure_ascii=False)


def get_repo_root() -> Path:
    """Return the repository root and ensure it is importable."""
    repo_root = Path(__file__).resolve().parents[1]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    return repo_root


def configure_logger() -> logging.Logger:
    """Create or reuse the shared API logger."""
    api_logger = logging.getLogger("devops_api")
    if api_logger.handlers:
        return api_logger

    handler = logging.StreamHandler()
    if os.environ.get("LOG_FORMAT", "").lower() == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
                datefmt="%H:%M:%S",
            )
        )
    api_logger.addHandler(handler)
    api_logger.setLevel(logging.INFO)
    return api_logger


def register_startup(app: FastAPI, logger: logging.Logger) -> None:
    """Attach startup initialization for runtime dependencies."""

    @app.on_event("startup")
    async def startup() -> None:
        try:
            hostname = socket.gethostname()
            ip = socket.gethostbyname(hostname)
        except Exception:
            ip = "127.0.0.1"

        logger.info("=" * 50)
        logger.info("DevOps Release Server started")
        logger.info("  Local:   http://127.0.0.1:7000")
        logger.info("  Network: http://%s:7000", ip)
        logger.info("=" * 50)

        from backend.database import init_db
        from backend.services.file_resolver import get_resolver

        init_db()
        logger.info("  Database: initialized")

        resolver = get_resolver()
        logger.info("  File mode: %s", resolver.mode)
        if resolver.mode == "cloudium":
            cfg = resolver.get_config()
            logger.info("  Allowed paths: %s", cfg.get("allowed_prefixes", []))


def create_app(repo_root: Path | None = None) -> FastAPI:
    """Build the active FastAPI application."""
    repo_root = repo_root or get_repo_root()
    logger = configure_logger()

    app = FastAPI(title="DevOps Pro API", version="1.0")
    register_startup(app, logger)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(UserContextMiddleware)

    try:
        from prometheus_fastapi_instrumentator import Instrumentator

        instrumentator = Instrumentator(
            should_group_status_codes=True,
            should_ignore_untemplated=True,
            excluded_handlers=["/metrics", "/health"],
        )
        instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
        logger.info("Prometheus metrics enabled at /metrics")
    except ImportError:
        logger.info("prometheus-fastapi-instrumentator not installed, metrics disabled")

    register_routers(app)
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    mount_active_frontend(app, repo_root, logger)

    return app
