---
name: database-operations
description: Database operations for Venue Mapping AI using SQLAlchemy 2.0 async and PostgreSQL. Use when writing queries, creating migrations, or working with the data layer.
---

# Database Operations Skill

## Overview

The Venue Mapping AI uses:
- **PostgreSQL 15+** as the database
- **SQLAlchemy 2.0** with async support via `asyncpg`
- **Alembic** for migrations

## Database Connection Setup

```python
# backend/app/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL in development
    poolclass=NullPool,   # For serverless, use pool for long-running
)

# Create session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """Dependency for getting database sessions."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

## Common Query Patterns

### Basic CRUD Operations

```python
from uuid import UUID
from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.venue import Venue
from app.models.project import Project
from app.models.project_venue import ProjectVenue


# GET BY ID
async def get_venue_by_id(db: AsyncSession, venue_id: UUID) -> Venue | None:
    result = await db.execute(
        select(Venue).where(Venue.id == venue_id)
    )
    return result.scalar_one_or_none()


# GET ALL (with soft delete filter)
async def get_all_venues(db: AsyncSession) -> list[Venue]:
    result = await db.execute(
        select(Venue).where(Venue.is_deleted == False).order_by(Venue.name)
    )
    return list(result.scalars().all())


# CREATE
async def create_venue(db: AsyncSession, venue: Venue) -> Venue:
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    return venue


# UPDATE
async def update_venue(
    db: AsyncSession, 
    venue: Venue, 
    **kwargs
) -> Venue:
    for field, value in kwargs.items():
        setattr(venue, field, value)
    await db.commit()
    await db.refresh(venue)
    return venue


# DELETE (soft delete)
async def delete_venue(db: AsyncSession, venue: Venue) -> None:
    venue.is_deleted = True
    await db.commit()
```

### Filtering and Pagination

```python
from typing import Optional

async def get_venues_filtered(
    db: AsyncSession,
    *,
    city: Optional[str] = None,
    min_capacity: Optional[int] = None,
    facilities: Optional[list[str]] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Venue], int]:
    """Get venues with filtering and pagination."""
    
    # Build base query
    query = select(Venue).where(Venue.is_deleted == False)
    
    # Apply filters
    if city:
        query = query.where(Venue.city == city)
    
    if min_capacity:
        query = query.where(Venue.capacity >= min_capacity)
    
    if facilities:
        # PostgreSQL array containment: venue must have ALL specified facilities
        query = query.where(Venue.facilities.contains(facilities))
    
    # Get total count (before pagination)
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Apply pagination
    query = query.order_by(Venue.name)
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    # Execute
    result = await db.execute(query)
    venues = list(result.scalars().all())
    
    return venues, total
```

### Eager Loading Relationships

```python
# Load project with all related project_venues and their venues
async def get_project_with_venues(
    db: AsyncSession, 
    project_id: UUID
) -> Project | None:
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.project_venues)
            .selectinload(ProjectVenue.venue)
            .selectinload(Venue.photos)
        )
        .where(Project.id == project_id)
    )
    return result.scalar_one_or_none()


# Load venue with photos
async def get_venue_with_photos(
    db: AsyncSession, 
    venue_id: UUID
) -> Venue | None:
    result = await db.execute(
        select(Venue)
        .options(selectinload(Venue.photos))
        .where(Venue.id == venue_id)
    )
    return result.scalar_one_or_none()
```

### Aggregation Queries

```python
from sqlalchemy import func, case

# Count projects by status
async def get_project_status_counts(db: AsyncSession) -> dict[str, int]:
    result = await db.execute(
        select(
            Project.status,
            func.count(Project.id).label('count')
        )
        .group_by(Project.status)
    )
    return {row.status.value: row.count for row in result.all()}


# Get venue outreach statistics for a project
async def get_project_outreach_stats(
    db: AsyncSession, 
    project_id: UUID
) -> dict[str, int]:
    result = await db.execute(
        select(
            ProjectVenue.outreach_status,
            func.count(ProjectVenue.id).label('count')
        )
        .where(ProjectVenue.project_id == project_id)
        .group_by(ProjectVenue.outreach_status)
    )
    return {row.outreach_status.value: row.count for row in result.all()}


# Count venues per city
async def get_venues_by_city(db: AsyncSession) -> list[tuple[str, int]]:
    result = await db.execute(
        select(
            Venue.city,
            func.count(Venue.id).label('count')
        )
        .where(Venue.is_deleted == False)
        .group_by(Venue.city)
        .order_by(func.count(Venue.id).desc())
    )
    return [(row.city, row.count) for row in result.all()]
```

### Complex Joins

```python
# Get project venues with full details for PDF generation
async def get_included_venues_for_pdf(
    db: AsyncSession, 
    project_id: UUID
) -> list[ProjectVenue]:
    result = await db.execute(
        select(ProjectVenue)
        .options(
            selectinload(ProjectVenue.venue).selectinload(Venue.photos),
            selectinload(ProjectVenue.catering_provider),
        )
        .where(
            ProjectVenue.project_id == project_id,
            ProjectVenue.include_in_proposal == True,
        )
        .order_by(ProjectVenue.created_at)
    )
    return list(result.scalars().all())


# Search venues used in past projects for a client
async def get_venues_used_by_client(
    db: AsyncSession, 
    client_name: str
) -> list[Venue]:
    result = await db.execute(
        select(Venue)
        .distinct()
        .join(ProjectVenue, ProjectVenue.venue_id == Venue.id)
        .join(Project, Project.id == ProjectVenue.project_id)
        .where(
            Project.client_name == client_name,
            ProjectVenue.include_in_proposal == True,
        )
    )
    return list(result.scalars().all())
```

### Text Search

```python
# Fuzzy search venues by name (requires pg_trgm extension)
async def search_venues_by_name(
    db: AsyncSession, 
    search_term: str
) -> list[Venue]:
    result = await db.execute(
        select(Venue)
        .where(
            Venue.is_deleted == False,
            Venue.name.ilike(f"%{search_term}%")
        )
        .order_by(Venue.name)
        .limit(20)
    )
    return list(result.scalars().all())


# Search projects by client or event name
async def search_projects(
    db: AsyncSession, 
    search_term: str
) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(
            (Project.client_name.ilike(f"%{search_term}%")) |
            (Project.event_name.ilike(f"%{search_term}%"))
        )
        .order_by(Project.created_at.desc())
        .limit(20)
    )
    return list(result.scalars().all())
```

---

## Transaction Patterns

```python
from sqlalchemy.exc import IntegrityError

# Multiple operations in a transaction
async def add_venue_to_project(
    db: AsyncSession,
    project_id: UUID,
    venue_id: UUID,
    user_id: UUID,
) -> ProjectVenue:
    """Add a venue to a project and log the activity."""
    try:
        # Create project venue
        project_venue = ProjectVenue(
            project_id=project_id,
            venue_id=venue_id,
        )
        db.add(project_venue)
        
        # Create activity log
        activity_log = ActivityLog(
            project_id=project_id,
            user_id=user_id,
            action="venue_added",
            details={"venue_id": str(venue_id)}
        )
        db.add(activity_log)
        
        # Commit both
        await db.commit()
        await db.refresh(project_venue)
        
        return project_venue
        
    except IntegrityError:
        await db.rollback()
        raise ValueError("Venue already in project or doesn't exist")
```

---

## Alembic Migrations

### Initial Setup

```bash
# Initialize Alembic
cd backend
alembic init alembic

# Configure alembic/env.py (see below)
```

### Configure `alembic/env.py`

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Import your models
from app.models import Base
from app.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    """Run migrations in 'online' mode with async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Migration Commands

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "description_of_change"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

### Example Migration

```python
# alembic/versions/001_initial_schema.py
"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE user_role AS ENUM ('event_manager', 'admin')")
    op.execute("CREATE TYPE project_status AS ENUM ('active', 'completed', 'cancelled')")
    op.execute("CREATE TYPE outreach_status AS ENUM ('draft', 'sent', 'awaiting', 'responded', 'declined')")
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('phone', sa.String(50)),
        sa.Column('signature_block', sa.Text),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', postgresql.ENUM('event_manager', 'admin', name='user_role', create_type=False), 
                  nullable=False, server_default='event_manager'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    
    # ... create other tables


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('activity_logs')
    op.drop_table('project_venues')
    op.drop_table('projects')
    op.drop_table('photos')
    op.drop_table('venues')
    op.drop_table('catering_providers')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE outreach_status')
    op.execute('DROP TYPE project_status')
    op.execute('DROP TYPE user_role')
```

### Adding a New Column Migration

```python
"""Add rating to venues

Revision ID: 002
Revises: 001
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'


def upgrade() -> None:
    # Add column as nullable first
    op.add_column('venues', sa.Column('rating', sa.Numeric(2, 1)))
    
    # Add check constraint
    op.create_check_constraint(
        'chk_venue_rating_range',
        'venues',
        'rating >= 0 AND rating <= 5'
    )


def downgrade() -> None:
    op.drop_constraint('chk_venue_rating_range', 'venues')
    op.drop_column('venues', 'rating')
```

---

## Testing Database Operations

```python
# backend/tests/conftest.py
import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.models import Base

# Use a separate test database
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/venue_mapping_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine):
    """Create a fresh database session for each test."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


# Example test
@pytest.mark.asyncio
async def test_create_venue(db_session):
    from app.models.venue import Venue
    
    venue = Venue(
        name="Test Venue",
        city="Brussels",
        capacity=100,
        facilities=["Wi-Fi", "AV equipment"],
    )
    
    db_session.add(venue)
    await db_session.commit()
    await db_session.refresh(venue)
    
    assert venue.id is not None
    assert venue.name == "Test Venue"
    assert venue.is_deleted == False
```

---

## Performance Tips

1. **Use `selectinload`** for one-to-many relationships to avoid N+1 queries
2. **Add indexes** for columns used in WHERE clauses and JOINs
3. **Paginate** all list queries (never return unbounded results)
4. **Use `scalar_one_or_none`** instead of `first()` for single results
5. **Batch inserts** when creating multiple records:

```python
async def bulk_create_photos(
    db: AsyncSession, 
    photos: list[Photo]
) -> None:
    db.add_all(photos)
    await db.commit()
```

6. **Use `func.count()` with subquery** for accurate counts with filters
7. **Close sessions** properly (handled by `get_db` dependency)

---

## Schema Reference

See `database-schema.md` in project root for complete SQL schema and entity relationship diagram.
