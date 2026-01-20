"""ProjectVenue junction schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.project_venue import OutreachStatus
from app.schemas.venue import VenueResponse


class ProjectVenueBase(BaseModel):
    """Shared project-venue fields."""
    outreach_status: OutreachStatus = OutreachStatus.draft
    availability_dates: Optional[str] = Field(None, max_length=255)
    is_available: Optional[bool] = None
    quoted_price: Optional[float] = Field(None, gt=0, description="Quoted price in EUR")
    room_allocation: Optional[str] = None
    catering_description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    ai_description: Optional[str] = None
    final_description: Optional[str] = None
    include_in_proposal: bool = False
    ai_context: Optional[dict] = None
    notes: Optional[str] = None


class ProjectVenueCreate(BaseModel):
    """Fields required to add a venue to a project."""
    venue_id: UUID


class ProjectVenueUpdate(BaseModel):
    """Fields that can be updated (all optional)."""
    outreach_status: Optional[OutreachStatus] = None
    catering_provider_id: Optional[UUID] = None
    availability_dates: Optional[str] = Field(None, max_length=255)
    is_available: Optional[bool] = None
    quoted_price: Optional[float] = Field(None, gt=0)
    room_allocation: Optional[str] = None
    catering_description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    ai_description: Optional[str] = None
    final_description: Optional[str] = None
    include_in_proposal: Optional[bool] = None
    ai_context: Optional[dict] = None
    notes: Optional[str] = None


class ProjectVenueResponse(ProjectVenueBase):
    """ProjectVenue response schema."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    project_id: UUID
    venue_id: UUID
    catering_provider_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class ProjectVenueDetailResponse(ProjectVenueResponse):
    """ProjectVenue response with full venue details."""
    venue: VenueResponse
