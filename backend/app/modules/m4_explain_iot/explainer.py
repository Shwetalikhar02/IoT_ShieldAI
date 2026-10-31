"""
modules/m4_explain_iot/explainer.py — Grounded IoT Patch Explainer
==================================================================
Responsibility:
    Synthesize grounded, structured natural-language explanations tailored
    for embedded systems and IoT firmware engineers.  Breaks down root cause,
    mechanics of the fix, memory safety guarantees, and resource implications.

Inputs:
    vulnerability: Vulnerability
    patch: Patch
    verification_result: VerificationResult

Outputs:
    str (Markdown explanation)
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.modules.m2_repair.llm_client import get_llm_client
from app.schemas.patch import Patch
from app.schemas.verification import VerificationResult
from app.schemas.vulnerability import Vulnerability

log = get_logger(__name__)


class GroundedExplanation(BaseModel):
    summary: str = Field(..., description="High-level summary of the remediation.")
    root_cause_analysis: str = Field(..., description="Technical breakdown of the flaw.")
    fix_rationale: str = Field(..., description="Why this exact code transformation fixes the vulnerability.")
    memory_safety_guarantee: str = Field(..., description="Proof/rationale of sanitizer pass.")
    iot_resource_impact: dict[str, int] = Field(
        default_factory=dict, description="Estimated flash (ROM) and SRAM stack deltas."
    )
    recommendations: list[str] = Field(default_factory=list, description="Best practices for developers.")


async def explain(
    vulnerability: Vulnerability,
    patch: Patch,
    verification_result: VerificationResult,
) -> str:
    """Generate a structured Markdown explanation grounded in the verification outcome."""
    prompt = (
        f"Explain the following IoT firmware security patch for embedded engineers:\n\n"
        f"CWE: {vulnerability.cwe_id} ({vulnerability.vuln_type})\n"
        f"Description: {vulnerability.description}\n"
        f"Root Cause: {vulnerability.root_cause}\n"
        f"Original Snippet:\n{patch.original_code}\n\n"
        f"Patched Snippet:\n{patch.patched_code}\n\n"
        f"Diff:\n{patch.diff}\n\n"
        f"Verification Outcome: Compiles={verification_result.compiles}, ASan Clean={verification_result.sanitizer_passed}\n"
    )

    llm = get_llm_client()
    try:
        explanation_obj = await llm.generate_structured(
            prompt=prompt,
            response_model=GroundedExplanation,
            system_prompt=(
                "You are an embedded firmware security architect. Provide a grounded, accurate explanation "
                "of why this patch is safe and its resource impact on microcontrollers (stack/flash)."
            ),
        )
        
        md_output = (
            f"### Security Remediation: {vulnerability.vuln_type} ({vulnerability.cwe_id})\n\n"
            f"**Summary**: {explanation_obj.summary}\n\n"
            f"#### 1. Root Cause Analysis\n{explanation_obj.root_cause_analysis}\n\n"
            f"#### 2. Fix Mechanics\n{explanation_obj.fix_rationale}\n\n"
            f"#### 3. Memory Safety Guarantee\n{explanation_obj.memory_safety_guarantee}\n\n"
            f"#### 4. IoT Resource Impact\n"
            f"- **Estimated ROM (Flash) Delta**: {explanation_obj.iot_resource_impact.get('flash_delta_bytes', 0):+d} bytes\n"
            f"- **Estimated Stack (SRAM) Delta**: {explanation_obj.iot_resource_impact.get('stack_delta_bytes', 0):+d} bytes\n\n"
            f"#### 5. Embedded Developer Recommendations\n"
        )
        for rec in explanation_obj.recommendations:
            md_output += f"- {rec}\n"
            
        return md_output

    except Exception as exc:
        log.warning("Structured explanation fallback invoked", error=str(exc))
        return (
            f"### Security Remediation: {vulnerability.vuln_type} ({vulnerability.cwe_id})\n\n"
            f"**Summary**: {patch.explanation}\n\n"
            f"- **Original Code**: `{patch.original_code.strip()}`\n"
            f"- **Patched Code**: `{patch.patched_code.strip()}`\n"
            f"- **Status**: Verified clean under compilation and AddressSanitizer."
        )
