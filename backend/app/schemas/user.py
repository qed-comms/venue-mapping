"""User schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    """Shared user fields."""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr


class UserCreate(UserBase):
    """Fields required to create a user."""
    password: str = Field(..., min_length=8, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    signature_block: Optional[str] = None
    role: UserRole = UserRole.event_manager


class UserLogin(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Fields that can be updated (all optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    signature_block: Optional[str] = None


class UserResponse(UserBase):
    """User response schema with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    phone: Optional[str]
    signature_block: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
