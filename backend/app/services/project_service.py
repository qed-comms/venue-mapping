"""Project service for database operations."""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project, ProjectStatus
from app.models.project_venue import ProjectVenue
from app.models.venue import Venue
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    """Business logic for Project entity."""
    
    async def get_by_id(
        self,
        db: AsyncSession,
        project_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[Project]:
        """Get a project by ID with venues.
        
        Args:
            db: Database session
            project_id: Project UUID
            user_id: Optional user ID to check ownership
            
        Returns:
            Project if found, None otherwise
        """
        options = [
            selectinload(Project.project_venues)
            .selectinload(ProjectVenue.venue)
            .selectinload(Venue.photos)
        ]
        
        # Use execute/scalar for consistent async behavior
        result = await db.execute(select(Project).filter(Project.id == project_id).options(*options))
        project = result.scalars().first()
        
        if project and user_id and project.user_id != user_id:
            return None
            
        return project
    
    async def get_by_id_with_venues(
        self,
        db: AsyncSession,
        project_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[Project]:
        """Get a project by ID with all venues and photos eagerly loaded.
        
        This is specifically for proposal generation where we need all data.
        
        Args:
            db: Database session
            project_id: Project UUID
            user_id: Optional user ID to check ownership
            
        Returns:
            Project if found with all venues loaded, None otherwise
        """
        # Same as get_by_id but explicitly for proposal use
        return await self.get_by_id(db, project_id, user_id)
    
    async def get_list(
        self,
        db: AsyncSession,
        user_id: UUID,
        *,
        status: Optional[ProjectStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Project], int]:
        """Get paginated list of user's projects with filtering.
        
        Args:
            db: Database session
            user_id: User UUID (only return this user's projects)
            status: Filter by project status
            page: Page number (1-indexed)
            page_size: Number of items per page
            
        Returns:
            Tuple of (projects list, total count)
        """
        # Build base query (user's projects only)
        query = select(Project).where(Project.user_id == user_id)
        
        # Apply filters
        if status:
            query = query.where(Project.status == status)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query) or 0
        
        # Apply pagination and ordering
        query = query.order_by(Project.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # Load project_venues, venues and photos eagerly
        query = query.options(
            selectinload(Project.project_venues)
            .selectinload(ProjectVenue.venue)
            .selectinload(Venue.photos)
        )
        
        result = await db.execute(query)
        projects = list(result.scalars().all())
        
        return projects, total
    
    async def create(
        self,
        db: AsyncSession,
        project_data: ProjectCreate,
        user_id: UUID
    ) -> Project:
        """Create a new project for a user."""
        project = Project(**project_data.model_dump(), user_id=user_id)
        db.add(project)
        await db.commit()
        
        # Refresh with eagle loading to avoid MissingGreenlet
        # Instead of db.refresh which doesn't support options well in all async cases,
        # we just re-fetch the object using our robust get_by_id method
        return await self.get_by_id(db, project.id)
    
    async def update(
        self,
        db: AsyncSession,
        project: Project,
        project_data: ProjectUpdate
    ) -> Project:
        """Update an existing project.
        
        Args:
            db: Database session
            project: Project object to update
            project_data: Update data
            
        Returns:
            Updated project object
        """
        update_dict = project_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(project, field, value)
        
        await db.commit()
        return await self.get_by_id(db, project.id)
    
    async def delete(
        self,
        db: AsyncSession,
        project: Project
    ) -> None:
        """Delete a project.
        
        Args:
            db: Database session
            project: Project to delete
            
        Note:
            Cascades to project_venues via database constraint
        """
        await db.delete(project)
        await db.commit()


# Singleton instance
project_service = ProjectService()
