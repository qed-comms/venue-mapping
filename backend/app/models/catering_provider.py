"""Catering provider model."""
from typing import TYPE_CHECKING, Any, Dict, List
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .project_venue import ProjectVenue


class CateringProvider(Base, TimestampMixin):
    """External catering company that can be linked to venue proposals."""
    
    __tablename__ = "catering_providers"
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    price_per_person: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )
    menu_options: Mapped[Dict[str, Any]] = mapped_column(
        postgresql.JSONB,
        nullable=False,
        default=dict
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    # Relationships
    project_venues: Mapped[List["ProjectVenue"]] = relationship(
        "ProjectVenue",
        back_populates="catering_provider"
    )
    
    def __repr__(self) -> str:
        return f"<CateringProvider {self.name}>"
