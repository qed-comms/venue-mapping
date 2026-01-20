"""Venue model."""
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .photo import Photo
    from .project_venue import ProjectVenue


class Venue(Base, TimestampMixin):
    """Physical location that can host events."""
    
    __tablename__ = "venues"
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    facilities: Mapped[List[str]] = mapped_column(
        postgresql.ARRAY(String),
        nullable=False,
        default=list
    )
    event_types: Mapped[List[str]] = mapped_column(
        postgresql.ARRAY(String),
        nullable=False,
        default=list
    )
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    address: Mapped[Optional[str]] = mapped_column(Text)
    description_template: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    
    # Relationships
    photos: Mapped[List["Photo"]] = relationship(
        "Photo",
        back_populates="venue",
        cascade="all, delete-orphan",
        order_by="Photo.display_order"
    )
    project_venues: Mapped[List["ProjectVenue"]] = relationship(
        "ProjectVenue",
        back_populates="venue"
    )
    
    def __repr__(self) -> str:
        return f"<Venue {self.name} ({self.city})>"
