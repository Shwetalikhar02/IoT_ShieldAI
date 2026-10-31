"""
schemas/verification.py — Verification Result Schema (Pydantic v2)
===================================================================
Responsibility:
    Define the data shape for verification outcomes produced by Module 3
    (M3 Verification).  Records compilation status, AddressSanitizer results,
    no-cheating check status, and any error messages.  The overall_status field
    drives the feedback loop that may send a failed patch back to M2 for a retry.

Inputs:  Output from compiler.py, sanitizer_runner.py, no_cheating_check.py
Outputs: VerificationResult objects used by feedback_loop.py and M4

TODO (M3 team):
    - Populate `errors` from stderr of the compiler / ASan runtime output.
    - Set `overall_status` to "failed" automatically when any bool is False
      (consider using a model_validator for this).
    - Add a `sanitizer_log` field (optional str) for the full ASan output,
      gated behind a DEBUG flag so it doesn't pollute API responses by default.
"""

from __future__ import annotations

from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class OverallStatus(str, Enum):
    """Top-level verdict for a patch verification run."""
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"   # unexpected infrastructure error (Docker timeout, etc.)


class VerificationResult(BaseModel):
    """Verification outcome for a single Patch."""

    patch_id: UUID = Field(
        ...,
        description="References the Patch that was verified.",
    )
    compiles: bool = Field(
        ...,
        description="True if the patched file compiled without errors.",
    )
    sanitizer_passed: bool = Field(
        ...,
        description=(
            "True if no AddressSanitizer or UndefinedBehaviorSanitizer errors "
            "were reported during execution of the test binary."
        ),
    )
    no_cheating_passed: bool = Field(
        ...,
        description=(
            "True if the patch did not remove functionality (e.g. did not simply "
            "delete the vulnerable call without a replacement, or zero out the buffer)."
        ),
    )
    errors: list[str] = Field(
        default_factory=list,
        description=(
            "List of error strings from the compiler or sanitizer.  Empty on success."
        ),
    )
    overall_status: OverallStatus = Field(
        default=OverallStatus.FAILED,
        description="Derived overall verdict. Set automatically by model_validator.",
    )

    @model_validator(mode="after")
    def _derive_overall_status(self) -> "VerificationResult":
        """Auto-compute overall_status from the three boolean checks."""
        if self.compiles and self.sanitizer_passed and self.no_cheating_passed:
            self.overall_status = OverallStatus.PASSED
        else:
            self.overall_status = OverallStatus.FAILED
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "patch_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                "compiles": True,
                "sanitizer_passed": True,
                "no_cheating_passed": True,
                "errors": [],
                "overall_status": "passed",
            }
        }
    }
