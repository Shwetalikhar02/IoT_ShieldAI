"""
modules/m2_repair/patch_applier.py — Patch Applier
====================================================
Responsibility:
    Apply a generated patch to the original source file on disk, producing
    a patched copy that M3 can compile and test.  Keeps the original intact.

Inputs:
    patch: Patch      — the Patch object from patch_generator.py
    source_path: str  — absolute path to the original source file

Outputs:
    str  — absolute path to the patched file (e.g., /tmp/work/<uuid>/patched.c)

TODO:
    - Implement apply(patch, source_path) that reads the original file,
      replaces lines [line_start, line_end] with patch.patched_code, and
      writes to a new temp file.
    - Verify that the patched file still compiles before returning the path
      (quick pre-check using gcc -fsyntax-only).
    - Clean up temp files after M3 has finished verification.
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


async def apply(patch, source_path: str) -> str:
    """
    TODO: Write patched source to a temp file and return its path.
    """
    log.info("patch_applier.apply stub called", source_path=source_path)
    return source_path  # stub: return original path unchanged
