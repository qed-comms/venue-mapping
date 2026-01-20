"""Project model."""
import enum
from datetime import date
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user import User
    from .client import Client
    from .project_venue import ProjectVenue
    from .activity_log import ActivityLog


class ProjectStatus(str, enum.Enum):
    """Project status enumeration."""
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class Project(Base, TimestampMixin):
    """Event sourcing effort for a specific client event."""
    
    __tablename__ = "projects"
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    client_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String(500), nullable=False)
    event_date_start: Mapped[date] = mapped_column(Date, nullable=False)
    event_date_end: Mapped[date] = mapped_column(Date, nullable=False)
    attendee_count: Mapped[int] = mapped_column(Integer, nullable=False)
    budget: Mapped[Optional[float]] = mapped_column(Numeric(12, 2))
    location_preference: Mapped[Optional[str]] = mapped_column(String(255))
    requirements: Mapped[List[str]] = mapped_column(
        postgresql.ARRAY(String),
        nullable=False,
        default=list
    )
    status: Mapped[ProjectStatus] = mapped_column(
        postgresql.ENUM(ProjectStatus, name="project_status", create_type=False),
        nullable=False,
        default=ProjectStatus.active,
        index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Client Relationship (New in Phase 2)
    client_id: Mapped[Optional[UUID]] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="projects")
    client: Mapped[Optional["Client"]] = relationship("Client", back_populates="projects")
    project_venues: Mapped[List["ProjectVenue"]] = relationship(
        "ProjectVenue",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    activity_logs: Mapped[List["ActivityLog"]] = relationship(
        "ActivityLog",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Project {self.event_name} for {self.client_name}>"
