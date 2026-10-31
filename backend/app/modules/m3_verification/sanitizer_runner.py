"""
modules/m3_verification/sanitizer_runner.py — ASan/UBSan Runner
================================================================
Responsibility:
    Execute a compiled binary (built with -fsanitize=address,undefined)
    with provided input and check for AddressSanitizer / UBSan errors.
    Returns pass/fail status, extracted error details, and the raw ASan log.

Inputs:
    binary_path: str    — path to the compiled binary
    input_arg: str      — command-line argument to pass to the binary
    timeout: int        — max seconds to run

Outputs:
    dict  — {passed, errors, asan_log, ubsan_log, exit_code, stdout}
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from app.core.config import settings
from app.core.logger import get_logger

log = get_logger(__name__)


def run(
    binary_path: str,
    input_arg: str = "",
    timeout: int | None = None,
) -> dict:
    """
    Run a binary under AddressSanitizer and return structured results.

    Returns:
        {
          "passed": bool,       # True if no ASan/UBSan errors detected
          "errors": list[str],  # Extracted error lines
          "asan_log": str,      # Full ASan stderr output
          "ubsan_log": str,     # UBSan-specific lines
          "exit_code": int,
          "stdout": str,        # Program stdout
        }
    """
    binary = Path(binary_path)
    run_timeout = timeout or settings.sandbox_timeout_seconds

    if not binary.exists():
        return {
            "passed": False,
            "errors": [f"Binary not found: {binary_path}"],
            "asan_log": "",
            "ubsan_log": "",
            "exit_code": -1,
            "stdout": "",
        }

    # Build environment with ASan options
    env = dict(os.environ)
    env["ASAN_OPTIONS"] = settings.asan_options
    env["UBSAN_OPTIONS"] = "print_stacktrace=1:halt_on_error=0"

    # Build command
    cmd = [str(binary)]
    if input_arg:
        cmd.append(input_arg)

    log.info("Running sanitizer check", binary=binary_path, input=input_arg[:50] if input_arg else "")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=run_timeout,
            env=env,
        )

        asan_log = result.stderr or ""
        stdout = result.stdout or ""

        # Check for ASan / UBSan errors in output
        asan_errors = [
            line for line in asan_log.splitlines()
            if any(
                keyword in line
                for keyword in [
                    "ERROR: AddressSanitizer:",
                    "ERROR: LeakSanitizer:",
                    "runtime error:",       # UBSan
                    "SUMMARY: AddressSanitizer",
                ]
            )
        ]

        ubsan_lines = [
            line for line in asan_log.splitlines()
            if "runtime error:" in line
        ]

        # Also check if the process was killed by signal (crash)
        if result.returncode < 0:
            asan_errors.append(f"Process killed by signal {abs(result.returncode)}")

        passed = len(asan_errors) == 0 and result.returncode >= 0

        log.info(
            "Sanitizer run complete",
            passed=passed,
            asan_errors=len(asan_errors),
            exit_code=result.returncode,
        )
        return {
            "passed": passed,
            "errors": asan_errors,
            "asan_log": asan_log,
            "ubsan_log": "\n".join(ubsan_lines),
            "exit_code": result.returncode,
            "stdout": stdout,
        }

    except FileNotFoundError:
        msg = f"Binary not executable or not found: {binary_path}"
        return {
            "passed": False,
            "errors": [msg],
            "asan_log": "",
            "ubsan_log": "",
            "exit_code": -1,
            "stdout": "",
        }
    except subprocess.TimeoutExpired:
        msg = f"Binary execution timed out after {run_timeout}s"
        log.warning("Sanitizer run timeout", binary=binary_path)
        return {
            "passed": False,
            "errors": [msg],
            "asan_log": msg,
            "ubsan_log": "",
            "exit_code": -1,
            "stdout": "",
        }
