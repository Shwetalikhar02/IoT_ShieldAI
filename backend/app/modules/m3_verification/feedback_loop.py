"""
modules/m3_verification/feedback_loop.py — Verification Feedback Loop
=======================================================================
Responsibility:
    Implement the retry logic between M3 and M2:  when a patch fails
    verification, extract the relevant error messages, format them into
    feedback for M2's prompt builder, and trigger a new patch attempt.
    Enforces the maximum of 3 attempts.

Inputs:
    verification_result: VerificationResult  — failed result from M3
    vulnerability: Vulnerability             — original vulnerability
    attempt_number: int                      — current attempt (1–3)

Outputs:
    str | None  — formatted feedback string for prompt_builder.py,
                  or None if max retries reached

TODO:
    - Implement extract_feedback(verification_result) to format errors
      into a concise string the LLM can act on.
    - Implement should_retry(attempt_number) → bool.
    - Call this from orchestrator.py after each failed verification.
    - Log each retry attempt with attempt number and error summary.
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.verification import VerificationResult

log = get_logger(__name__)

MAX_ATTEMPTS = 3


def extract_feedback(result: VerificationResult) -> str:
    """
    TODO: Format verification errors into actionable LLM feedback.
    """
    return "\n".join(result.errors)


def should_retry(attempt_number: int) -> bool:
    """Return True if we have retries remaining."""
    return attempt_number < MAX_ATTEMPTS
