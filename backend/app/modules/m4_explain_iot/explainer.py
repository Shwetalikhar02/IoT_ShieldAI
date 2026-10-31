"""
modules/m4_explain_iot/explainer.py — LLM Explanation Generator
================================================================
Responsibility:
    Use the LLM (via llm_client.py) to generate a human-readable explanation
    of what each vulnerability was, how the patch fixes it, and what the
    developer should do to avoid the pattern in future code.  Targeted at
    IoT firmware engineers (not security experts).

Inputs:
    vulnerability: Vulnerability  — from M1
    patch: Patch                  — from M2
    verification_result: VerificationResult  — from M3

Outputs:
    str  — Markdown-formatted explanation

TODO:
    - Build a system prompt that instructs the LLM to write for IoT engineers
      (assume constrained devices, no dynamic memory allocator, etc.).
    - Include the diff in the user prompt for context.
    - Cache explanations by vulnerability_id to avoid duplicate LLM calls.
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


async def explain(vulnerability, patch, verification_result) -> str:
    """
    TODO: Generate a Markdown explanation of the vulnerability and patch.
    """
    log.info("explainer.explain stub called")
    return "Explanation not yet implemented."
