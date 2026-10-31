"""
modules/m1_analysis/localizer.py — Unified Code Localizer
=========================================================
Responsibility:
    Pinpoint the exact enclosing function and line boundaries for a vulnerability
    and extract only the minimal necessary context (macro defines, structs,
    helper declarations).  Ensures the entire file is NEVER sent to an LLM.

Inputs:
    file_path: str                 — Path to the target C/C++ source file
    line_hint: int | None          — 1-indexed line where the vulnerability was found
    raw_findings: list[dict] | None— Optional static analysis findings

Outputs:
    LocalizationResult             — Localized function span and minimal context
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from app.core.logger import get_logger
from app.schemas.repair_session import LocalizationMethod, LocalizationResult

log = get_logger(__name__)

# Regular expressions for C function signatures, structs, and macros
FUNC_SIG_REGEX = re.compile(
    r"^(?:\s*static\s+|\s*inline\s+|\s*extern\s+)?([a-zA-Z_][a-zA-Z0-9_\s\*]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^;]*?)\)\s*\{?",
    re.MULTILINE,
)
MACRO_REGEX = re.compile(r"^\s*#\s*(?:define|include)\s+.*$", re.MULTILINE)
STRUCT_REGEX = re.compile(r"typedef\s+struct\s*\{[^}]*\}\s*[a-zA-Z0-9_]+;", re.DOTALL)


def extract_context_definitions(code_lines: list[str], function_start_line: int) -> str:
    """Extract only relevant #define macros and typedef structs appearing before the function."""
    prior_code = "\n".join(code_lines[: max(0, function_start_line - 1)])
    macros = MACRO_REGEX.findall(prior_code)
    structs = STRUCT_REGEX.findall(prior_code)
    
    context_parts: list[str] = []
    if macros:
        context_parts.extend(macros[-10:])  # Keep up to 10 nearest macros/includes
    if structs:
        context_parts.extend(structs[-5:])   # Keep up to 5 nearest structs
        
    return "\n".join(context_parts)


def find_enclosing_function(
    content: str, line_hint: int
) -> tuple[str, int, int, str]:
    """Identify the function enclosing line_hint (1-indexed).
    
    Returns:
        (function_name, start_line, end_line, function_body)
    """
    lines = content.splitlines()
    total_lines = len(lines)
    
    if line_hint < 1 or line_hint > total_lines:
        line_hint = max(1, min(line_hint, total_lines))

    # Look backwards from line_hint to find function signature
    start_line = 1
    function_name = "unknown_function"
    
    for i in range(line_hint - 1, -1, -1):
        line = lines[i]
        # Skip comment lines
        stripped = line.strip()
        if stripped.startswith("/*") or stripped.startswith("*") or stripped.startswith("//"):
            continue
            
        match = FUNC_SIG_REGEX.search(line)
        if match:
            # Check if it's not a control structure like if/for/while/switch
            matched_name = match.group(2).strip()
            if matched_name not in ("if", "for", "while", "switch", "catch"):
                function_name = matched_name
                start_line = i + 1  # 1-indexed
                break
                
    # Now find the closing brace from start_line onwards
    brace_depth = 0
    found_first_brace = False
    end_line = total_lines

    for i in range(start_line - 1, total_lines):
        line = lines[i]
        for char in line:
            if char == "{":
                brace_depth += 1
                found_first_brace = True
            elif char == "}":
                brace_depth -= 1
                if found_first_brace and brace_depth == 0:
                    end_line = i + 1  # 1-indexed
                    break
        if found_first_brace and brace_depth == 0:
            break

    func_body = "\n".join(lines[start_line - 1 : end_line])
    return function_name, start_line, end_line, func_body


def extract_related_symbols(func_body: str) -> list[str]:
    """Extract standard library functions and critical identifiers inside the function body."""
    candidates = [
        "strcpy", "strncpy", "memcpy", "memmove", "memset",
        "malloc", "calloc", "free", "realloc",
        "printf", "sprintf", "snprintf", "fprintf",
        "strlen", "sizeof", "assert",
    ]
    found = [sym for sym in candidates if sym in func_body]
    return found


def localize(
    file_path: str,
    line_hint: int | None = None,
    raw_findings: list[dict] | None = None,
) -> LocalizationResult:
    """Pinpoint function and minimal context for the given file and line hint."""
    if not os.path.exists(file_path):
        # Graceful fallback if file path is relative or not found on disk
        return LocalizationResult(
            file_path=file_path,
            function_name="unknown_function",
            line_start=line_hint or 1,
            line_end=(line_hint or 1) + 10,
            context_before="// File not accessible on disk",
            context_after="",
            related_symbols=[],
            confidence=0.5,
            method=LocalizationMethod.FALLBACK,
        )

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as exc:
        log.error("Failed reading source file for localization", file_path=file_path, error=str(exc))
        return LocalizationResult(
            file_path=file_path,
            function_name="unknown_function",
            line_start=line_hint or 1,
            line_end=(line_hint or 1) + 10,
            confidence=0.3,
            method=LocalizationMethod.FALLBACK,
        )

    lines = content.splitlines()
    target_line = line_hint or 1
    if raw_findings and not line_hint:
        for finding in raw_findings:
            if "line" in finding:
                target_line = finding["line"]
                break

    func_name, start_line, end_line, func_body = find_enclosing_function(content, target_line)
    context_before = extract_context_definitions(lines, start_line)
    related_symbols = extract_related_symbols(func_body)

    return LocalizationResult(
        file_path=file_path,
        function_name=func_name,
        line_start=start_line,
        line_end=end_line,
        context_before=context_before,
        context_after="",
        related_symbols=related_symbols,
        confidence=0.95 if func_name != "unknown_function" else 0.70,
        method=LocalizationMethod.AST_SCOPE if func_name != "unknown_function" else LocalizationMethod.LINE_SPAN,
    )
