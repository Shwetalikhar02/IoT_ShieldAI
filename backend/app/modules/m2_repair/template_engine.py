"""
modules/m2_repair/template_engine.py — Rule-Based Fix Template Engine
======================================================================
Responsibility:
    Match a vulnerability's CWE ID and code pattern against the registered
    fix templates in m2_repair/fix_templates/, apply the matching template
    to produce a Patch, and return None if no template matches (so the caller
    falls back to the LLM).

Inputs:
    vulnerability: Vulnerability  — the detected vulnerability object from M1

Outputs:
    Patch | None  — a complete Patch if a template matched, else None

TODO:
    - Load all templates from fix_templates/ at startup (lazy singleton).
    - Implement match(vulnerability) to find the best matching template.
    - Implement apply(template, vulnerability) to produce patched_code + diff.
    - Use Python's difflib.unified_diff for the diff field.
    - Register templates by CWE ID so lookup is O(1).
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.vulnerability import Vulnerability

log = get_logger(__name__)


async def apply_template(vulnerability: Vulnerability):
    """
    TODO: Find and apply a fix template for the given vulnerability.
    Returns Patch if a template matched, else None.
    """
    log.info(
        "template_engine.apply_template stub called",
        cwe_id=vulnerability.cwe_id,
    )
    return None  # No templates implemented yet
