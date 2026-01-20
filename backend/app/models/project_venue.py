"""ProjectVenue junction model."""
import enum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .project import Project
    from .venue import Venue
    from .catering_provider import CateringProvider


class OutreachStatus(str, enum.Enum):
    """Outreach status enumeration."""
    draft = "draft"
    sent = "sent"
    awaiting = "awaiting"
    responded = "responded"
    declined = "declined"


class ProjectVenue(Base, TimestampMixin):
    """Junction connecting a venue to a project, tracking outreach and response."""
    
    __tablename__ = "project_venues"
    __table_args__ = (
        UniqueConstraint("project_id", "venue_id", name="uq_project_venue"),
    )
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    project_id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    venue_id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    catering_provider_id: Mapped[Optional[UUID]] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("catering_providers.id", ondelete="SET NULL"),
        index=True
    )
    
    # Outreach tracking
    outreach_status: Mapped[OutreachStatus] = mapped_column(
        postgresql.ENUM(OutreachStatus, name="outreach_status", create_type=False),
        nullable=False,
        default=OutreachStatus.draft,
        index=True
    )
    
    # Response data
    availability_dates: Mapped[Optional[str]] = mapped_column(String(255))
    is_available: Mapped[Optional[bool]] = mapped_column(Boolean)
    quoted_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2))
    room_allocation: Mapped[Optional[str]] = mapped_column(Text)
    catering_description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Content
    pros: Mapped[Optional[str]] = mapped_column(Text)
    cons: Mapped[Optional[str]] = mapped_column(Text)
    ai_description: Mapped[Optional[str]] = mapped_column(Text)
    final_description: Mapped[Optional[str]] = mapped_column(Text)
    
    # PDF inclusion
    include_in_proposal: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    # AI Context for description generation
    ai_context: Mapped[Optional[dict]] = mapped_column(
        postgresql.JSONB,
        nullable=True
    )
    
    # Internal notes
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="project_venues"
    )
    venue: Mapped["Venue"] = relationship(
        "Venue",
        back_populates="project_venues"
    )
    catering_provider: Mapped[Optional["CateringProvider"]] = relationship(
        "CateringProvider",
        back_populates="project_venues"
    )
    
    def __repr__(self) -> str:
        return f"<ProjectVenue project={self.project_id} venue={self.venue_id}>"
