"""Photo service for file upload and database operations."""
import os
import shutil
from pathlib import Path
from typing import Optional
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.photo import Photo


class PhotoService:
    """Business logic for Photo entity."""
    
    # Base upload directory
    UPLOAD_DIR = Path("uploads/photos")
    
    def __init__(self):
        """Initialize photo service and ensure upload directory exists."""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    async def save_photo(
        self,
        file: UploadFile,
        venue_id: UUID
    ) -> str:
        """Save uploaded photo file to local storage.
        
        Args:
            file: Uploaded file
            venue_id: Venue UUID for organizing files
            
        Returns:
            Relative URL path to the saved file
        """
        # Create venue-specific directory
        venue_dir = self.UPLOAD_DIR / str(venue_id)
        venue_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = Path(file.filename or "photo.jpg").suffix
        unique_filename = f"{uuid4()}{file_extension}"
        file_path = venue_dir / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return relative URL path
        return f"/uploads/photos/{venue_id}/{unique_filename}"
    
    async def add_photo_to_venue(
        self,
        db: AsyncSession,
        venue_id: UUID,
        url: str,
        caption: Optional[str] = None,
        display_order: int = 0
    ) -> Photo:
        """Create a photo record in the database.
        
        Args:
            db: Database session
            venue_id: Venue UUID
            url: Photo URL
            caption: Optional caption
            display_order: Display order (0 = primary)
            
        Returns:
            Created photo object
        """
        photo = Photo(
            venue_id=venue_id,
            url=url,
            caption=caption,
            display_order=display_order
        )
        db.add(photo)
        await db.commit()
        await db.refresh(photo)
        return photo
    
    async def get_by_id(
        self,
        db: AsyncSession,
        photo_id: UUID
    ) -> Optional[Photo]:
        """Get a photo by ID.
        
        Args:
            db: Database session
            photo_id: Photo UUID
            
        Returns:
            Photo if found, None otherwise
        """
        result = await db.execute(
            select(Photo).where(Photo.id == photo_id)
        )
        return result.scalar_one_or_none()
    
    async def delete_photo(
        self,
        db: AsyncSession,
        photo: Photo
    ) -> None:
        """Delete a photo file and database record.
        
        Args:
            db: Database session
            photo: Photo object to delete
        """
        # Delete file from filesystem
        if photo.url.startswith("/uploads/"):
            file_path = Path(photo.url.lstrip("/"))
            if file_path.exists():
                file_path.unlink()
        
        # Delete database record
        await db.delete(photo)
        await db.commit()


# Singleton instance
photo_service = PhotoService()
