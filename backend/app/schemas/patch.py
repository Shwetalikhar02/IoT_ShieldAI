"""
schemas/patch.py — Patch Schema (Pydantic v2)
=============================================
Responsibility:
    Define the data shape for a repair patch produced by Module 2 (M2 Repair).
    Captures both the original vulnerable code and the patched replacement,
    along with metadata about which strategy was used and how many LLM retries
    were needed.

Inputs:  Output from patch_generator.py / patch_applier.py in m2_repair
Outputs: Patch objects used as input to M3 verification and M4 explanation

TODO (M2 team):
    - Populate `diff` using Python's difflib.unified_diff in patch_generator.py.
    - Add a `llm_prompt_used` field (optional str) for debugging LLM outputs.
    - Consider adding a `patch_hash` (SHA-256 of patched_code) for deduplication.
"""

from __future__ import annotations

from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class PatchStrategy(str, Enum):
    """How the patch was generated."""
    TEMPLATE = "template"   # Rule-based fix template matched a known pattern
    LLM = "llm"             # No template matched; an LLM generated the fix


class Patch(BaseModel):
    """A single repair patch for one vulnerability."""

    id: UUID = Field(
        default_factory=uuid4,
        description="Auto-generated unique identifier for this patch.",
    )
    vulnerability_id: UUID = Field(
        ...,
        description="References the Vulnerability this patch addresses.",
    )
    strategy: PatchStrategy = Field(
        ...,
        description="Whether the patch came from a rule-based template or an LLM.",
    )
    original_code: str = Field(
        ...,
        description="The vulnerable code lines (as extracted from the source file).",
    )
    patched_code: str = Field(
        ...,
        description="The replacement code lines after applying the fix.",
    )
    diff: str = Field(
        ...,
        description="Unified diff between original_code and patched_code.",
    )
    explanation: str = Field(
        ...,
        description="Human-readable explanation of why this fix resolves the vulnerability.",
    )
    attempt_number: int = Field(
        default=1,
        ge=1,
        le=3,
        description="Which attempt this patch is (1–3). M3 can reject and request retry.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                "vulnerability_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "strategy": "template",
                "original_code": "  char buf[32];\n  strcpy(buf, user_input);",
                "patched_code": "  char buf[32];\n  strncpy(buf, user_input, sizeof(buf) - 1);\n  buf[sizeof(buf) - 1] = '\\0';",
                "diff": "--- original\n+++ patched\n@@ -1,2 +1,3 @@\n   char buf[32];\n-  strcpy(buf, user_input);\n+  strncpy(buf, user_input, sizeof(buf) - 1);\n+  buf[sizeof(buf) - 1] = '\\0';",
                "explanation": "Replaced unbounded strcpy() with strncpy() bounded by buffer size, with explicit NUL termination.",
                "attempt_number": 1,
            }
        }
    }
