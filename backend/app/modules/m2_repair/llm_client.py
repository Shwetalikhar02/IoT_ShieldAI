"""
modules/m2_repair/llm_client.py — LLM API Client
==================================================
Responsibility:
    Send prompts to the configured LLM (OpenAI-compatible API) using the
    `openai` SDK with the base URL and model from settings.  Handles retries
    with exponential backoff via tenacity, and enforces a timeout.

Inputs:
    prompt: dict  — {"system": str, "user": str} from prompt_builder.py

Outputs:
    str  — the raw LLM response text (expected to be patched C/C++ code)

TODO:
    - Implement call(prompt) using openai.AsyncOpenAI with the settings from
      core/config.py (base URL, API key, model, max_tokens, temperature).
    - Add tenacity retry decorator: retry on RateLimitError and APITimeoutError.
    - Strip markdown fences (```c ... ```) from the response before returning.
    - Log prompt tokens and completion tokens to metrics for cost tracking.
    - Support streaming mode for long patches to reduce latency.
"""

from __future__ import annotations

from app.core.config import settings
from app.core.logger import get_logger

log = get_logger(__name__)


async def call(prompt: dict) -> str:
    """
    TODO: Call the LLM API with the given prompt and return the response text.
    """
    log.info(
        "llm_client.call stub called",
        provider=settings.llm_provider,
        model=settings.llm_model,
    )
    return "// LLM response stub — not yet implemented"
