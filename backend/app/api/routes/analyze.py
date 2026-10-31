"""
api/routes/analyze.py — Static Analysis Route
===============================================
Responsibility:
    Accept an upload_id, run M1 analysis (static_analyzer + localizer +
    root_cause + severity + dl_classifier) on all uploaded files, and
    return a VulnerabilityList.

Endpoints:
    POST /api/analyze/{upload_id}
    POST /api/analyze          (body: {upload_id})
"""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.logger import get_logger
from app.modules.m1_analysis.localizer import localize
from app.modules.m1_analysis.root_cause import determine_root_cause
from app.modules.m1_analysis.severity import classify_severity
from app.modules.m1_analysis.static_analyzer import analyze as run_static_analysis
from app.schemas.vulnerability import Severity, Vulnerability, VulnerabilityList

log = get_logger(__name__)
router = APIRouter(prefix="/analyze", tags=["Analysis"])

_SEVERITY_ORDER = {
    Severity.CRITICAL: 0,
    Severity.HIGH: 1,
    Severity.MEDIUM: 2,
    Severity.LOW: 3,
}

# CWE → human-readable vuln type
CWE_TYPE_MAP: dict[str, str] = {
    "CWE-121": "Stack Buffer Overflow",
    "CWE-122": "Heap Buffer Overflow",
    "CWE-476": "NULL Pointer Dereference",
    "CWE-134": "Uncontrolled Format String",
    "CWE-416": "Use After Free",
    "CWE-190": "Integer Overflow",
    "CWE-401": "Memory Leak",
    "CWE-415": "Double Free",
    "CWE-125": "Out-of-bounds Read",
    "CWE-787": "Out-of-bounds Write",
}


class AnalyzeRequest(BaseModel):
    upload_id: str


async def _analyze_file(file_path: str) -> list[Vulnerability]:
    """Run the full M1 pipeline on a single file."""
    findings = await run_static_analysis(file_path)
    vulnerabilities: list[Vulnerability] = []

    for finding in findings:
        cwe_id = finding.get("cwe_id", "CWE-000")
        line = finding.get("line", 1)
        message = finding.get("message", "")

        # Get severity
        severity = classify_severity(cwe_id)

        # Get localized code snippet
        loc = localize(file_path, line_hint=line)
        lines = Path(file_path).read_text(encoding="utf-8", errors="replace").splitlines()
        code_snippet = lines[line - 1].strip() if 0 < line <= len(lines) else ""

        # Get root cause
        root_cause = determine_root_cause(finding, code_snippet)

        # Vuln type
        vuln_type = CWE_TYPE_MAP.get(cwe_id, f"Vulnerability ({cwe_id})")

        vuln = Vulnerability(
            id=uuid4(),
            file_path=file_path,
            line_start=line,
            line_end=line,
            cwe_id=cwe_id,
            vuln_type=vuln_type,
            severity=severity,
            description=message,
            root_cause=root_cause,
            code_snippet=code_snippet or f"Line {line} in {Path(file_path).name}",
            function_name=loc.function_name,
            confidence=loc.confidence,
        )
        vulnerabilities.append(vuln)

    return vulnerabilities


@router.post(
    "/{upload_id}",
    response_model=VulnerabilityList,
    summary="Run M1 static analysis on uploaded files",
)
async def analyze_by_id(upload_id: str) -> VulnerabilityList:
    """Analyze all files in an upload session and return detected vulnerabilities."""
    return await _do_analyze(upload_id)


@router.post(
    "",
    response_model=VulnerabilityList,
    summary="Run M1 static analysis (body upload_id)",
)
async def analyze_firmware(req: AnalyzeRequest) -> VulnerabilityList:
    """Analyze all files in an upload session (body-based variant)."""
    return await _do_analyze(req.upload_id)


async def _do_analyze(upload_id: str) -> VulnerabilityList:
    upload_dir = Path(settings.upload_dir) / upload_id
    if not upload_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Upload session '{upload_id}' not found. Run POST /api/upload first.",
        )

    # Find all C/C++ source files in upload dir
    src_files = []
    for ext in settings.upload_allowed_ext_list:
        src_files.extend(upload_dir.glob(f"**/*.{ext}"))

    if not src_files:
        raise HTTPException(
            status_code=400,
            detail=f"No C/C++ files found in upload '{upload_id}'.",
        )

    log.info("Starting analysis", upload_id=upload_id, files=len(src_files))
    all_vulns: list[Vulnerability] = []

    for src in src_files:
        vulns = await _analyze_file(str(src))
        all_vulns.extend(vulns)

    # Sort by severity then line
    all_vulns.sort(key=lambda v: (_SEVERITY_ORDER.get(v.severity, 99), v.line_start))

    log.info(
        "Analysis complete",
        upload_id=upload_id,
        total=len(all_vulns),
    )
    return VulnerabilityList(total=len(all_vulns), vulnerabilities=all_vulns)
