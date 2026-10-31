"""
api/routes/verify.py — Patch Verification Route
=================================================
Responsibility:
    Trigger Module 3 (M3 Verification) for a given patch.  Runs inside
    the Docker sandbox: compiles the patched file, runs it under
    AddressSanitizer, and checks the no-cheating heuristic.
    Returns a VerificationResult.

Inputs:
    POST /api/verify
        Body: { patch_id: UUID }

Outputs:
    VerificationResult — compiles, sanitizer_passed, no_cheating_passed,
                         errors, overall_status

TODO (M3 team):
    - Call pipeline/orchestrator.run_verification(patch_id).
    - The orchestrator invokes compiler.py, sanitizer_runner.py, no_cheating_check.py
      inside the sandbox Docker container.
    - If overall_status is "failed", the orchestrator triggers a retry in M2
      (up to 3 attempts total).
    - Return the Docker sandbox stdout/stderr in `errors` on failure.
"""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter

from app.schemas.verification import OverallStatus, VerificationResult

router = APIRouter(prefix="/verify", tags=["Verification"])


@router.post("", response_model=VerificationResult, summary="Run M3 verification for a patch")
async def verify_patch():
    """
    TODO: Accept patch_id, run M3 verification in sandbox, return VerificationResult.
    """
    # Stub — all checks False so status is "failed" until implemented
    return VerificationResult(
        patch_id=uuid4(),
        compiles=False,
        sanitizer_passed=False,
        no_cheating_passed=False,
        errors=["Stub: verification not yet implemented"],
    )
