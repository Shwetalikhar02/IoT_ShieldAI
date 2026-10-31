"""
schemas/report.py — Pipeline Report Schema (Pydantic v2)
=========================================================
Responsibility:
    Define the top-level PipelineResult and supporting Metrics schema that
    represents the complete output of one end-to-end analysis + repair run.
    This is the payload returned by GET /api/report/{id} and the input to
    Module 4 (M4 Explanation + IoT metrics).

Inputs:
    - List[Vulnerability]      from M1
    - List[Patch]              from M2
    - List[VerificationResult] from M3
    - Metrics                  from M4 resource_metrics.py

Outputs: PipelineResult — serialisable to JSON for the frontend

TODO (M4 team):
    - Populate IoTMetrics from resource_metrics.py (measure binary size delta,
      estimated stack usage change, cycle count estimate).
    - Add a `summary_html` field (optional str) rendered by report_builder.py
      for download as a PDF/HTML report.
    - Add `run_duration_seconds` from wall-clock timing in orchestrator.py.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.schemas.patch import Patch
from app.schemas.verification import VerificationResult
from app.schemas.vulnerability import Vulnerability


class IoTMetrics(BaseModel):
    """Resource impact metrics relevant to constrained IoT devices."""

    binary_size_before_bytes: int | None = Field(
        default=None,
        description="Binary size of the original firmware in bytes.",
    )
    binary_size_after_bytes: int | None = Field(
        default=None,
        description="Binary size of the patched firmware in bytes.",
    )
    binary_size_delta_bytes: int | None = Field(
        default=None,
        description="Signed delta: after − before.  Negative means the patch shrank the binary.",
    )
    estimated_stack_delta_bytes: int | None = Field(
        default=None,
        description="Estimated change in worst-case stack usage (from static analysis).",
    )
    cyclomatic_complexity_delta: float | None = Field(
        default=None,
        description="Change in cyclomatic complexity of the patched function.",
    )

    model_config = {"json_schema_extra": {"example": {
        "binary_size_before_bytes": 24576,
        "binary_size_after_bytes": 24608,
        "binary_size_delta_bytes": 32,
        "estimated_stack_delta_bytes": -4,
        "cyclomatic_complexity_delta": 0.0,
    }}}


class PipelineResult(BaseModel):
    """Complete result of one IoT ShieldAI analysis + repair pipeline run."""

    id: UUID = Field(
        default_factory=uuid4,
        description="Unique identifier for this pipeline run.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp when the pipeline run was created.",
    )
    file_path: str = Field(
        ...,
        description="Path of the firmware file that was analysed.",
    )
    vulnerabilities: list[Vulnerability] = Field(
        default_factory=list,
        description="All vulnerabilities detected by M1.",
    )
    patches: list[Patch] = Field(
        default_factory=list,
        description="All patches produced by M2 (one per vulnerability, multiple attempts possible).",
    )
    verification_results: list[VerificationResult] = Field(
        default_factory=list,
        description="Verification outcome for each patch attempt.",
    )
    metrics: IoTMetrics = Field(
        default_factory=IoTMetrics,
        description="IoT resource impact metrics from M4.",
    )
    explanation: str = Field(
        default="",
        description="Human-readable LLM-generated explanation of all patches (from M4).",
    )
    total_vulnerabilities: int = Field(
        default=0,
        description="Convenience count of detected vulnerabilities.",
    )
    total_patches_applied: int = Field(
        default=0,
        description="Number of patches that passed all three M3 checks.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
                "created_at": "2026-10-31T17:00:00Z",
                "file_path": "datasets/demo_firmware/stack_overflow.c",
                "vulnerabilities": [],
                "patches": [],
                "verification_results": [],
                "metrics": {},
                "explanation": "All 2 vulnerabilities were patched successfully.",
                "total_vulnerabilities": 2,
                "total_patches_applied": 2,
            }
        }
    }
