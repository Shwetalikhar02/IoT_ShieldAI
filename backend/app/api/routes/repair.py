"""
api/routes/repair.py — Patch Generation Route
===============================================
Responsibility:
    Trigger Module 2 (M2 Repair) for a specific vulnerability.  Try template-based
    fix first; fall back to LLM if no template matches.  Return the generated Patch.

Inputs:
    POST /api/repair
        Body: { vulnerability_id: UUID, upload_id: UUID }

Outputs:
    Patch — the generated patch (strategy, original_code, patched_code, diff, explanation)

TODO (M2 team):
    - Call pipeline/orchestrator.run_repair(vulnerability_id, upload_id).
    - The orchestrator internally calls template_engine first, then llm_client.
    - Accept an optional `force_strategy` field to override template/llm choice.
    - Handle the 3-retry feedback loop: M3 rejection triggers re-entry here.
"""

from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter

from app.schemas.patch import Patch, PatchStrategy

router = APIRouter(prefix="/repair", tags=["Repair"])


@router.post("", response_model=Patch, summary="Run M2 repair for a vulnerability")
async def repair_vulnerability():
    """
    TODO: Accept vulnerability_id, run M2 repair pipeline, return Patch.
    """
    # Stub — returns a minimal valid Patch object so the schema validates
    _stub_vuln_id = uuid4()
    return Patch(
        vulnerability_id=_stub_vuln_id,
        strategy=PatchStrategy.TEMPLATE,
        original_code="// stub",
        patched_code="// stub patched",
        diff="--- stub",
        explanation="Stub patch — not yet implemented",
        attempt_number=1,
    )
