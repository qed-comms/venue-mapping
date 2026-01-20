"""Venue service for database operations."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueUpdate


class VenueService:
    """Business logic for Venue entity."""
    
    async def get_by_id(
        self,
        db: AsyncSession,
        venue_id: UUID,
        include_deleted: bool = False
    ) -> Optional[Venue]:
        """Get a venue by ID with photos.
        
        Args:
            db: Database session
            venue_id: Venue UUID
            include_deleted: Whether to include soft-deleted venues
            
        Returns:
            Venue if found, None otherwise
        """
        query = select(Venue).options(
            selectinload(Venue.photos)
        ).where(Venue.id == venue_id)
        
        if not include_deleted:
            query = query.where(Venue.is_deleted == False)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_list(
        self,
        db: AsyncSession,
        *,
        city: Optional[str] = None,
        min_capacity: Optional[int] = None,
        facilities: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Venue], int]:
        """Get paginated list of venues with filtering.
        
        Args:
            db: Database session
            city: Filter by city (case-insensitive)
            min_capacity: Minimum capacity filter
            facilities: Filter venues that have ALL specified facilities
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            Tuple of (venues list, total count)
        """
        # Build base query (exclude soft deleted)
        query = select(Venue).where(Venue.is_deleted == False)
        
        # Apply filters
        if city:
            query = query.where(func.lower(Venue.city) == city.lower())
        
        if min_capacity:
            query = query.where(Venue.capacity >= min_capacity)
        
        if facilities:
            # PostgreSQL array contains - venue must have ALL specified facilities
            query = query.where(Venue.facilities.contains(facilities))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0
        
        # Apply pagination and ordering
        query = query.order_by(Venue.name)
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # Load photos eagerly
        query = query.options(selectinload(Venue.photos))
        
        result = await db.execute(query)
        venues = list(result.scalars().all())
        
        return venues, total
    
    async def create(
        self,
        db: AsyncSession,
        venue_data: VenueCreate
    ) -> Venue:
        """Create a new venue.
        
        Args:
            db: Database session
            venue_data: Venue creation data
            
        Returns:
            Created venue object
        """
        venue = Venue(**venue_data.model_dump())
        db.add(venue)
        await db.commit()
        await db.refresh(venue)
        return venue
    
    async def update(
        self,
        db: AsyncSession,
        venue: Venue,
        venue_data: VenueUpdate
    ) -> Venue:
        """Update an existing venue.
        
        Args:
            db: Database session
            venue: Venue object to update
            venue_data: Update data
            
        Returns:
            Updated venue object
        """
        update_dict = venue_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(venue, field, value)
        
        await db.commit()
        await db.refresh(venue)
        return venue
    
    async def soft_delete(
        self,
        db: AsyncSession,
        venue: Venue
    ) -> None:
        """Soft delete a venue.
        
        Args:
            db: Database session
            venue: Venue to delete
        """
        venue.is_deleted = True
        await db.commit()


# Singleton instance
venue_service = VenueService()
