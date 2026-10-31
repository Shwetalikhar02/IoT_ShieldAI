"""
modules/m1_analysis/static_analyzer.py — Static Analysis Driver
================================================================
Responsibility:
    Run cppcheck and semgrep on a C/C++ source file, parse their output,
    deduplicate overlapping findings, and map each to a CWE + severity.
    Falls back to regex pattern matching when tools are unavailable.

Inputs:
    file_path: str  — absolute or relative path to the C/C++ source file

Outputs:
    list[dict]  — [{tool, file, line, cwe_id, rule_id, message, severity}, ...]
"""

from __future__ import annotations

import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

from app.core.logger import get_logger

log = get_logger(__name__)

# ── CWE mapping tables ───────────────────────────────────────────────────────

CPPCHECK_ID_TO_CWE: dict[str, str] = {
    "bufferAccessOutOfBounds": "CWE-121",
    "bufferOverrun": "CWE-121",
    "outOfBounds": "CWE-121",
    "arrayIndexOutOfBounds": "CWE-121",
    "stackBufferOverflow": "CWE-121",
    "heapBufferOverflow": "CWE-122",
    "nullPointer": "CWE-476",
    "nullPointerRedundantCheck": "CWE-476",
    "uninitPointer": "CWE-476",
    "invalidPrintfArgType_s": "CWE-134",
    "invalidPrintfArgType": "CWE-134",
    "wrongPrintfScanfArgNum": "CWE-134",
    "doubleFree": "CWE-415",
    "memleak": "CWE-401",
    "resourceLeak": "CWE-401",
    "integerOverflow": "CWE-190",
    "signedIntegerOverflow": "CWE-190",
    "unsignedIntegerOverflow": "CWE-190",
    "danglingPointer": "CWE-416",
    "useAfterFree": "CWE-416",
    "formatString": "CWE-134",
}

SEMGREP_RULE_TO_CWE: dict[str, str] = {
    "strcpy": "CWE-121",
    "strcat": "CWE-121",
    "sprintf": "CWE-134",
    "gets": "CWE-121",
    "scanf": "CWE-121",
    "null-deref": "CWE-476",
    "format-string": "CWE-134",
    "use-after-free": "CWE-416",
    "integer-overflow": "CWE-190",
    "buffer-overflow": "CWE-121",
}

# ── Regex-based pattern scanner (offline fallback) ───────────────────────────

PATTERN_RULES: list[dict] = [
    {
        "pattern": re.compile(r"\bstrcpy\s*\(", re.MULTILINE),
        "cwe_id": "CWE-121",
        "rule_id": "unsafe_strcpy",
        "message": "Unsafe strcpy() usage — no bounds checking. Use strncpy() or strlcpy().",
        "severity": "Critical",
    },
    {
        "pattern": re.compile(r"\bstrcat\s*\(", re.MULTILINE),
        "cwe_id": "CWE-121",
        "rule_id": "unsafe_strcat",
        "message": "Unsafe strcat() usage — may overflow destination buffer. Use strncat().",
        "severity": "High",
    },
    {
        "pattern": re.compile(r"\bsprintf\s*\(", re.MULTILINE),
        "cwe_id": "CWE-134",
        "rule_id": "unsafe_sprintf",
        "message": "Unsafe sprintf() usage — no bounds checking. Use snprintf().",
        "severity": "High",
    },
    {
        "pattern": re.compile(r"\bgets\s*\(", re.MULTILINE),
        "cwe_id": "CWE-121",
        "rule_id": "unsafe_gets",
        "message": "Unsafe gets() usage — reads unbounded input. Use fgets().",
        "severity": "Critical",
    },
    {
        "pattern": re.compile(
            r'\bprintf\s*\(\s*(?!\"[^"]*\"|\'[^\']*\')([a-zA-Z_][a-zA-Z0-9_]*)\s*\)',
            re.MULTILINE,
        ),
        "cwe_id": "CWE-134",
        "rule_id": "format_string_vuln",
        "message": "Potential format string vulnerability — user-controlled variable passed as printf format.",
        "severity": "High",
    },
    {
        "pattern": re.compile(r"=\s*malloc\s*\([^;]+\)\s*;(?!\s*\n\s*if)", re.MULTILINE),
        "cwe_id": "CWE-476",
        "rule_id": "unchecked_malloc",
        "message": "malloc() return value not verified — may dereference NULL on allocation failure.",
        "severity": "High",
    },
    {
        "pattern": re.compile(r"\bfree\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*;(?!\s*\n\s*\1\s*=\s*NULL)", re.MULTILINE),
        "cwe_id": "CWE-416",
        "rule_id": "use_after_free",
        "message": "Pointer not nullified after free() — dangling pointer may be dereferenced.",
        "severity": "Critical",
    },
]


def _run_cppcheck(file_path: str) -> list[dict]:
    """Run cppcheck with XML output and parse findings."""
    findings: list[dict] = []
    try:
        result = subprocess.run(
            [
                "cppcheck",
                "--enable=all",
                "--xml",
                "--xml-version=2",
                "--suppress=missingIncludeSystem",
                file_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        # cppcheck writes XML to stderr
        xml_output = result.stderr
        if not xml_output.strip():
            return []

        root = ET.fromstring(xml_output)
        for error in root.findall(".//error"):
            error_id = error.get("id", "")
            severity = error.get("severity", "style")
            msg = error.get("msg", "")
            cwe = CPPCHECK_ID_TO_CWE.get(error_id, "")

            # Find location
            location = error.find("location")
            if location is None:
                continue
            line = int(location.get("line", "0"))
            if line == 0:
                continue

            if cwe:  # Only report findings we can map to a CWE
                findings.append({
                    "tool": "cppcheck",
                    "file": file_path,
                    "line": line,
                    "cwe_id": cwe,
                    "rule_id": error_id,
                    "message": msg,
                    "severity": severity,
                })
        log.info("cppcheck found findings", count=len(findings))
    except FileNotFoundError:
        log.debug("cppcheck not installed, skipping")
    except subprocess.TimeoutExpired:
        log.warning("cppcheck timed out", file=file_path)
    except ET.ParseError as exc:
        log.debug("cppcheck XML parse error", error=str(exc))
    return findings


def _run_semgrep(file_path: str) -> list[dict]:
    """Run semgrep with C/C++ rules and parse JSON output."""
    findings: list[dict] = []
    try:
        result = subprocess.run(
            [
                "semgrep",
                "--config=auto",
                "--json",
                "--quiet",
                file_path,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode not in (0, 1):  # 1 = findings found
            return []

        import json
        data = json.loads(result.stdout or "{}")
        for res in data.get("results", []):
            rule_id = res.get("check_id", "")
            line = res.get("start", {}).get("line", 0)
            msg = res.get("extra", {}).get("message", "")

            # Map rule to CWE
            cwe = ""
            rule_lower = rule_id.lower()
            for key, cwe_val in SEMGREP_RULE_TO_CWE.items():
                if key in rule_lower:
                    cwe = cwe_val
                    break

            if cwe and line:
                findings.append({
                    "tool": "semgrep",
                    "file": file_path,
                    "line": line,
                    "cwe_id": cwe,
                    "rule_id": rule_id,
                    "message": msg,
                    "severity": "Medium",
                })
        log.info("semgrep found findings", count=len(findings))
    except FileNotFoundError:
        log.debug("semgrep not installed, skipping")
    except subprocess.TimeoutExpired:
        log.warning("semgrep timed out", file=file_path)
    except Exception as exc:
        log.debug("semgrep error", error=str(exc))
    return findings


def _run_pattern_scan(file_path: str) -> list[dict]:
    """Regex-based fallback scanner that works without any external tools."""
    findings: list[dict] = []
    try:
        content = Path(file_path).read_text(encoding="utf-8", errors="replace")
        lines = content.splitlines()

        for rule in PATTERN_RULES:
            for match in rule["pattern"].finditer(content):
                # Calculate 1-indexed line number
                line_no = content[: match.start()].count("\n") + 1
                # Get the actual source line
                code_line = lines[line_no - 1].strip() if line_no <= len(lines) else ""
                findings.append({
                    "tool": "pattern_scan",
                    "file": file_path,
                    "line": line_no,
                    "cwe_id": rule["cwe_id"],
                    "rule_id": rule["rule_id"],
                    "message": rule["message"],
                    "severity": rule["severity"],
                    "code_line": code_line,
                })
        log.info("Pattern scan found findings", count=len(findings))
    except Exception as exc:
        log.error("Pattern scan failed", file=file_path, error=str(exc))
    return findings


def _deduplicate(findings: list[dict]) -> list[dict]:
    """Remove duplicate findings at the same (line, cwe_id)."""
    seen: set[tuple] = set()
    unique: list[dict] = []
    for f in findings:
        key = (f["line"], f["cwe_id"])
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


async def analyze(file_path: str) -> list[dict]:
    """
    Run all available analysis tools on file_path and return merged,
    deduplicated findings ordered by line number.
    """
    log.info("Starting static analysis", file_path=file_path)

    all_findings: list[dict] = []

    # Try cppcheck first
    all_findings.extend(_run_cppcheck(file_path))

    # Try semgrep
    all_findings.extend(_run_semgrep(file_path))

    # Always run pattern scan as supplemental / fallback
    pattern_findings = _run_pattern_scan(file_path)

    # Only add pattern findings not already covered by tools
    covered_lines = {(f["line"], f["cwe_id"]) for f in all_findings}
    for pf in pattern_findings:
        if (pf["line"], pf["cwe_id"]) not in covered_lines:
            all_findings.append(pf)

    deduped = _deduplicate(all_findings)
    deduped.sort(key=lambda f: f["line"])

    log.info(
        "Static analysis complete",
        file=file_path,
        total_findings=len(deduped),
    )
    return deduped
