"""
modules/m3_verification/compiler.py — Compilation Check
=========================================================
Responsibility:
    Compile a patched C/C++ source file inside the Docker sandbox using GCC
    (or Clang) and return whether compilation succeeded along with any error
    messages.

Inputs:
    patched_file_path: str  — path to the patched .c/.cpp file in the sandbox
    compiler: str           — "gcc" or "clang" (from settings.compiler)

Outputs:
    dict  — { "success": bool, "errors": list[str], "command": str }

TODO:
    - Implement compile(patched_file_path) that runs the compiler via
      subprocess inside the Docker sandbox container.
    - Capture both stdout and stderr; parse compiler error lines.
    - Support AddressSanitizer flags: -fsanitize=address,undefined -g
    - Return the full compiler command in the result for transparency.
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


async def compile_file(patched_file_path: str, compiler: str = "gcc") -> dict:
    """
    TODO: Compile the patched file and return success status and errors.
    """
    log.info("compiler.compile_file stub called", path=patched_file_path)
    return {"success": False, "errors": ["Stub: compiler not yet implemented"], "command": ""}
