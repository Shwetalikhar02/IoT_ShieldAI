"""
modules/m1_analysis/root_cause.py — Root Cause Analyser
=========================================================
Responsibility:
    Map a static analysis finding + code context to a plain-English root cause
    statement. Uses CWE-specific templates augmented by pattern recognition.

Inputs:
    finding: dict      — a single raw finding from static_analyzer.py
    code_snippet: str  — the vulnerable code line(s)

Outputs:
    str  — plain-English root cause statement
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)

# Root cause templates per CWE
_ROOT_CAUSE_TEMPLATES: dict[str, str] = {
    "CWE-121": (
        "Unbounded string copy into a fixed-size stack buffer without length validation. "
        "If the source data exceeds the buffer size, adjacent stack memory (including the "
        "return address) is overwritten, enabling stack corruption and potential code execution."
    ),
    "CWE-122": (
        "Unbounded write into a dynamically allocated heap buffer without size validation. "
        "Exceeding the allocated size overwrites adjacent heap metadata or data, enabling "
        "heap corruption, arbitrary code execution, or denial of service."
    ),
    "CWE-476": (
        "Memory allocation return value is not verified before dereferencing. Under "
        "low-memory (OOM) conditions, malloc/calloc returns NULL, and subsequent "
        "pointer dereference causes a NULL pointer dereference crash."
    ),
    "CWE-134": (
        "User-controlled data is passed directly as a printf/fprintf format argument. "
        "An attacker can supply format specifiers (%x, %n) to read arbitrary memory "
        "or execute writes to arbitrary memory locations."
    ),
    "CWE-416": (
        "A heap-allocated buffer is freed but the pointer is not nullified. "
        "Subsequent access through the dangling pointer reads or writes freed memory, "
        "causing undefined behavior, heap corruption, or arbitrary code execution."
    ),
    "CWE-190": (
        "Integer arithmetic (multiplication) overflows before being used as a memory "
        "allocation size. The truncated result produces an undersized buffer, and "
        "subsequent writes overflow the allocation, corrupting adjacent heap data."
    ),
    "CWE-401": (
        "Allocated memory is not freed on all code paths, causing a memory leak. "
        "On resource-constrained IoT devices, repeated leaks exhaust available SRAM "
        "leading to allocation failures, crashes, or watchdog timer resets."
    ),
    "CWE-415": (
        "The same pointer is freed more than once. The second free() corrupts heap "
        "metadata, enabling heap exploitation or program crash."
    ),
}

# Pattern-based context hints
_PATTERN_HINTS: list[tuple[str, str]] = [
    ("strcpy", "unsafe strcpy without bounds checking into fixed-size buffer"),
    ("strcat", "unsafe strcat concatenation without size guard"),
    ("sprintf", "unbounded sprintf without output size limit"),
    ("gets", "gets() reads unbounded input from stdin"),
    ("malloc", "malloc return value unchecked before pointer use"),
    ("free", "freed pointer not set to NULL enabling dangling pointer access"),
    ("printf", "user-controlled variable used as format string"),
]


def determine_root_cause(finding: dict, code_snippet: str = "") -> str:
    """
    Return a human-readable root cause for a vulnerability finding.

    Args:
        finding: A finding dict with at least 'cwe_id' and 'message' keys.
        code_snippet: The actual vulnerable code line(s) for context.

    Returns:
        Plain-English root cause statement.
    """
    cwe_id = finding.get("cwe_id", "")

    # Prefer the CWE-specific template
    if cwe_id in _ROOT_CAUSE_TEMPLATES:
        base = _ROOT_CAUSE_TEMPLATES[cwe_id]
    else:
        base = finding.get("message", f"Potential vulnerability ({cwe_id}) detected.")

    # Add code-specific context if we can identify the pattern
    snippet_lower = code_snippet.lower()
    for pattern, hint in _PATTERN_HINTS:
        if pattern in snippet_lower:
            base = f"{hint.capitalize()}. {base}"
            break

    return base
