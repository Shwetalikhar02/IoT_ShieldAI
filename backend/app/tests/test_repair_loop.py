"""
tests/test_repair_loop.py — Tests for Connected 5-Feature Pipeline
==================================================================
Tests:
  - Localizer boundary expansion and minimal context extraction (F-A)
  - No-cheating heuristic detection of dummy patches and call deletions (F-D)
  - Repair loop execution with multi-tier escalation and session persistence (F-A, F-B)
  - Conversational refinement with user constraints (F-E)
  - Structured grounded explanation generation (F-C)
"""

import pytest
from uuid import uuid4

from app.modules.m1_analysis.localizer import localize
from app.modules.m3_verification.no_cheating_check import check as check_no_cheating
from app.pipeline.repair_loop import refine_repair_session, run_repair_loop
from app.schemas.repair_session import SessionStatus
from app.schemas.vulnerability import Severity, Vulnerability


def test_localizer_finds_enclosing_function():
    """Verify localizer extracts the enclosing C function without whole-file leakage."""
    res = localize("datasets/demo_firmware/stack_overflow.c", line_hint=29)
    assert res.function_name == "process_device_name"
    assert res.line_start <= 29
    assert res.line_end >= 29
    assert "strcpy" in res.related_symbols
    assert res.confidence >= 0.7


def test_no_cheating_detects_call_deletion():
    """Verify that deleting strcpy without safe replacement is caught."""
    orig = "char buf[32];\nstrcpy(buf, input);"
    cheat_deletion = "char buf[32];\n/* removed call */"
    
    res = check_no_cheating(orig, cheat_deletion)
    assert not res["passed"]
    assert any("deleted" in v.lower() for v in res["violations"])


def test_no_cheating_detects_early_return():
    """Verify that inserting an unconditional early return is caught."""
    orig = "char buf[32];\nstrcpy(buf, input);"
    cheat_early_return = "return 0;\nchar buf[32];\nstrcpy(buf, input);"
    
    res = check_no_cheating(orig, cheat_early_return)
    assert not res["passed"]
    assert any("return" in v.lower() for v in res["violations"])


def test_no_cheating_passes_genuine_patch():
    """Verify genuine bounded replacement passes the check."""
    orig = "char buf[32];\nstrcpy(buf, input);"
    legit_patch = "char buf[32];\nstrncpy(buf, input, sizeof(buf) - 1);\nbuf[sizeof(buf) - 1] = '\\0';"
    
    res = check_no_cheating(orig, legit_patch)
    assert res["passed"]
    assert len(res["violations"]) == 0


@pytest.mark.asyncio
async def test_repair_loop_end_to_end_mock():
    """Verify complete repair loop executes and reaches resolved state."""
    vuln = Vulnerability(
        id=uuid4(),
        file_path="datasets/demo_firmware/stack_overflow.c",
        line_start=29,
        line_end=29,
        cwe_id="CWE-121",
        vuln_type="Stack Buffer Overflow",
        severity=Severity.CRITICAL,
        description="strcpy() into fixed-size buffer",
        root_cause="unbounded string copy",
        code_snippet="strcpy(device_name, input);",
    )

    session = await run_repair_loop(vuln)
    assert session.status == SessionStatus.RESOLVED
    assert len(session.attempts) >= 1
    assert session.attempts[-1].verification.overall_status.value == "passed"
    assert session.explanation is not None
    assert "Security Remediation" in session.explanation


@pytest.mark.asyncio
async def test_conversation_driven_refinement():
    """Verify conversational refinement appends user constraints and creates new attempt."""
    vuln = Vulnerability(
        id=uuid4(),
        file_path="datasets/demo_firmware/stack_overflow.c",
        line_start=29,
        line_end=29,
        cwe_id="CWE-121",
        vuln_type="Stack Buffer Overflow",
        severity=Severity.CRITICAL,
        description="strcpy() into fixed-size buffer",
        root_cause="unbounded string copy",
        code_snippet="strcpy(device_name, input);",
    )

    session = await run_repair_loop(vuln)
    initial_attempts = len(session.attempts)

    # Refine with user directive
    refined = await refine_repair_session(
        session_id=session.session_id,
        user_constraint="Ensure stack overhead is under 32 bytes and do not use dynamic allocation",
    )
    assert len(refined.attempts) == initial_attempts + 1
    assert "Ensure stack overhead" in refined.constraints[-1]
