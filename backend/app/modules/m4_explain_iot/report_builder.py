"""
modules/m4_explain_iot/report_builder.py — Report Builder
===========================================================
Responsibility:
    Assemble the final PipelineResult from M1, M2, M3 outputs plus the
    M4-generated explanation and metrics.  Optionally render an HTML/PDF
    report for download.

Inputs:
    vulnerabilities: list[Vulnerability]
    patches: list[Patch]
    verification_results: list[VerificationResult]
    metrics: IoTMetrics
    explanation: str
    file_path: str

Outputs:
    PipelineResult  — complete assembled report

TODO:
    - Implement build(vulnerabilities, patches, verification_results,
      metrics, explanation, file_path) to assemble PipelineResult.
    - Implement render_html(pipeline_result) using Jinja2 templates
      (create templates/ directory under m4_explain_iot/).
    - Add a PDF export using weasyprint (add to requirements.txt).
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.report import PipelineResult

log = get_logger(__name__)


async def build(
    vulnerabilities: list,
    patches: list,
    verification_results: list,
    metrics,
    explanation: str,
    file_path: str,
) -> PipelineResult:
    """
    TODO: Assemble and return the final PipelineResult.
    """
    log.info("report_builder.build stub called", file_path=file_path)
    return PipelineResult(file_path=file_path)
