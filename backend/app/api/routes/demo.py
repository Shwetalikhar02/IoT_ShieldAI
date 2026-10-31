"""
api/routes/demo.py — Demo Sample API
======================================
Responsibility:
    Provide pre-loaded vulnerable C firmware samples for offline/demo use.
    Eliminates the need to upload files manually during demonstrations.

Endpoints:
    GET  /api/demo/samples         — List all 5 demo samples
    POST /api/demo/load/{sample_id} — Load a sample into a new upload session
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/demo", tags=["Demo"])

# Path to demo firmware directory — resolve relative to project root
# __file__ is backend/app/api/routes/demo.py → go up 4 levels to project root
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
DEMO_DIR = _PROJECT_ROOT / "datasets" / "demo_firmware"

# Canonical sample definitions (embedded so the endpoint always works)
DEMO_SAMPLES = [
    {
        "id": "stack_overflow",
        "filename": "stack_overflow.c",
        "cwe_id": "CWE-121",
        "vuln_type": "Stack Buffer Overflow",
        "severity": "Critical",
        "description": "strcpy() into a fixed 32-byte stack buffer without bounds checking.",
        "line": 29,
    },
    {
        "id": "null_ptr_deref",
        "filename": "null_ptr_deref.c",
        "cwe_id": "CWE-476",
        "vuln_type": "NULL Pointer Dereference",
        "severity": "High",
        "description": "malloc() return value not checked before dereferencing under OOM.",
        "line": 20,
    },
    {
        "id": "format_string",
        "filename": "format_string.c",
        "cwe_id": "CWE-134",
        "vuln_type": "Uncontrolled Format String",
        "severity": "High",
        "description": "User input passed directly as printf format argument.",
        "line": 22,
    },
    {
        "id": "use_after_free",
        "filename": "use_after_free.c",
        "cwe_id": "CWE-416",
        "vuln_type": "Use After Free",
        "severity": "Critical",
        "description": "Heap pointer used after free() without nullification.",
        "line": 28,
    },
    {
        "id": "integer_overflow",
        "filename": "integer_overflow.c",
        "cwe_id": "CWE-190",
        "vuln_type": "Integer Overflow",
        "severity": "High",
        "description": "Integer multiplication overflow before malloc allocation.",
        "line": 18,
    },
]


class DemoSample(BaseModel):
    id: str
    filename: str
    cwe_id: str
    vuln_type: str
    severity: str
    description: str
    line: int


class DemoLoadResponse(BaseModel):
    upload_id: str
    sample_id: str
    filename: str
    file_path: str
    expected: dict


@router.get("/samples", response_model=list[DemoSample], summary="List demo firmware samples")
async def list_demo_samples() -> list[DemoSample]:
    """Return the 5 pre-loaded vulnerable firmware samples available for demo."""
    return [DemoSample(**s) for s in DEMO_SAMPLES]


@router.post("/load/{sample_id}", response_model=DemoLoadResponse, summary="Load a demo sample into a session")
async def load_demo_sample(sample_id: str) -> DemoLoadResponse:
    """
    Copy a demo firmware file into a fresh upload session directory.
    Returns an upload_id ready for POST /api/analyze/{upload_id}.
    """
    sample = next((s for s in DEMO_SAMPLES if s["id"] == sample_id), None)
    if not sample:
        raise HTTPException(
            status_code=404,
            detail=f"Demo sample '{sample_id}' not found. Available: {[s['id'] for s in DEMO_SAMPLES]}",
        )

    src_file = DEMO_DIR / sample["filename"]
    if not src_file.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Demo firmware file '{src_file}' missing from repository.",
        )

    # Create a fresh upload session
    upload_id = str(uuid4())
    dest_dir = Path(settings.upload_dir) / upload_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_file = dest_dir / sample["filename"]
    shutil.copy2(src_file, dest_file)

    # Load expected.json if present
    expected_path = DEMO_DIR / f"{sample_id}_expected.json"
    expected: dict = {}
    if expected_path.exists():
        with open(expected_path, "r", encoding="utf-8") as f:
            expected = json.load(f)

    log.info("Demo sample loaded", sample_id=sample_id, upload_id=upload_id)
    return DemoLoadResponse(
        upload_id=upload_id,
        sample_id=sample_id,
        filename=sample["filename"],
        file_path=str(dest_file),
        expected=expected,
    )
