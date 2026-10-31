"""
api/routes/report.py — Report Retrieval Route
===============================================
Responsibility:
    Retrieve a completed pipeline result by upload_id/session_id.
    Supports JSON response and optional JSON download.

Endpoints:
    GET /api/report/{report_id}           — Return PipelineResult JSON
    GET /api/report/{report_id}/download  — Download as JSON file
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response

from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.report import PipelineResult

log = get_logger(__name__)
router = APIRouter(prefix="/report", tags=["Report"])


def _load_report(report_id: str) -> PipelineResult:
    """Load a saved report from disk."""
    report_file = Path(settings.reports_dir) / f"{report_id}.json"
    if not report_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Report '{report_id}' not found. Run POST /api/pipeline/run/{report_id} first.",
        )
    data = json.loads(report_file.read_text(encoding="utf-8"))
    return PipelineResult.model_validate(data)


@router.get("/{report_id}", response_model=PipelineResult, summary="Get pipeline report")
async def get_report(report_id: str) -> PipelineResult:
    """Retrieve the full pipeline result for a completed analysis run."""
    return _load_report(report_id)


@router.get("/{report_id}/download", summary="Download report as JSON")
async def download_report(report_id: str) -> Response:
    """Download the pipeline report as a formatted JSON file."""
    report_file = Path(settings.reports_dir) / f"{report_id}.json"
    if not report_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Report '{report_id}' not found.",
        )
    content = report_file.read_text(encoding="utf-8")
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="shieldai_report_{report_id[:8]}.json"',
        },
    )
