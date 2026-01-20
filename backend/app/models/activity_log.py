"""Activity log model."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .project import Project
    from .user import User


class ActivityLog(Base):
    """Audit trail entry recording actions taken on a project."""
    
    __tablename__ = "activity_logs"
    
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
    user_id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    details: Mapped[Dict[str, Any]] = mapped_column(
        postgresql.JSONB,
        nullable=False,
        default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="activity_logs")
    user: Mapped["User"] = relationship("User", back_populates="activity_logs")
    
    def __repr__(self) -> str:
        return f"<ActivityLog {self.action} by user {self.user_id}>"
