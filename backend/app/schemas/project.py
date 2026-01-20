"""Project schemas for request/response validation."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectStatus
from app.schemas.project_venue import ProjectVenueDetailResponse


class ProjectBase(BaseModel):
    """Shared project fields."""
    client_id: Optional[UUID] = None
    client_name: str = Field(..., min_length=1, max_length=255)
    event_name: str = Field(..., min_length=1, max_length=500)
    event_date_start: date
    event_date_end: date
    attendee_count: int = Field(..., gt=0, description="Number of attendees")
    budget: Optional[float] = Field(None, gt=0, description="Budget in EUR")
    location_preference: Optional[str] = Field(None, max_length=255)
    requirements: List[str] = Field(default_factory=list, description="Event requirements")
    notes: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Fields required to create a project."""
    pass


class ProjectUpdate(BaseModel):
    """Fields that can be updated (all optional)."""
    client_id: Optional[UUID] = None
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    event_name: Optional[str] = Field(None, min_length=1, max_length=500)
    event_date_start: Optional[date] = None
    event_date_end: Optional[date] = None
    attendee_count: Optional[int] = Field(None, gt=0)
    budget: Optional[float] = Field(None, gt=0)
    location_preference: Optional[str] = Field(None, max_length=255)
    requirements: Optional[List[str]] = None
    status: Optional[ProjectStatus] = None
    notes: Optional[str] = None


class ProjectResponse(ProjectBase):
    """Project response schema with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    project_venues: List[ProjectVenueDetailResponse] = []


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""
    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int


class ProjectFilters(BaseModel):
    """Query parameters for filtering projects."""
    status: Optional[ProjectStatus] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
