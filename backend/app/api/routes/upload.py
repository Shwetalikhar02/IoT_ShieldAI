"""
api/routes/upload.py — File Upload Route
=========================================
Responsibility:
    Accept a multipart/form-data request containing one or more C/C++ firmware
    source files.  Validate extension and file size, save to a temporary
    working directory, and return a session/upload ID for downstream use.

Inputs:
    POST /api/upload
        - files: List[UploadFile]  — one or more .c/.cpp/.h/.hpp files
        - (optional) project_name: str

Outputs:
    JSON { upload_id: UUID, files: [{ filename, size_bytes, saved_path }] }

TODO:
    - Implement file validation (extension check, size check via settings).
    - Save files to a temp directory keyed by upload_id.
    - Return upload_id that subsequent /analyze calls will reference.
    - Add virus / magic-byte sanity check (not just extension).
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", summary="Upload firmware source files for analysis")
async def upload_firmware():
    """
    TODO: Accept multipart/form-data firmware files, validate, save, return upload_id.
    """
    return {"status": "stub", "message": "upload endpoint not yet implemented"}
