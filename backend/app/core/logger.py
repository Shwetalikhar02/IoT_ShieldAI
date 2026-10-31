"""
core/logger.py — Structured Logging Setup
==========================================
Responsibility:
    Configure and expose a structured logger using structlog so every
    module can call `get_logger(__name__)` and get a consistent,
    JSON-capable logger in production and pretty-printed in development.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import settings


def _configure_structlog() -> None:
    """Set up structlog processors and renderer based on environment."""
    # Use stdlib logging as the backend so add_logger_name works correctly
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.getLevelName(settings.log_level.upper()),
    )

    shared_processors: list = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.app_env == "production":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=False)  # no ANSI in Windows cmd

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.log_level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),   # uses stdlib — has .name
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
