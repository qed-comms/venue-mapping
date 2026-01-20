"""Photo schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PhotoBase(BaseModel):
    """Shared photo fields."""
    caption: Optional[str] = None
    display_order: int = Field(0, ge=0, description="Order for displaying photos (0 = primary)")


class PhotoCreate(PhotoBase):
    """Fields for creating a photo."""
    url: str = Field(..., max_length=1000)
    venue_id: UUID


class PhotoResponse(PhotoBase):
    """Photo response schema with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    venue_id: UUID
    url: str
    created_at: datetime
    updated_at: datetime
