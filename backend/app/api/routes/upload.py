"""
api/routes/upload.py — File Upload Route
=========================================
Responsibility:
    Accept multipart/form-data with one or more C/C++ firmware source files
    or a .zip archive. Validate extensions, size limits, and path traversal.
    Save files to a session upload directory and return an upload_id.

Endpoints:
    POST /api/upload
"""

from __future__ import annotations

import os
import shutil
import zipfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.core.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_EXTENSIONS = set(settings.upload_allowed_ext_list)
MAX_BYTES = settings.upload_max_size_mb * 1024 * 1024


class UploadedFile(BaseModel):
    filename: str
    size_bytes: int
    saved_path: str


class UploadResponse(BaseModel):
    upload_id: str
    file_count: int
    files: list[UploadedFile]


def _validate_extension(filename: str) -> None:
    ext = Path(filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS and ext != "zip":
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' has disallowed extension '.{ext}'. "
                   f"Allowed: {sorted(ALLOWED_EXTENSIONS)} (or .zip)",
        )


def _safe_extract_zip(zip_path: Path, dest: Path) -> list[Path]:
    """Extract zip, rejecting any path-traversal entries."""
    extracted: list[Path] = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.namelist():
            # Path traversal guard
            dest_path = (dest / member).resolve()
            if not str(dest_path).startswith(str(dest.resolve())):
                raise HTTPException(
                    status_code=400,
                    detail=f"Zip entry '{member}' is a path-traversal attempt.",
                )
            ext = Path(member).suffix.lstrip(".").lower()
            if ext in ALLOWED_EXTENSIONS:
                zf.extract(member, dest)
                extracted.append(dest_path)
    return extracted


@router.post("", response_model=UploadResponse, summary="Upload firmware source files")
async def upload_firmware(
    files: list[UploadFile] = File(...),
    project_name: str | None = Form(default=None),
) -> UploadResponse:
    """
    Accept one or more .c/.cpp/.h/.hpp files or a single .zip archive.
    Returns an upload_id for all downstream pipeline calls.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    upload_id = str(uuid4())
    upload_dir = Path(settings.upload_dir) / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    log.info("Upload started", upload_id=upload_id, project=project_name)

    saved_files: list[UploadedFile] = []

    for uf in files:
        fname = uf.filename or "unnamed"
        _validate_extension(fname)

        data = await uf.read()
        if len(data) > MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File '{fname}' exceeds {settings.upload_max_size_mb} MB limit.",
            )
        if len(data) == 0:
            raise HTTPException(status_code=400, detail=f"File '{fname}' is empty.")

        if fname.lower().endswith(".zip"):
            # Save zip then extract
            zip_path = upload_dir / fname
            zip_path.write_bytes(data)
            try:
                extracted = _safe_extract_zip(zip_path, upload_dir)
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Invalid zip file: {exc}") from exc
            zip_path.unlink()  # remove raw zip after extraction
            for ep in extracted:
                saved_files.append(UploadedFile(
                    filename=ep.name,
                    size_bytes=ep.stat().st_size,
                    saved_path=str(ep),
                ))
        else:
            dest = upload_dir / fname
            dest.write_bytes(data)
            saved_files.append(UploadedFile(
                filename=fname,
                size_bytes=len(data),
                saved_path=str(dest),
            ))

    if not saved_files:
        raise HTTPException(status_code=400, detail="No valid C/C++ files found in upload.")

    log.info("Upload complete", upload_id=upload_id, file_count=len(saved_files))
    return UploadResponse(
        upload_id=upload_id,
        file_count=len(saved_files),
        files=saved_files,
    )
