"""
modules/m2_repair/template_engine.py — Deterministic Fix Template Engine
========================================================================
Responsibility:
    Match vulnerability CWE patterns and code snippets against deterministic
    repair rules.  Provides instant, hallucination-free Tier 1 repairs for
    standard vulnerability classes.

Inputs:
    vulnerability: Vulnerability  — Target vulnerability from M1

Outputs:
    Patch | None                  — Concrete patch if pattern matched, else None
"""

from __future__ import annotations

import difflib
import re
from typing import Callable

from app.core.logger import get_logger
from app.schemas.patch import Patch, PatchStrategy
from app.schemas.vulnerability import Vulnerability

log = get_logger(__name__)


def make_diff(original: str, patched: str, filename: str) -> str:
    diff = difflib.unified_diff(
        original.splitlines(keepends=True),
        patched.splitlines(keepends=True),
        fromfile=f"a/{filename}",
        tofile=f"b/{filename}",
    )
    return "".join(diff)


# ── Deterministic Rule Handlers ──────────────────────────────────────────────

def _fix_cwe121_strcpy(code: str) -> tuple[str, str] | None:
    """Replace strcpy(dst, src) with strncpy(dst, src, sizeof(dst) - 1) + NUL."""
    pattern = re.compile(r"strcpy\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*;")
    match = pattern.search(code)
    if not match:
        return None
    dst, src = match.group(1), match.group(2)
    replacement = (
        f"strncpy({dst}, {src}, sizeof({dst}) - 1);\n"
        f"    {dst}[sizeof({dst}) - 1] = '\\0';"
    )
    patched = pattern.sub(replacement, code)
    explanation = (
        f"Replaced unbounded strcpy() into buffer '{dst}' with bounded strncpy() "
        f"and explicit null-termination to prevent stack buffer overflow."
    )
    return patched, explanation


def _fix_cwe476_null_check(code: str) -> tuple[str, str] | None:
    """Add NULL check after malloc()."""
    pattern = re.compile(r"([a-zA-Z0-9_\*\s]+=\s*(?:\([a-zA-Z0-9_\*\s]+\)\s*)?malloc\s*\([^;]+\)\s*;)")
    match = pattern.search(code)
    if not match:
        return None
    
    ptr_match = re.search(r"([a-zA-Z0-9_]+)\s*=\s*(?:\([a-zA-Z0-9_\*\s]+\)\s*)?malloc", code)
    ptr_name = ptr_match.group(1) if ptr_match else "ptr"
    
    addition = f"\n    if ({ptr_name} == NULL) {{\n        return NULL;\n    }}"
    patched = match.group(1) + addition + code[match.end():]
    explanation = f"Added NULL pointer verification after dynamic allocation of '{ptr_name}' to prevent dereference under OOM."
    return patched, explanation


def _fix_cwe134_format_string(code: str) -> tuple[str, str] | None:
    """Fix printf(user_input) with printf("%s", user_input)."""
    pattern = re.compile(r'printf\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*;')
    match = pattern.search(code)
    if not match:
        return None
    var_name = match.group(1)
    patched = pattern.sub(f'printf("%s", {var_name});', code)
    explanation = f"Supplied static format specifier \"%s\" to printf() to prevent arbitrary memory disclosure."
    return patched, explanation


def _fix_cwe416_uaf(code: str) -> tuple[str, str] | None:
    """Set pointer to NULL immediately after free()."""
    pattern = re.compile(r"free\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*;")
    match = pattern.search(code)
    if not match:
        return None
    ptr_name = match.group(1)
    patched = pattern.sub(f"free({ptr_name});\n    {ptr_name} = NULL;", code)
    explanation = f"Nullified pointer '{ptr_name}' immediately upon freeing to eliminate dangling pointer references."
    return patched, explanation


def _fix_cwe190_int_overflow(code: str) -> tuple[str, str] | None:
    """Add bounds check before buffer multiplication."""
    if "*" in code and "malloc" in code:
        patched = (
            "    if (num_items > SIZE_MAX / sizeof(int)) {\n"
            "        return NULL; /* Integer overflow guard */\n"
            "    }\n" + code
        )
        explanation = "Inserted integer multiplication overflow check before memory allocation."
        return patched, explanation
    return None


TEMPLATE_HANDLERS: dict[str, list[Callable[[str], tuple[str, str] | None]]] = {
    "CWE-121": [_fix_cwe121_strcpy],
    "CWE-476": [_fix_cwe476_null_check],
    "CWE-134": [_fix_cwe134_format_string],
    "CWE-416": [_fix_cwe416_uaf],
    "CWE-190": [_fix_cwe190_int_overflow],
}


async def apply_template(vulnerability: Vulnerability) -> Patch | None:
    """Attempt deterministic template repair for the given vulnerability."""
    cwe_key = vulnerability.cwe_id.upper().strip()
    handlers = TEMPLATE_HANDLERS.get(cwe_key, [])

    for handler in handlers:
        result = handler(vulnerability.code_snippet)
        if result:
            patched_code, explanation = result
            diff = make_diff(vulnerability.code_snippet, patched_code, vulnerability.file_path)
            log.info("Template repair matched successfully", cwe=cwe_key)
            return Patch(
                vulnerability_id=vulnerability.id,
                strategy=PatchStrategy.TEMPLATE,
                original_code=vulnerability.code_snippet,
                patched_code=patched_code,
                diff=diff,
                explanation=explanation,
                attempt_number=1,
            )

    log.debug("No deterministic template matched for vulnerability", cwe=cwe_key)
    return None
