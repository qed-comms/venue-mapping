from typing import Optional, Dict
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, HttpUrl

class ClientBase(BaseModel):
    """Base schema for Client."""
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    brand_tone: Optional[str] = None
    description_preferences: Optional[str] = None
    standard_requirements: Optional[Dict] = {}
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    """Schema for creating a client."""
    pass

class ClientUpdate(ClientBase):
    """Schema for updating a client."""
    name: Optional[str] = None

class Client(ClientBase):
    """Schema for reading a client."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
