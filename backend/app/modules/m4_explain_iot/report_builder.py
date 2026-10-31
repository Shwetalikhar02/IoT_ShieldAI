"""
modules/m4_explain_iot/report_builder.py — Report Builder
===========================================================
Responsibility:
    Assemble the final PipelineResult from M1 vulnerabilities, M2 patches,
    M3 verification results, M4 explanation and IoT metrics.
    Optionally save a JSON report to disk.

Inputs:
    vulnerabilities: list[Vulnerability]
    patches: list[Patch]
    verification_results: list[VerificationResult]
    metrics: IoTMetrics
    explanation: str
    file_path: str

Outputs:
    PipelineResult — complete assembled report
"""

from __future__ import annotations

import json
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.core.logger import get_logger
from app.schemas.patch import Patch
from app.schemas.report import IoTMetrics, PipelineResult
from app.schemas.verification import OverallStatus, VerificationResult
from app.schemas.vulnerability import Vulnerability

log = get_logger(__name__)


async def build(
    vulnerabilities: list[Vulnerability],
    patches: list[Patch],
    verification_results: list[VerificationResult],
    metrics: IoTMetrics,
    explanation: str,
    file_path: str,
    report_id: str | None = None,
) -> PipelineResult:
    """Assemble and return the final PipelineResult.

    Also saves the report as JSON to the configured reports directory
    so GET /api/report/{id} can retrieve it later.
    """
    total_fixed = sum(
        1 for v in verification_results
        if v.overall_status == OverallStatus.PASSED
    )

    result = PipelineResult(
        id=uuid4() if report_id is None else report_id,  # type: ignore[arg-type]
        file_path=file_path,
        vulnerabilities=vulnerabilities,
        patches=patches,
        verification_results=verification_results,
        metrics=metrics,
        explanation=explanation,
        total_vulnerabilities=len(vulnerabilities),
        total_patches_applied=total_fixed,
    )

    # Persist to disk
    try:
        reports_dir = Path(settings.reports_dir)
        reports_dir.mkdir(parents=True, exist_ok=True)
        report_file = reports_dir / f"{result.id}.json"
        report_file.write_text(result.model_dump_json(indent=2), encoding="utf-8")
        log.info("Report saved", report_id=str(result.id), path=str(report_file))
    except Exception as exc:
        log.warning("Failed to save report to disk", error=str(exc))

    return result
