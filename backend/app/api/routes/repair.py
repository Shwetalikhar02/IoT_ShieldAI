"""
api/routes/repair.py — Automated Multi-Tier Repair & Refinement Route
====================================================================
Responsibility:
    Trigger the multi-tier repair loop (M2 Repair + M3 Verification) for a
    vulnerability, return stateful RepairSession objects, and provide interactive
    conversation-driven refinement endpoints.

Endpoints:
    POST /api/repair                  — Initiate repair loop for a vulnerability
    GET  /api/repair/{session_id}      — Retrieve a session by ID
    POST /api/repair/{session_id}/refine — Inject user constraint and refine patch
"""

from __future__ import annotations

from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.pipeline.repair_loop import load_session_from_disk, refine_repair_session, run_repair_loop
from app.schemas.repair_session import RefineSessionRequest, RepairSession
from app.schemas.vulnerability import Severity, Vulnerability

log = get_logger(__name__)

router = APIRouter(prefix="/repair", tags=["Repair"])


class StartRepairRequest(BaseModel):
    """Payload to initiate a multi-tier repair session."""

    vulnerability_id: UUID | None = Field(default=None, description="ID of vulnerability, or provide full object.")
    upload_id: str | None = Field(default=None, description="Optional uploaded firmware session.")
    constraints: list[str] = Field(default_factory=list, description="Initial directives or constraints.")
    vulnerability: Vulnerability | None = Field(default=None, description="Explicit vulnerability object if testing.")


@router.post("", response_model=RepairSession, summary="Initiate multi-tier repair loop")
async def repair_vulnerability(req: StartRepairRequest) -> RepairSession:
    """Run the multi-tier repair loop (Template -> Template-Guided LLM -> Free LLM).
    Returns complete RepairSession with attempt history and verification reports.
    """
    vuln = req.vulnerability
    if not vuln:
        # Fallback sample vulnerability for testing / demo
        vuln = Vulnerability(
            id=req.vulnerability_id or uuid4(),
            file_path="datasets/demo_firmware/stack_overflow.c",
            line_start=29,
            line_end=29,
            cwe_id="CWE-121",
            vuln_type="Stack Buffer Overflow",
            severity=Severity.CRITICAL,
            description="Unbounded strcpy into 32-byte stack buffer.",
            root_cause="strcpy() without bounds validation",
            code_snippet="strcpy(device_name, input);",
        )

    session = await run_repair_loop(
        vulnerability=vuln,
        upload_id=req.upload_id,
        initial_constraints=req.constraints,
    )
    return session


@router.get("/{session_id}", response_model=RepairSession, summary="Retrieve a repair session")
async def get_repair_session(session_id: UUID) -> RepairSession:
    """Retrieve an existing repair session from persistent store."""
    session = load_session_from_disk(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Repair session '{session_id}' not found.")
    return session


@router.post("/{session_id}/refine", response_model=RepairSession, summary="Refine patch with user constraint")
async def refine_patch(session_id: UUID, req: RefineSessionRequest) -> RepairSession:
    """Conversational repair: re-execute repair loop with user-defined constraints."""
    try:
        updated_session = await refine_repair_session(session_id, req.constraint)
        return updated_session
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
