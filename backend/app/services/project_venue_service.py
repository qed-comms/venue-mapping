"""ProjectVenue junction service for database operations."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.project_venue import ProjectVenue
from app.models.venue import Venue
from app.schemas.project_venue import ProjectVenueUpdate


class ProjectVenueService:
    """Business logic for ProjectVenue junction entity."""
    
    async def add_venue_to_project(
        self,
        db: AsyncSession,
        project_id: UUID,
        venue_id: UUID
    ) -> ProjectVenue:
        """Add a venue to a project.
        
        Args:
            db: Database session
            project_id: Project UUID
            venue_id: Venue UUID
            
        Returns:
            Created project_venue object
            
        Raises:
            IntegrityError: If venue already added to project (unique constraint)
        """
        project_venue = ProjectVenue(
            project_id=project_id,
            venue_id=venue_id
        )
        db.add(project_venue)
        await db.commit()
        return await self.get_project_venue(db, project_id, venue_id)
    
    async def get_project_venues(
        self,
        db: AsyncSession,
        project_id: UUID
    ) -> List[ProjectVenue]:
        """Get all venues for a project.
        
        Args:
            db: Database session
            project_id: Project UUID
            
        Returns:
            List of project_venue objects with venue details
        """
        result = await db.execute(
            select(ProjectVenue)
            .options(selectinload(ProjectVenue.venue).selectinload(Venue.photos))
            .where(ProjectVenue.project_id == project_id)
            .order_by(ProjectVenue.created_at)
        )
        return list(result.scalars().all())
    
    async def get_project_venue(
        self,
        db: AsyncSession,
        project_id: UUID,
        venue_id: UUID
    ) -> Optional[ProjectVenue]:
        """Get a specific project-venue link.
        
        Args:
            db: Database session
            project_id: Project UUID
            venue_id: Venue UUID
            
        Returns:
            ProjectVenue if found, None otherwise
        """
        result = await db.execute(
            select(ProjectVenue)
            .options(
                selectinload(ProjectVenue.venue).selectinload(Venue.photos),
                selectinload(ProjectVenue.project).selectinload(Project.client)
            )
            .where(
                ProjectVenue.project_id == project_id,
                ProjectVenue.venue_id == venue_id
            )
        )
        return result.scalar_one_or_none()
    
    async def update_project_venue(
        self,
        db: AsyncSession,
        project_venue: ProjectVenue,
        update_data: ProjectVenueUpdate
    ) -> ProjectVenue:
        """Update a project-venue link.
        
        Args:
            db: Database session
            project_venue: ProjectVenue object to update
            update_data: Update data
            
        Returns:
            Updated project_venue object
        """
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(project_venue, field, value)
        
        await db.commit()
        return await self.get_project_venue(db, project_venue.project_id, project_venue.venue_id)
    
    async def remove_venue_from_project(
        self,
        db: AsyncSession,
        project_venue: ProjectVenue
    ) -> None:
        """Remove a venue from a project.
        
        Args:
            db: Database session
            project_venue: ProjectVenue to delete
        """
        await db.delete(project_venue)
        await db.commit()


# Singleton instance
project_venue_service = ProjectVenueService()
