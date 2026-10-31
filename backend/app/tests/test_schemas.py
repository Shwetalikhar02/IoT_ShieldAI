"""
tests/test_schemas.py — Pydantic Schema Validation Tests
=========================================================
Responsibility:
    Verify that all Pydantic v2 schemas validate correctly with valid data
    and reject invalid data with appropriate errors.

TODO:
    - Add edge-case tests: line_end < line_start, empty code_snippet, etc.
    - Add tests for VerificationResult.overall_status auto-derivation.
    - Add tests for PipelineResult assembling all sub-schemas.
"""

import pytest
from uuid import uuid4

from app.schemas.vulnerability import Vulnerability, Severity
from app.schemas.patch import Patch, PatchStrategy
from app.schemas.verification import VerificationResult, OverallStatus
from app.schemas.report import PipelineResult


def test_vulnerability_valid():
    """A fully-specified Vulnerability should pass validation."""
    v = Vulnerability(
        file_path="test.c",
        line_start=1,
        line_end=2,
        cwe_id="CWE-121",
        vuln_type="Stack Buffer Overflow",
        severity=Severity.CRITICAL,
        description="Test",
        root_cause="unbounded strcpy",
        code_snippet="strcpy(buf, src);",
    )
    assert v.cwe_id == "CWE-121"


def test_verification_result_auto_passed():
    """All True checks should produce overall_status = 'passed'."""
    vr = VerificationResult(
        patch_id=uuid4(),
        compiles=True,
        sanitizer_passed=True,
        no_cheating_passed=True,
    )
    assert vr.overall_status == OverallStatus.PASSED


def test_verification_result_auto_failed():
    """Any False check should produce overall_status = 'failed'."""
    vr = VerificationResult(
        patch_id=uuid4(),
        compiles=True,
        sanitizer_passed=False,
        no_cheating_passed=True,
    )
    assert vr.overall_status == OverallStatus.FAILED
