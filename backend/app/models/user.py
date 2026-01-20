"""User model."""
import enum
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, String, Text, Enum
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .project import Project
    from .activity_log import ActivityLog


class UserRole(str, enum.Enum):
    """User role enumeration."""
    event_manager = "event_manager"
    admin = "admin"


class User(Base, TimestampMixin):
    """System user who can create and manage projects."""
    
    __tablename__ = "users"
    
    id: Mapped[UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    signature_block: Mapped[Optional[str]] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        postgresql.ENUM(UserRole, name="user_role", create_type=False),
        nullable=False,
        default=UserRole.event_manager
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Relationships
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    activity_logs: Mapped[List["ActivityLog"]] = relationship(
        "ActivityLog",
        back_populates="user"
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
