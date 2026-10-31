"""
modules/m2_repair/patch_applier.py — Patch Applier
====================================================
Responsibility:
    Apply a generated patch to the original source file on disk. Creates a
    new patched copy (never overwrites the original). Returns the path to
    the patched file for M3 compilation.

    Strategy: line-range replacement — replace lines [line_start, line_end]
    in the original file with the patched_code lines.

Inputs:
    patch: Patch      — the Patch object from template_engine or llm_client
    source_path: str  — absolute path to the original source file
    vuln_line_start: int — first vulnerable line (1-indexed)
    vuln_line_end: int   — last vulnerable line (1-indexed)

Outputs:
    str  — absolute path to the patched file (e.g., uploads/<id>/patched_<file>.c)
"""

from __future__ import annotations

import difflib
from pathlib import Path

from app.core.logger import get_logger
from app.schemas.patch import Patch

log = get_logger(__name__)


def apply(
    patch: Patch,
    source_path: str,
    vuln_line_start: int = 1,
    vuln_line_end: int | None = None,
) -> str:
    """
    Apply the patch to the source file and return the patched file path.

    The original file is not modified. The patched copy is written to the
    same directory as the source file with a 'patched_' prefix.
    """
    src = Path(source_path)
    if not src.exists():
        log.warning("Source file not found, creating virtual patched copy", path=source_path)
        # Create a minimal patched file for testing without real file
        patched_path = src.parent / f"patched_{src.name}"
        patched_path.write_text(patch.patched_code, encoding="utf-8")
        return str(patched_path)

    original_lines = src.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
    total_lines = len(original_lines)

    # Determine the replacement span
    start_idx = max(0, vuln_line_start - 1)  # 0-indexed
    end_idx = vuln_line_end if vuln_line_end else vuln_line_start
    end_idx = min(end_idx, total_lines)  # clamp to file length

    # Build replacement lines (ensure trailing newline)
    replacement = patch.patched_code
    if not replacement.endswith("\n"):
        replacement += "\n"
    replacement_lines = replacement.splitlines(keepends=True)

    # Assemble patched content
    patched_lines = (
        original_lines[:start_idx]
        + replacement_lines
        + original_lines[end_idx:]
    )

    patched_content = "".join(patched_lines)
    patched_path = src.parent / f"patched_{src.name}"
    patched_path.write_text(patched_content, encoding="utf-8")

    # Recompute diff against full file (for reporting)
    full_diff = "".join(difflib.unified_diff(
        original_lines,
        patched_lines,
        fromfile=f"a/{src.name}",
        tofile=f"b/patched_{src.name}",
    ))

    log.info(
        "Patch applied",
        source=source_path,
        patched=str(patched_path),
        lines_replaced=f"{vuln_line_start}-{end_idx}",
        diff_lines=len(full_diff.splitlines()),
    )
    return str(patched_path)
