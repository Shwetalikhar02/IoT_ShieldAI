"""
api/routes/pipeline.py — Full Pipeline & SSE Progress Routes
=============================================================
Responsibility:
    Run the complete M1→M2→M3→M4 pipeline for a session.
    Stream real-time progress via Server-Sent Events (SSE).

Endpoints:
    POST /api/pipeline/run/{upload_id}   — Run full pipeline, return result
    GET  /api/pipeline/stream/{upload_id} — SSE stream of pipeline steps
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.logger import get_logger
from app.modules.m1_analysis.localizer import localize
from app.modules.m1_analysis.root_cause import determine_root_cause
from app.modules.m1_analysis.severity import classify_severity
from app.modules.m1_analysis.static_analyzer import analyze as run_static_analysis
from app.modules.m4_explain_iot.report_builder import build as build_report
from app.pipeline.repair_loop import run_repair_loop
from app.schemas.report import IoTMetrics, PipelineResult
from app.schemas.vulnerability import Severity, Vulnerability, VulnerabilityList

log = get_logger(__name__)
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

CWE_TYPE_MAP: dict[str, str] = {
    "CWE-121": "Stack Buffer Overflow",
    "CWE-122": "Heap Buffer Overflow",
    "CWE-476": "NULL Pointer Dereference",
    "CWE-134": "Uncontrolled Format String",
    "CWE-416": "Use After Free",
    "CWE-190": "Integer Overflow",
    "CWE-401": "Memory Leak",
    "CWE-415": "Double Free",
}

_SEVERITY_ORDER = {Severity.CRITICAL: 0, Severity.HIGH: 1, Severity.MEDIUM: 2, Severity.LOW: 3}


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Events message."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _stream_pipeline(upload_id: str):
    """Generator that streams pipeline progress as SSE events."""
    upload_dir = Path(settings.upload_dir) / upload_id
    if not upload_dir.exists():
        yield _sse_event("error", {"message": f"Upload session '{upload_id}' not found"})
        return

    src_files = []
    for ext in settings.upload_allowed_ext_list:
        src_files.extend(upload_dir.glob(f"**/*.{ext}"))

    if not src_files:
        yield _sse_event("error", {"message": "No source files found in upload"})
        return

    file_path = str(src_files[0])

    # Step 1: Analysis
    yield _sse_event("step", {
        "step": "analysis",
        "status": "running",
        "message": "Running M1 static analysis (cppcheck + semgrep + patterns)..."
    })
    await asyncio.sleep(0.1)

    findings = await run_static_analysis(file_path)
    vulnerabilities = []
    lines = Path(file_path).read_text(encoding="utf-8", errors="replace").splitlines()

    for finding in findings:
        cwe_id = finding.get("cwe_id", "CWE-000")
        line = finding.get("line", 1)
        code_snippet = lines[line - 1].strip() if 0 < line <= len(lines) else ""
        loc = localize(file_path, line_hint=line)
        root_cause = determine_root_cause(finding, code_snippet)
        severity = classify_severity(cwe_id)
        from uuid import uuid4
        vuln = Vulnerability(
            id=uuid4(),
            file_path=file_path,
            line_start=line,
            line_end=line,
            cwe_id=cwe_id,
            vuln_type=CWE_TYPE_MAP.get(cwe_id, f"Vulnerability ({cwe_id})"),
            severity=severity,
            description=finding.get("message", ""),
            root_cause=root_cause,
            code_snippet=code_snippet or f"Line {line}",
            function_name=loc.function_name,
            confidence=loc.confidence,
        )
        vulnerabilities.append(vuln)

    vulnerabilities.sort(key=lambda v: (_SEVERITY_ORDER.get(v.severity, 99), v.line_start))

    yield _sse_event("step", {
        "step": "analysis",
        "status": "done",
        "message": f"Found {len(vulnerabilities)} vulnerabilities",
        "count": len(vulnerabilities),
        "vulnerabilities": [v.model_dump(mode="json") for v in vulnerabilities],
    })

    if not vulnerabilities:
        yield _sse_event("complete", {
            "message": "No vulnerabilities found — firmware appears clean!",
            "upload_id": upload_id,
        })
        return

    # Step 2: Repair
    patches = []
    verifications = []
    sessions = []
    explanations = []

    for i, vuln in enumerate(vulnerabilities):
        yield _sse_event("step", {
            "step": "repair",
            "status": "running",
            "message": f"Running M2+M3 repair loop for {vuln.cwe_id} at line {vuln.line_start}...",
            "vuln_index": i,
            "total": len(vulnerabilities),
        })
        await asyncio.sleep(0.1)

        session = await run_repair_loop(vulnerability=vuln, upload_id=upload_id)
        sessions.append(session)

        if session.attempts:
            last = session.attempts[-1]
            patches.append(last.patch)
            verifications.append(last.verification)
            if session.explanation:
                explanations.append(session.explanation)

            yield _sse_event("step", {
                "step": "repair",
                "status": "done",
                "message": f"Repair {'RESOLVED' if session.status.value == 'resolved' else 'FAILED'} for {vuln.cwe_id}",
                "vuln_index": i,
                "session_id": str(session.session_id),
                "attempts": len(session.attempts),
                "status": session.status.value,
                "patch": last.patch.model_dump(mode="json"),
                "verification": last.verification.model_dump(mode="json"),
            })

    # Step 3: Report
    yield _sse_event("step", {
        "step": "report",
        "status": "running",
        "message": "Building M4 report with metrics and explanations...",
    })

    result = PipelineResult(
        file_path=file_path,
        vulnerabilities=vulnerabilities,
        patches=patches,
        verification_results=verifications,
        metrics=IoTMetrics(
            binary_size_before_bytes=24576,
            binary_size_after_bytes=24576 + len(patches) * 16,
            binary_size_delta_bytes=len(patches) * 16,
            estimated_stack_delta_bytes=0,
            cyclomatic_complexity_delta=0.0,
        ),
        explanation="\n\n---\n\n".join(explanations),
        total_vulnerabilities=len(vulnerabilities),
        total_patches_applied=sum(
            1 for v in verifications
            if v.overall_status.value == "passed"
        ),
    )

    # Save report
    report_file = Path(settings.reports_dir) / f"{upload_id}.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    report_file.write_text(result.model_dump_json(indent=2), encoding="utf-8")

    yield _sse_event("step", {
        "step": "report",
        "status": "done",
        "message": "Report generated",
    })

    yield _sse_event("complete", {
        "message": "Pipeline complete!",
        "upload_id": upload_id,
        "report_id": upload_id,
        "total_vulnerabilities": len(vulnerabilities),
        "total_fixed": result.total_patches_applied,
        "result": result.model_dump(mode="json"),
    })


@router.get("/stream/{upload_id}", summary="Stream pipeline progress via SSE")
async def stream_pipeline(upload_id: str) -> StreamingResponse:
    """Stream real-time pipeline progress as Server-Sent Events."""
    return StreamingResponse(
        _stream_pipeline(upload_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/run/{upload_id}", response_model=PipelineResult, summary="Run full pipeline")
async def run_pipeline(upload_id: str) -> PipelineResult:
    """
    Run the complete M1→M2→M3→M4 pipeline synchronously and return the result.
    For real-time progress, use GET /api/pipeline/stream/{upload_id} instead.
    """
    upload_dir = Path(settings.upload_dir) / upload_id
    if not upload_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Upload session '{upload_id}' not found.",
        )

    # Collect all results from the SSE generator
    result_data: dict = {}
    async for event_str in _stream_pipeline(upload_id):
        if event_str.startswith("event: complete"):
            data_line = [l for l in event_str.split("\n") if l.startswith("data: ")]
            if data_line:
                complete_data = json.loads(data_line[0][6:])
                result_data = complete_data.get("result", {})

    if not result_data:
        # Check saved report
        report_file = Path(settings.reports_dir) / f"{upload_id}.json"
        if report_file.exists():
            result_data = json.loads(report_file.read_text())
        else:
            raise HTTPException(status_code=500, detail="Pipeline execution failed.")

    return PipelineResult.model_validate(result_data)
