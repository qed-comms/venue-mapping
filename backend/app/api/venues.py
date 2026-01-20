"""Venue API endpoints."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.photo import PhotoResponse
from app.schemas.venue import (
    VenueCreate,
    VenueListResponse,
    VenueResponse,
    VenueUpdate,
    VenueUploadResult,
)
from app.services.photo_service import photo_service
from app.services.venue_service import venue_service

router = APIRouter(prefix="/venues", tags=["venues"])


@router.get("", response_model=VenueListResponse)
async def list_venues(
    city: Optional[str] = Query(None, description="Filter by city (case-insensitive)"),
    min_capacity: Optional[int] = Query(None, gt=0, description="Minimum capacity"),
    facilities: Optional[List[str]] = Query(None, description="Required facilities (must have all)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """List venues with filtering and pagination.
    
    Excludes soft-deleted venues. Supports filtering by city, capacity, and facilities.
    """
    venues, total = await venue_service.get_list(
        db,
        city=city,
        min_capacity=min_capacity,
        facilities=facilities,
        page=page,
        page_size=page_size,
    )
    
    return VenueListResponse(
        items=venues,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
async def create_venue(
    venue_data: VenueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new venue.
    
    Requires authentication. Creates a venue with the provided details.
    """
    venue = await venue_service.create(db, venue_data)
    return venue


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single venue by ID with photos.
    
    Returns 404 if venue not found or soft-deleted.
    """
    venue = await venue_service.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_id} not found"
        )
    return venue


@router.patch("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: UUID,
    venue_data: VenueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a venue.
    
    Requires authentication. Updates only the fields provided.
    """
    venue = await venue_service.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_id} not found"
        )
    
    updated_venue = await venue_service.update(db, venue, venue_data)
    return updated_venue


@router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_venue(
    venue_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Soft delete a venue.
    
    Requires authentication. Marks the venue as deleted but preserves data
    for historical project references.
    """
    venue = await venue_service.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_id} not found"
        )
    
    await venue_service.soft_delete(db, venue)


@router.post("/{venue_id}/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    venue_id: UUID,
    file: UploadFile = File(..., description="Photo file (JPEG, PNG)"),
    caption: Optional[str] = Form(None, description="Photo caption"),
    display_order: int = Form(0, ge=0, description="Display order (0 = primary)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a photo for a venue.
    
    Requires authentication. Accepts multipart/form-data with photo file.
    Photos are stored locally and can be accessed via /uploads/photos/{venue_id}/{filename}
    """
    # Verify venue exists
    venue = await venue_service.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_id} not found"
        )
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG and PNG images are allowed"
        )
    
    # Save file to local storage
    photo_url = await photo_service.save_photo(file, venue_id)
    
    # Create photo record
    photo = await photo_service.add_photo_to_venue(
        db,
        venue_id=venue_id,
        url=photo_url,
        caption=caption,
        display_order=display_order
    )
    
    return photo


@router.delete("/{venue_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    venue_id: UUID,
    photo_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a photo from a venue.
    
    Requires authentication. Removes both the file and database record.
    """
    # Verify venue exists
    venue = await venue_service.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_id} not found"
        )
    
    # Get photo
    photo = await photo_service.get_by_id(db, photo_id)
    if not photo or photo.venue_id != venue_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo with id {photo_id} not found for this venue"
        )
    
    await photo_service.delete_photo(db, photo)


@router.post("/upload-csv", response_model=VenueUploadResult)
async def upload_venues_csv(
    file: UploadFile = File(..., description="CSV file with venue data"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload venues in bulk via CSV file.
    
    Requires authentication. Accepts a CSV file with venue data.
    Returns a summary of successful and failed uploads.
    
    CSV Format:
    - Required headers: name, city, capacity
    - Optional headers: facilities, event_types, contact_email, contact_phone, 
      website, address, description_template, notes
    - Arrays (facilities, event_types) should be comma-separated
    - Max file size: 5MB
    - Max rows: 1000
    
    Example:
    ```csv
    name,city,capacity,facilities,event_types
    "Grand Hotel","Brussels",200,"WiFi,Projector","Conference,Workshop"
    ```
    """
    from app.services.csv_service import csv_service
    from app.schemas.venue import VenueUploadResult
    
    # Validate file type
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file (.csv extension)"
        )
    
    try:
        result = await csv_service.process_venue_csv(db, file)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process CSV file: {str(e)}"
        )


@router.get("/csv-template")
async def download_csv_template():
    """Download a CSV template for bulk venue upload.
    
    Returns a CSV file with:
    - All required and optional headers
    - One example row with sample data
    - Can be used as a reference for formatting
    """
    from fastapi.responses import Response
    from app.services.csv_service import csv_service
    
    template_content = csv_service.generate_template()
    
    return Response(
        content=template_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=venue_upload_template.csv"
        }
    )

