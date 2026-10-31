"""
schemas/repair_session.py — Repair Session & Loop Schemas (Pydantic v2)
======================================================================
Responsibility:
    Define data contracts for the multi-tier repair loop, code localization,
    iterative verification feedback, and interactive conversational refinement.

Inputs:
    - Vulnerability detections from M1
    - Localization spans from localizer.py
    - Patch candidates from M2
    - Verification outcomes and compiler/sanitizer reports from M3

Outputs:
    - RepairSession, RepairAttempt, Feedback, LocalizationResult objects
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.schemas.patch import Patch
from app.schemas.verification import VerificationResult
from app.schemas.vulnerability import Vulnerability


class LocalizationMethod(str, Enum):
    AST_SCOPE = "ast_scope"
    LINE_SPAN = "line_span"
    HEURISTIC = "heuristic"
    FALLBACK = "fallback"


class LocalizationResult(BaseModel):
    """Pinpointed code boundary and minimal surrounding context."""

    file_path: str = Field(..., description="Target source file path.")
    function_name: str = Field(..., description="Name of the enclosing C/C++ function.")
    line_start: int = Field(..., ge=1, description="1-indexed line where the function begins.")
    line_end: int = Field(..., ge=1, description="1-indexed line where the function ends.")
    context_before: str = Field(default="", description="Relevant struct/macro definitions or headers before the function.")
    context_after: str = Field(default="", description="Trailing context or helper declarations.")
    related_symbols: list[str] = Field(default_factory=list, description="Identifiers and helper functions referenced.")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Localization confidence score (0.0 - 1.0).")
    method: LocalizationMethod = Field(default=LocalizationMethod.AST_SCOPE, description="Localization strategy used.")


class Feedback(BaseModel):
    """Structured diagnostic feedback fed back into M2 for next repair attempt."""

    failed_checks: list[str] = Field(default_factory=list, description="Checks that failed (e.g. compile, asan, no_cheat).")
    compiler_errors: list[str] = Field(default_factory=list, description="Compiler warning and error lines.")
    sanitizer_report: str | None = Field(default=None, description="AddressSanitizer or UBSan stack trace excerpt.")
    no_cheat_violations: list[str] = Field(default_factory=list, description="Anti-cheating heuristic violations.")
    hint_for_next_attempt: str | None = Field(default=None, description="Actionable hint synthesized for the repair model.")


class RepairStrategyType(str, Enum):
    TEMPLATE = "template"
    TEMPLATE_GUIDED_LLM = "template_guided_llm"
    LLM = "llm"


class RepairAttempt(BaseModel):
    """A single execution attempt within a repair session."""

    attempt_no: int = Field(..., ge=1, le=5, description="Attempt number (1 to 3 initial, up to 5 with user refinement).")
    strategy: RepairStrategyType = Field(..., description="Strategy tier employed for this attempt.")
    template_id: str | None = Field(default=None, description="ID of the template used, if applicable.")
    patch: Patch = Field(..., description="Generated candidate patch.")
    verification: VerificationResult = Field(..., description="M3 verification outcome.")
    feedback: Feedback | None = Field(default=None, description="Feedback produced if verification failed.")
    duration_ms: int = Field(default=0, description="Wall-clock duration of the attempt in milliseconds.")


class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FAILED = "failed"


class RepairSession(BaseModel):
    """Stateful record of an end-to-end repair lifecycle."""

    session_id: UUID = Field(default_factory=uuid4, description="Unique session identifier.")
    vulnerability: Vulnerability = Field(..., description="Target vulnerability being remediated.")
    localization: LocalizationResult = Field(..., description="Minimal localized code context.")
    constraints: list[str] = Field(default_factory=list, description="User-supplied constraints and directives.")
    attempts: list[RepairAttempt] = Field(default_factory=list, description="Sequence of repair attempts.")
    status: SessionStatus = Field(default=SessionStatus.IN_PROGRESS, description="Overall session status.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of creation.")
    explanation: str | None = Field(default=None, description="Grounded M4 explanation upon successful resolution.")


class RefineSessionRequest(BaseModel):
    """Payload to inject user constraints into an existing repair session."""

    constraint: str = Field(..., min_length=2, max_length=1000, description="Specific constraint or directive for the next attempt.")
