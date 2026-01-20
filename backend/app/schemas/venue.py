"""Venue schemas for request/response validation."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.photo import PhotoResponse


class VenueBase(BaseModel):
    """Shared venue fields."""
    name: str = Field(..., min_length=1, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(..., gt=0, description="Maximum number of attendees")
    facilities: List[str] = Field(default_factory=list)
    event_types: List[str] = Field(default_factory=list)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = None
    description_template: Optional[str] = None
    notes: Optional[str] = None


class VenueCreate(VenueBase):
    """Fields required to create a venue."""
    pass


class VenueUpdate(BaseModel):
    """Fields that can be updated (all optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    capacity: Optional[int] = Field(None, gt=0)
    facilities: Optional[List[str]] = None
    event_types: Optional[List[str]] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = None
    description_template: Optional[str] = None
    notes: Optional[str] = None


class VenueResponse(VenueBase):
    """Venue response schema with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    photos: List[PhotoResponse] = []


class VenueListResponse(BaseModel):
    """Paginated list of venues."""
    items: List[VenueResponse]
    total: int
    page: int
    page_size: int


class VenueFilters(BaseModel):
    """Query parameters for filtering venues."""
    city: Optional[str] = None
    min_capacity: Optional[int] = Field(None, gt=0)
    facilities: Optional[List[str]] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class VenueCSVRow(BaseModel):
    """Schema for a single row in CSV upload."""
    name: str = Field(..., min_length=1, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(..., gt=0)
    facilities: str = Field(default="", description="Comma-separated list")
    event_types: str = Field(default="", description="Comma-separated list")
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = Field(None, max_length=50)
    website: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = None
    description_template: Optional[str] = None
    notes: Optional[str] = None
    
    def to_venue_create(self) -> VenueCreate:
        """Convert CSV row to VenueCreate schema."""
        # Parse comma-separated strings into lists
        facilities_list = [f.strip() for f in self.facilities.split(",") if f.strip()]
        event_types_list = [e.strip() for e in self.event_types.split(",") if e.strip()]
        
        return VenueCreate(
            name=self.name,
            city=self.city,
            capacity=self.capacity,
            facilities=facilities_list,
            event_types=event_types_list,
            contact_email=self.contact_email,
            contact_phone=self.contact_phone,
            website=self.website,
            address=self.address,
            description_template=self.description_template,
            notes=self.notes,
        )


class VenueUploadError(BaseModel):
    """Error details for a failed venue upload."""
    row: int
    field: Optional[str] = None
    message: str
    data: Optional[dict] = None


class VenueUploadResult(BaseModel):
    """Result of CSV venue upload."""
    total_rows: int
    successful: int
    failed: int
    created_venues: List[VenueResponse] = []
    errors: List[VenueUploadError] = []
