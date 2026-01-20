"""Project API endpoints."""
from typing import Optional
from uuid import UUID
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.project import ProjectStatus
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.schemas.project_venue import (
    ProjectVenueCreate,
    ProjectVenueDetailResponse,
    ProjectVenueUpdate,
)
from app.services.project_service import project_service
from app.services.project_venue_service import project_venue_service
from app.services.venue_service import venue_service
from app.services.pdf_generator import proposal_generator
from app.services.ai_description_service import ai_description_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    status: Optional[ProjectStatus] = Query(None, description="Filter by project status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List current user's projects with filtering.
    
    Returns only projects owned by the authenticated user.
    """
    projects, total = await project_service.get_list(
        db,
        user_id=current_user.id,
        status=status,
        page=page,
        page_size=page_size,
    )
    
    return ProjectListResponse(
        items=projects,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new project for the current user.
    
    The project is automatically assigned to the authenticated user.
    """
    project = await project_service.create(db, project_data, current_user.id)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single project by ID with venues.
    
    Returns 404 if project not found or not owned by current user.
    """
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a project.
    
    Only the project owner can update it.
    """
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    updated_project = await project_service.update(db, project, project_data)
    return updated_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a project.
    
    Only the project owner can delete it. Cascades to project_venues.
    """
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    await project_service.delete(db, project)


# ProjectVenue endpoints

@router.post("/{project_id}/venues", response_model=ProjectVenueDetailResponse, status_code=status.HTTP_201_CREATED)
async def add_venue_to_project(
    project_id: UUID,
    venue_data: ProjectVenueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a venue to a project.
    
    Creates a project-venue link with default 'draft' outreach status.
    """
    # Verify project exists and user owns it
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    # Verify venue exists
    venue = await venue_service.get_by_id(db, venue_data.venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_data.venue_id} not found"
        )
    
    # Add venue to project
    try:
        project_venue = await project_venue_service.add_venue_to_project(
            db, project_id, venue_data.venue_id
        )
        return project_venue
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Venue already added to this project"
        )


@router.get("/{project_id}/venues", response_model=list[ProjectVenueDetailResponse])
async def list_project_venues(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all venues for a project.
    
    Returns venues with outreach status and response data.
    """
    # Verify project exists and user owns it
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    project_venues = await project_venue_service.get_project_venues(db, project_id)
    return project_venues


@router.patch("/{project_id}/venues/{venue_id}", response_model=ProjectVenueDetailResponse)
async def update_project_venue(
    project_id: UUID,
    venue_id: UUID,
    update_data: ProjectVenueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a project-venue link.
    
    Updates outreach status, response data, or AI-generated content.
    """
    # Verify project exists and user owns it
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    # Get project-venue link
    project_venue = await project_venue_service.get_project_venue(db, project_id, venue_id)
    if not project_venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue not found in this project"
        )
    
    updated_pv = await project_venue_service.update_project_venue(db, project_venue, update_data)
    return updated_pv


@router.delete("/{project_id}/venues/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_venue_from_project(
    project_id: UUID,
    venue_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a venue from a project.
    
    Deletes the project-venue link.
    """
    # Verify project exists and user owns it
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    # Get project-venue link
    project_venue = await project_venue_service.get_project_venue(db, project_id, venue_id)
    if not project_venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue not found in this project"
        )
    
    await project_venue_service.remove_venue_from_project(db, project_venue)


# AI Description Generation endpoint

@router.post("/{project_id}/venues/{venue_id}/generate-description")
async def generate_venue_description(
    project_id: UUID,
    venue_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate AI description for a venue in a project.
    
    Uses the ai_context stored in the project_venue to generate a tailored description.
    """
    # Verify project ownership
    project = await project_service.get_by_id(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get project-venue with relationships
    project_venue = await project_venue_service.get_project_venue(db, project_id, venue_id)
    if not project_venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not in project"
        )
    
    # Check if context exists
    if not project_venue.ai_context:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No AI context provided. Please add context before generating description."
        )
    
    # Generate description
    try:
        description = await ai_description_service.generate_description(db, project_venue)
        
        return {
            "success": True,
            "ai_description": description,
            "message": "Description generated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}"
        )


# Proposal generation endpoints

@router.get("/{project_id}/proposal/preview", response_class=HTMLResponse)
async def preview_proposal(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate and preview HTML proposal for a project.
    
    Returns HTML that can be viewed in browser before generating PDF.
    """
    # Get project with venues
    project = await project_service.get_by_id_with_venues(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    # Check if there are venues to include
    included_count = sum(1 for pv in project.project_venues if pv.include_in_proposal)
    if included_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No venues marked for inclusion in proposal"
        )
    
    # Generate HTML
    html_content = await proposal_generator.generate_html_proposal(db, project)
    
    return HTMLResponse(content=html_content)


@router.get("/{project_id}/proposal/pdf")
async def generate_proposal_pdf(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate and download PDF proposal for a project.
    
    Returns PDF file as downloadable attachment.
    """
    # Get project with venues
    project = await project_service.get_by_id_with_venues(db, project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found"
        )
    
    # Check if there are venues to include
    included_count = sum(1 for pv in project.project_venues if pv.include_in_proposal)
    if included_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No venues marked for inclusion in proposal"
        )
    
    try:
        # Generate PDF
        pdf_bytes = await proposal_generator.generate_pdf_proposal(db, project)
        
        # Create filename
        filename = f"{project.client_name}_{project.event_name}_proposal.pdf".replace(" ", "_")
        
        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF generation not available. WeasyPrint is not installed."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )
