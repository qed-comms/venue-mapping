"""Photo model."""
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .venue import Venue


class Photo(Base, TimestampMixin):
    """Image associated with a venue."""
    
    __tablename__ = "photos"
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    venue_id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="photos")
    
    def __repr__(self) -> str:
        return f"<Photo {self.id} for venue {self.venue_id}>"
