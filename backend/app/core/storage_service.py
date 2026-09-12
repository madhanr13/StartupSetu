"""
Storage Service — Local file storage for proposal PDF uploads with SHA-256 checksums.
"""

import hashlib
import os
import uuid
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException, UploadFile, status

# Directory where uploaded files are kept securely outside web root
UPLOAD_DIR = Path("uploads/proposals")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB Limit


class StorageService:
    """Service to handle local secure document uploads, checksums, and retrievals."""

    @staticmethod
    async def save_proposal_document(file: UploadFile, proposal_id: str) -> Tuple[str, str, int, str]:
        """
        Validates, computes SHA256 checksum, saves PDF to disk, and returns storage details.
        Returns: (file_name, storage_key, file_size, checksum)
        """
        filename = file.filename or "proposal.pdf"
        
        # Validation 1: Extension check
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF documents (.pdf) are permitted for proposal submissions.",
            )

        # Generate unique storage filename to avoid collisions
        file_ext = Path(filename).suffix
        storage_filename = f"prop_{proposal_id}_{uuid.uuid4().hex[:8]}{file_ext}"
        target_path = UPLOAD_DIR / storage_filename

        # Read content, compute hash & check size
        sha256 = hashlib.sha256()
        file_size = 0
        content = await file.read()
        file_size = len(content)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB.",
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        sha256.update(content)
        checksum = sha256.hexdigest()

        # Write to disk
        with open(target_path, "wb") as f:
            f.write(content)

        # Reset read pointer
        await file.seek(0)

        return filename, str(target_path.as_posix()), file_size, checksum

    @staticmethod
    def get_document_path(storage_key: str) -> Path:
        """Returns the Path object for a stored document after verifying existence and preventing path traversal."""
        path = Path(storage_key).resolve()
        upload_dir_resolved = UPLOAD_DIR.resolve()
        
        # Guard against directory traversal
        if not (path == upload_dir_resolved or upload_dir_resolved in path.parents):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: invalid or unauthorized file path.",
            )

        if not path.exists() or not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found on storage server.",
            )
        return path
