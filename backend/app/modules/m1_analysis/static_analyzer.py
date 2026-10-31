"""
modules/m1_analysis/static_analyzer.py — Static Analysis Driver
================================================================
Responsibility:
    Invoke external static analysis tools (cppcheck, semgrep) via subprocess
    inside the Docker sandbox and parse their output into a normalised format.

Inputs:
    file_path: str  — absolute path to the C/C++ source file inside the sandbox

Outputs:
    list[dict]  — raw findings: [{tool, file, line, rule_id, message}, ...]

TODO:
    - Implement _run_cppcheck(file_path) using subprocess + XML output parser.
    - Implement _run_semgrep(file_path) using the semgrep SARIF/JSON output.
    - Implement analyze(file_path) that runs both tools and merges results.
    - Deduplicate overlapping findings by (line, rule_id).
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


async def analyze(file_path: str) -> list[dict]:
    """
    TODO: Run cppcheck + semgrep on file_path and return merged findings.
    """
    log.info("static_analyzer.analyze stub called", file_path=file_path)
    return []
