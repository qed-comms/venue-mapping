"""Client model for storing client profiles and preferences."""
from uuid import UUID, uuid4
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .project import Project

class Client(Base, TimestampMixin):
    """Client entity with branding and AI preferences."""
    
    __tablename__ = "clients"
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(255))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    # AI & Branding Context
    brand_tone: Mapped[Optional[str]] = mapped_column(String(500))  # e.g., "Professional, Luxury"
    description_preferences: Mapped[Optional[str]] = mapped_column(Text)  # Detailed AI instructions
    
    # Default requirements for new projects (JSON)
    # e.g. {"default_attendees": 100, "dietary": "gluten-free"}
    standard_requirements: Mapped[Optional[dict]] = mapped_column(
        postgresql.JSONB,
        default=dict
    )
    
    # Internal Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationships
    projects: Mapped[List["Project"]] = relationship(
        "Project", 
        back_populates="client",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Client {self.name}>"
