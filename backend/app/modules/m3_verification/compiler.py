"""
modules/m3_verification/compiler.py — Compilation Check
=========================================================
Responsibility:
    Compile a C/C++ source file using GCC or Clang with strict warning flags.
    Returns compilation success, error/warning messages, and the command used.
    Runs via subprocess — intended to run inside or alongside the sandbox.

Inputs:
    file_path: str          — path to the C/C++ source file
    use_asan: bool          — if True, adds -fsanitize=address,undefined -g
    compiler: str           — "gcc" or "clang"
    output_path: str | None — where to write the compiled binary

Outputs:
    dict  — {success, compiles, errors, warnings, command, output_path}
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from app.core.config import settings
from app.core.logger import get_logger

log = get_logger(__name__)


def compile_file(
    file_path: str,
    use_asan: bool = False,
    compiler: str | None = None,
    output_path: str | None = None,
    extra_flags: list[str] | None = None,
) -> dict:
    """
    Compile the given C file and return a result dict.

    Returns:
        {
          "success": bool,          # True if compilation succeeded
          "compiles": bool,         # alias for success
          "errors": list[str],      # error lines
          "warnings": list[str],    # warning lines
          "command": str,           # exact command that was run
          "output_path": str,       # path to compiled binary (if success)
          "return_code": int,
        }
    """
    cc = compiler or settings.compiler
    src = Path(file_path)

    if not src.exists():
        return {
            "success": False,
            "compiles": False,
            "errors": [f"Source file not found: {file_path}"],
            "warnings": [],
            "command": "",
            "output_path": None,
            "return_code": -1,
        }

    # Determine output binary path
    if output_path is None:
        output_path = str(src.parent / src.stem)

    # Build command
    cmd = [cc, str(src), "-o", output_path, "-Wall", "-Wextra"]
    if use_asan:
        cmd += ["-fsanitize=address,undefined", "-g", "-O0"]
    else:
        cmd += ["-O1"]
    if extra_flags:
        cmd += extra_flags

    command_str = " ".join(cmd)
    log.info("Running compiler", command=command_str)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=settings.sandbox_timeout_seconds,
        )
        output = result.stderr  # GCC writes errors/warnings to stderr

        errors = [
            line for line in output.splitlines()
            if ": error:" in line
        ]
        warnings = [
            line for line in output.splitlines()
            if ": warning:" in line
        ]

        success = result.returncode == 0
        log.info(
            "Compilation result",
            success=success,
            errors=len(errors),
            warnings=len(warnings),
        )
        return {
            "success": success,
            "compiles": success,
            "errors": errors,
            "warnings": warnings,
            "command": command_str,
            "output_path": output_path if success else None,
            "return_code": result.returncode,
        }

    except FileNotFoundError:
        msg = f"Compiler '{cc}' not found on PATH. Install GCC or use Docker sandbox."
        log.warning("Compiler not found", compiler=cc)
        return {
            "success": False,
            "compiles": False,
            "errors": [msg],
            "warnings": [],
            "command": command_str,
            "output_path": None,
            "return_code": -1,
        }
    except subprocess.TimeoutExpired:
        msg = f"Compilation timed out after {settings.sandbox_timeout_seconds}s"
        log.warning("Compilation timeout", file=file_path)
        return {
            "success": False,
            "compiles": False,
            "errors": [msg],
            "warnings": [],
            "command": command_str,
            "output_path": None,
            "return_code": -1,
        }
