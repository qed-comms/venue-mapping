"""Token schemas for authentication."""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class Token(BaseModel):
    """Access token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded token payload."""
    email: str
    user_id: UUID
