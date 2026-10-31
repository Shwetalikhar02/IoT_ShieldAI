"""
modules/m2_repair/patch_generator.py — Patch Object Generator
=============================================================
Responsibility:
    Orchestrate the M2 repair process for a single vulnerability:
      1. Try template_engine.apply_template() first.
      2. If no template matched, call prompt_builder + llm_client.
      3. Wrap the raw patched code into a Patch object with a proper diff.

Inputs:
    vulnerability: Vulnerability  — from M1
    attempt_number: int           — 1–3 (for retry tracking)
    feedback: str | None          — M3 errors if this is a retry

Outputs:
    Patch  — a complete patch ready for M3 verification

TODO:
    - Implement generate(vulnerability, attempt_number, feedback) combining
      template_engine and llm_client.
    - Generate the diff using difflib.unified_diff on original vs patched lines.
    - Set Patch.strategy to "template" or "llm" depending on which was used.
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.vulnerability import Vulnerability

log = get_logger(__name__)


async def generate(
    vulnerability: Vulnerability,
    attempt_number: int = 1,
    feedback: str | None = None,
):
    """
    TODO: Generate a Patch for the given vulnerability.
    Returns Patch.
    """
    log.info(
        "patch_generator.generate stub called",
        vuln_id=str(vulnerability.id),
        attempt=attempt_number,
    )
    return None
