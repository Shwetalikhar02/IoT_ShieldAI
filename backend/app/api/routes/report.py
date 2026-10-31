"""
api/routes/report.py — Report Retrieval Route
===============================================
Responsibility:
    Retrieve a completed PipelineResult by its run ID.  Also provides an
    endpoint for downloading the report as HTML/PDF (future).

Inputs:
    GET /api/report/{id}
        Path param: id — UUID of the PipelineResult

Outputs:
    PipelineResult — full pipeline output including M4 explanations and metrics

TODO (M4 team):
    - Look up the PipelineResult from the in-memory store or database.
    - Add GET /api/report/{id}/download?format=html|pdf endpoint.
    - Add pagination for the vulnerability/patch lists for large firmware files.
"""

from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.report import PipelineResult

router = APIRouter(prefix="/report", tags=["Report"])


@router.get("/{report_id}", response_model=PipelineResult, summary="Retrieve a pipeline report")
async def get_report(report_id: UUID):
    """
    TODO: Fetch PipelineResult from store by report_id.
    Returns 404 if not found.
    """
    # Stub — always returns 404 until persistence is implemented
    raise HTTPException(
        status_code=404,
        detail=f"Report {report_id} not found. Persistence not yet implemented.",
    )
