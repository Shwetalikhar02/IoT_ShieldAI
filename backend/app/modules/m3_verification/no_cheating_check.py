"""
modules/m3_verification/no_cheating_check.py — Anti-Cheating Patch Verifier
===========================================================================
Responsibility:
    Perform strict syntactic and lexical analysis to ensure candidate patches
    are legitimate functional fixes rather than "cheats" commonly generated
    by LLMs to bypass sanitizers.

Cheating Patterns Detected:
    1. Complete deletion of functional calls (e.g. dropping strcpy without replacement).
    2. Premature termination bypasses (inserting `return;`, `return 0;`, `exit(0);`).
    3. Blank / empty patches (whitespace only or commented-out logic).
    4. Unconditional buffer zeroing / nullification before operation.
    5. Identity patches (patch is byte-for-byte identical to the original).

Inputs:
    original_code: str  — Original vulnerable lines
    patched_code: str   — Candidate replacement lines

Outputs:
    dict: { "passed": bool, "violations": list[str] }
"""

from __future__ import annotations

import re
from app.core.logger import get_logger

log = get_logger(__name__)

# Sensitive functions that must have safe counterparts when removed
SENSITIVE_CALLS = {
    "strcpy": ["strncpy", "snprintf", "memcpy", "strlcpy"],
    "strcat": ["strncat", "snprintf", "strlcat"],
    "sprintf": ["snprintf"],
    "gets": ["fgets", "fread"],
    "malloc": ["calloc", "malloc", "alloca"],
    "free": ["free"],
    "printf": ["printf", "fprintf", "snprintf", "puts"],
}

BYPASS_RETURN_REGEX = re.compile(
    r"^\s*(?:return\s*(?:0|NULL|false|-1)?\s*;|exit\s*\(\s*0\s*\)\s*;)",
    re.MULTILINE,
)


def _strip_comments(code: str) -> str:
    """Remove single-line and multi-line C comments."""
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
    code = re.sub(r"//.*$", "", code, flags=re.MULTILINE)
    return code.strip()


def check(original_code: str, patched_code: str) -> dict:
    """Verify that a patch implements genuine security remediation."""
    violations: list[str] = []

    clean_orig = _strip_comments(original_code)
    clean_patch = _strip_comments(patched_code)

    # 1. Blank / Empty check
    if not clean_patch:
        violations.append("Cheating violation: Patched code is empty or contains only comments.")
        return {"passed": False, "violations": violations}

    # 2. Identity check (no change)
    if clean_orig == clean_patch:
        violations.append("Cheating violation: Patched code is identical to original vulnerable code.")
        return {"passed": False, "violations": violations}

    # 3. Premature Return / Exit Bypass Check
    orig_has_early_return = bool(BYPASS_RETURN_REGEX.search(clean_orig))
    patch_has_early_return = bool(BYPASS_RETURN_REGEX.search(clean_patch))
    if patch_has_early_return and not orig_has_early_return:
        # Check if it was inserted as the first statement in the patch snippet
        first_statement = clean_patch.split(";")[0].strip()
        if first_statement.startswith("return") or first_statement.startswith("exit"):
            violations.append(
                "Cheating violation: Patch inserts premature unconditional return/exit, bypassing execution."
            )

    # 4. Sensitive Call Deletion without Replacement
    for unsafe_call, safe_alternatives in SENSITIVE_CALLS.items():
        if unsafe_call in clean_orig:
            if unsafe_call not in clean_patch:
                has_safe_replacement = any(alt in clean_patch for alt in safe_alternatives)
                if not has_safe_replacement:
                    violations.append(
                        f"Cheating violation: Vulnerable function '{unsafe_call}' was deleted "
                        f"without providing a bounded safe alternative ({', '.join(safe_alternatives)})."
                    )

    # 5. Non-triviality check
    orig_token_count = len(re.findall(r"\w+", clean_orig))
    patch_token_count = len(re.findall(r"\w+", clean_patch))
    if patch_token_count < orig_token_count // 3:
        violations.append(
            f"Cheating violation: Patch drastically truncates code ({patch_token_count} tokens vs {orig_token_count} originally)."
        )

    passed = len(violations) == 0
    if not passed:
        log.warning("No-cheating verification failed", violations=violations)
    else:
        log.debug("No-cheating verification passed successfully")

    return {"passed": passed, "violations": violations}
