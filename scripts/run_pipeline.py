#!/usr/bin/env python3
"""
scripts/run_pipeline.py — CLI Pipeline Runner
==============================================
Responsibility:
    Provide a command-line interface to run the IoT ShieldAI pipeline against
    a single C/C++ firmware file without needing the full web UI.  Useful for
    development, CI, and demo purposes.

Usage:
    python scripts/run_pipeline.py --file datasets/demo_firmware/stack_overflow.c
    python scripts/run_pipeline.py --file datasets/demo_firmware/stack_overflow.c --strategy template

Arguments:
    --file      Path to the C/C++ source file to analyse and repair
    --strategy  Fix strategy hint: "template" | "llm" | "auto" (default: auto)
    --output    Output JSON file for the PipelineResult (default: reports/<hash>.json)
    --verbose   Enable verbose logging

TODO:
    - Import and call pipeline/orchestrator.run_pipeline() once implemented.
    - Write the PipelineResult JSON to --output path.
    - Print a coloured summary table to stdout.
    - Add --cwe filter to only run for specific CWE types.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="IoT ShieldAI — CLI pipeline runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--file",
        required=True,
        type=Path,
        help="Path to the C/C++ firmware source file",
    )
    parser.add_argument(
        "--strategy",
        choices=["template", "llm", "auto"],
        default="auto",
        help="Repair strategy (default: auto — try template first, then LLM)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output JSON path for PipelineResult (default: reports/<filename>.json)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    return parser.parse_args()


async def main() -> int:
    args = parse_args()

    if not args.file.exists():
        print(f"[error] File not found: {args.file}", file=sys.stderr)
        return 1

    print(f"[pipeline] Analysing: {args.file}")
    print(f"[pipeline] Strategy:  {args.strategy}")
    print()

    # TODO: Add sys.path for backend, then call:
    # from app.pipeline.orchestrator import run_pipeline
    # result = await run_pipeline(str(args.file))

    print("[pipeline] Stub: pipeline not yet implemented.")
    print("[pipeline] Run the FastAPI backend and use the /api endpoints instead.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
