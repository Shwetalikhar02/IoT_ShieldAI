"""
modules/m3_verification/sanitizer_runner.py — AddressSanitizer Runner
======================================================================
Responsibility:
    Execute the compiled (ASan-instrumented) binary inside the Docker sandbox
    and check for AddressSanitizer / UndefinedBehaviorSanitizer errors in the
    output.  Parses the ASan report to extract error types and locations.

Inputs:
    binary_path: str    — path to the compiled binary inside the sandbox
    timeout: int        — maximum seconds to let the binary run

Outputs:
    dict  — { "passed": bool, "errors": list[str], "asan_log": str }

TODO:
    - Implement run(binary_path, timeout) that executes the binary and captures
      output from both stdout and stderr (ASan writes to stderr by default).
    - Parse the "ERROR: AddressSanitizer:" line to extract error type + location.
    - Set ASAN_OPTIONS from settings.asan_options as an env var.
    - Also capture UBSan output (UBSAN_OPTIONS=print_stacktrace=1).
    - Return the full ASan log in `asan_log` for inclusion in the report.
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


async def run(binary_path: str, timeout: int = 30) -> dict:
    """
    TODO: Run the binary under ASan and return pass/fail status and errors.
    """
    log.info("sanitizer_runner.run stub called", binary=binary_path)
    return {"passed": False, "errors": ["Stub: sanitizer_runner not yet implemented"], "asan_log": ""}
