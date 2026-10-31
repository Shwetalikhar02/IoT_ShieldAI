"""
modules/m3_verification/no_cheating_check.py — No-Cheating Heuristic
======================================================================
Responsibility:
    Verify that the patch did not "cheat" by simply deleting the vulnerable
    code without providing a real fix.  Common cheating patterns:
      - Deleting the call site entirely (e.g., removing the strcpy line)
      - Replacing the vulnerable expression with a no-op (e.g., `if (0)`)
      - Zeroing out the destination buffer instead of fixing the operation
      - Returning early before reaching the vulnerable code

Inputs:
    original_code: str  — the original vulnerable lines
    patched_code: str   — the replacement lines

Outputs:
    dict  — { "passed": bool, "reason": str }

TODO:
    - Implement check(original_code, patched_code).
    - Heuristic 1: line count of patched_code must be >= line count of
      original_code (deletion check).
    - Heuristic 2: the patched_code must contain at least one non-whitespace
      statement per statement in the original.
    - Heuristic 3: the LLM output must not be identical to original (no-change check).
    - Consider AST-level diff for stronger no-cheating guarantees (future).
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


def check(original_code: str, patched_code: str) -> dict:
    """
    TODO: Verify the patch is a real fix and not a deletion/no-op.
    Returns {"passed": bool, "reason": str}.
    """
    log.debug("no_cheating_check.check stub called")
    return {"passed": False, "reason": "Stub: no-cheating check not yet implemented"}
