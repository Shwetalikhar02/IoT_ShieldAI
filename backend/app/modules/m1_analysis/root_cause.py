"""
modules/m1_analysis/root_cause.py — Root Cause Analyser
=========================================================
Responsibility:
    Given a static analysis finding and the parsed AST, determine the
    root cause of the vulnerability (e.g., "unbounded strcpy into a fixed-
    size stack buffer of 32 bytes").  Produces the root_cause string stored
    in the Vulnerability schema.

Inputs:
    finding: dict      — a single raw finding from static_analyzer.py
    parsed_ast: dict   — the AST from code_parser.py

Outputs:
    str  — plain-English root cause statement

TODO:
    - Map cppcheck / semgrep rule IDs to root-cause templates.
    - Use the AST to resolve buffer sizes from declarations.
    - Fall back to the raw finding message if no template matches.
"""

from __future__ import annotations

from app.core.logger import get_logger

log = get_logger(__name__)


def determine_root_cause(finding: dict, parsed_ast: dict) -> str:
    """
    TODO: Derive root cause from the finding + AST.
    """
    log.debug("root_cause.determine_root_cause stub called")
    return "Root cause analysis not yet implemented"
