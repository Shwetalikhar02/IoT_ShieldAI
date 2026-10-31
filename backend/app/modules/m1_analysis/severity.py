"""
modules/m1_analysis/severity.py — Severity Classifier
======================================================
Responsibility:
    Map a vulnerability finding to a Severity level (Critical / High /
    Medium / Low) based on CWE ID, static heuristics, and optionally
    CVSS scoring.

Inputs:
    cwe_id: str      — e.g. "CWE-121"
    context: dict    — optional context (e.g., network-facing? privileged?)

Outputs:
    Severity  — from app.schemas.vulnerability.Severity

TODO:
    - Build a CWE → default Severity mapping table.
    - Allow context flags to escalate/downgrade severity
      (e.g., network-reachable buffer overflow → always Critical).
    - Integrate CVSS 3.1 calculator for precise scoring.
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.vulnerability import Severity

log = get_logger(__name__)

# Placeholder mapping — expand with full CWE list
_CWE_SEVERITY_MAP: dict[str, Severity] = {
    "CWE-121": Severity.CRITICAL,   # Stack Buffer Overflow
    "CWE-122": Severity.CRITICAL,   # Heap Buffer Overflow
    "CWE-476": Severity.HIGH,       # NULL Pointer Dereference
    "CWE-134": Severity.HIGH,       # Uncontrolled Format String
    "CWE-416": Severity.CRITICAL,   # Use After Free
    "CWE-190": Severity.HIGH,       # Integer Overflow
    "CWE-125": Severity.HIGH,       # Out-of-bounds Read
    "CWE-787": Severity.CRITICAL,   # Out-of-bounds Write
}


def classify_severity(cwe_id: str, context: dict | None = None) -> Severity:
    """
    TODO: Return accurate severity from CWE + context.
    Currently returns from the static map or defaults to MEDIUM.
    """
    return _CWE_SEVERITY_MAP.get(cwe_id, Severity.MEDIUM)
