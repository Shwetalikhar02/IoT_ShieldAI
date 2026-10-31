"""
core/logger.py — Structured Logging Setup
==========================================
Responsibility:
    Configure and expose a structured logger using structlog so that every
    module can call `get_logger(__name__)` and receive a consistent,
    JSON-capable logger in production and a pretty-printed logger in
    development.

Inputs:
    settings.log_level  — from core/config.py (DEBUG | INFO | WARNING | ERROR)
    settings.app_env    — "development" enables coloured console output;
                          "production" emits JSON lines.

Outputs:
    get_logger(name: str) -> structlog.BoundLogger
        A bound logger instance pre-tagged with the module name.

TODO:
    - Add a file sink (RotatingFileHandler) for production deployments.
    - Integrate OpenTelemetry trace IDs as structlog processors once tracing
      is enabled.
    - Allow per-module log-level overrides via an environment variable map.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import settings


def _configure_structlog() -> None:
    """Set up structlog shared processors and renderer based on environment."""
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.app_env == "production":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.log_level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        cache_logger_on_first_use=True,
    )


# Configure once at import time
_configure_structlog()


def get_logger(name: str) -> structlog.BoundLogger:
    """Return a structlog bound logger tagged with *name*.

    Usage::

        from app.core.logger import get_logger
        log = get_logger(__name__)
        log.info("event", key="value")
    """
    return structlog.get_logger(name)
