"""
modules/m3_verification/feedback_loop.py — Verification Feedback Transformer
=============================================================================
Responsibility:
    Transform a VerificationResult (compiler warnings, AddressSanitizer logs,
    and anti-cheating check violations) into a structured Feedback object
    to guide subsequent repair attempts.

Inputs:
    result: VerificationResult  — Output from compiler, ASan, and no-cheating checks

Outputs:
    Feedback                    — Actionable diagnostic report for M2 repair
"""

from __future__ import annotations

from app.schemas.repair_session import Feedback
from app.schemas.verification import VerificationResult


def create_feedback_from_result(
    result: VerificationResult,
    vulnerability_desc: str | None = None,
) -> Feedback:
    """Convert VerificationResult into a structured Feedback instance."""
    failed_checks: list[str] = []
    if not result.compiles:
        failed_checks.append("compilation")
    if not result.sanitizer_passed:
        failed_checks.append("sanitizer")
    if not result.no_cheating_passed:
        failed_checks.append("no_cheating")

    compiler_errors: list[str] = []
    sanitizer_report: str | None = None
    no_cheat_violations: list[str] = []

    for err in result.errors:
        err_lower = err.lower()
        if "error:" in err_lower or "warning:" in err_lower:
            compiler_errors.append(err)
        elif "addresssanitizer" in err_lower or "sanitizer" in err_lower:
            sanitizer_report = (sanitizer_report or "") + "\n" + err
        elif "cheat" in err_lower or "deleted" in err_lower or "bypass" in err_lower:
            no_cheat_violations.append(err)
        else:
            compiler_errors.append(err)

    # Synthesize an actionable hint
    hints: list[str] = []
    if not result.compiles:
        hints.append("Fix C syntax/compilation errors without altering function signatures.")
    if not result.sanitizer_passed:
        hints.append("Ensure buffer boundaries and pointers are checked before dereferencing or writing.")
    if not result.no_cheating_passed:
        hints.append("Do not delete the vulnerable logic or insert dummy early returns; implement the safe replacement.")

    hint_str = " ".join(hints) if hints else "Review patch against IoT firmware safety constraints."

    return Feedback(
        failed_checks=failed_checks,
        compiler_errors=compiler_errors,
        sanitizer_report=sanitizer_report.strip() if sanitizer_report else None,
        no_cheat_violations=no_cheat_violations,
        hint_for_next_attempt=hint_str,
    )
