"""User service for database operations."""
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate
from app.services.auth import hash_password


class UserService:
    """Business logic for User entity."""
    
    async def get_by_email(
        self,
        db: AsyncSession,
        email: str
    ) -> Optional[User]:
        """Get a user by email address.
        
        Args:
            db: Database session
            email: User email address
            
        Returns:
            User if found, None otherwise
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> Optional[User]:
        """Get a user by ID.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            User if found, None otherwise
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        user_data: UserCreate
    ) -> User:
        """Create a new user.
        
        Args:
            db: Database session
            user_data: User creation data
            
        Returns:
            Created user object
        """
        # Hash the password
        password_hash = hash_password(user_data.password)
        
        # Create user object (exclude password, add password_hash)
        user_dict = user_data.model_dump(exclude={"password"})
        user = User(**user_dict, password_hash=password_hash)
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


# Singleton instance
user_service = UserService()
