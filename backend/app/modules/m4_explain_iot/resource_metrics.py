"""
modules/m4_explain_iot/resource_metrics.py — IoT Resource Metrics
==================================================================
Responsibility:
    Measure and report the resource impact of each patch on the IoT firmware
    binary: binary size change, estimated stack usage delta, and cyclomatic
    complexity change.  Crucial for constrained IoT devices.

Inputs:
    original_file: str  — path to the original .c file
    patched_file: str   — path to the patched .c file
    compiler: str       — "gcc" or "clang"

Outputs:
    IoTMetrics  — from app.schemas.report

TODO:
    - Implement measure(original_file, patched_file) that:
        1. Compiles both files without ASan flags (size measurement)
        2. Reads binary sizes from the resulting .o files
        3. Runs `size` command to get text/data/bss segments
        4. Runs lizard or gcc's -fstack-usage flag for stack estimates
    - Compute cyclomatic_complexity_delta using lizard or radon on the C files.
"""

from __future__ import annotations

from app.core.logger import get_logger
from app.schemas.report import IoTMetrics

log = get_logger(__name__)


async def measure(original_file: str, patched_file: str) -> IoTMetrics:
    """
    TODO: Compile both files, measure sizes, return IoTMetrics.
    """
    log.info("resource_metrics.measure stub called")
    return IoTMetrics()
