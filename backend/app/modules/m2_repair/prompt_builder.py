"""
modules/m2_repair/prompt_builder.py — LLM Prompt Constructor
=============================================================
Responsibility:
    Build a structured prompt for the LLM given a vulnerability, its code
    snippet, the root cause, and any error feedback from M3 (if this is a
    retry).  Uses a system prompt that instructs the model to output ONLY
    the patched C/C++ code (no prose) so the response can be directly applied.

Inputs:
    vulnerability: Vulnerability  — from M1
    feedback: str | None          — M3 error output from a failed previous attempt

Outputs:
    dict  — {"system": str, "user": str} — ready to pass to llm_client.py

TODO:
    - Load system prompt template from a file (prompt_builder/system.txt)
      so it can be edited without touching Python code.
    - Add few-shot examples for each CWE (e.g., strcpy → strncpy pattern).
    - Sanitise code_snippet to remove any absolute paths or hostnames
      before sending to external LLM APIs.
    - Support chain-of-thought mode: add a "Explain then patch" variant
      controlled by a flag.
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.vulnerability import Vulnerability

log = get_logger(__name__)


def build_prompt(vulnerability: Vulnerability, feedback: str | None = None) -> dict:
    """
    TODO: Build system + user prompt for the LLM.
    Returns {"system": str, "user": str}.
    """
    log.debug("prompt_builder.build_prompt stub called", cwe_id=vulnerability.cwe_id)
    return {
        "system": "You are a C/C++ security engineer. Fix the vulnerability in the code below.",
        "user": f"Vulnerability: {vulnerability.cwe_id}\nCode:\n{vulnerability.code_snippet}",
    }
