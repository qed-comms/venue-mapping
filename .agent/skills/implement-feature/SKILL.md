---
name: implement-feature
description: Implements new features in the Venue Mapping AI codebase following project architecture patterns. Use when asked to build, create, add, or implement functionality.
---

# Feature Implementation Skill

## Pre-Implementation Checklist

Before writing any code, verify:

1. [ ] Requirements are clear (ask if ambiguous)
2. [ ] Feature is in-scope (check `02-goals-and-scope.md`)
3. [ ] Identify affected layers (API, service, model, frontend)
4. [ ] Check for existing similar patterns in codebase
5. [ ] Plan database migrations if schema changes needed
6. [ ] Consider edge cases and error states
7. [ ] Plan test cases

## Implementation Steps

### Step 1: Plan the Implementation

Generate an implementation plan with:
- Files to create/modify
- Database changes (if any)
- API endpoints (if any)
- Frontend components (if any)
- Test cases to write

**Wait for user approval before proceeding.**

### Step 2: Backend Implementation Order

When implementing backend features, follow this order:

1. **Database Model** (if new entity or fields)
2. **Pydantic Schemas** (request/response validation)
3. **Service Layer** (business logic)
4. **API Route** (HTTP endpoint)
5. **Tests** (unit and integration)

### Step 3: Frontend Implementation Order

When implementing frontend features:

1. **Types** (TypeScript interfaces)
2. **API Client** (fetch functions)
3. **Hooks** (React Query hooks)
4. **Components** (UI elements)
5. **Pages** (route components)
6. **Tests** (component tests)

---

## Code Templates

### SQLAlchemy Model (New Entity)

```python
# backend/app/models/example.py
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .related_model import RelatedModel


class Example(Base, TimestampMixin):
    """Description of what this entity represents."""
    
    __tablename__ = "examples"
    
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Foreign key example
    related_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("related_table.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Relationships
    related: Mapped["RelatedModel"] = relationship(
        "RelatedModel",
        back_populates="examples"
    )
    
    def __repr__(self) -> str:
        return f"<Example {self.name}>"
```

### Pydantic Schemas

```python
# backend/app/schemas/example.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ExampleBase(BaseModel):
    """Shared fields for Example."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ExampleCreate(ExampleBase):
    """Fields required to create an Example."""
    related_id: UUID


class ExampleUpdate(BaseModel):
    """Fields that can be updated (all optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class ExampleResponse(ExampleBase):
    """Response schema with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    related_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ExampleListResponse(BaseModel):
    """Paginated list response."""
    items: list[ExampleResponse]
    total: int
    page: int
    page_size: int
```

### Service Layer

```python
# backend/app/services/example_service.py
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.example import Example
from app.schemas.example import ExampleCreate, ExampleUpdate


class ExampleService:
    """Business logic for Example entity."""
    
    async def get_by_id(
        self, 
        db: AsyncSession, 
        example_id: UUID
    ) -> Optional[Example]:
        """Get an example by ID."""
        result = await db.execute(
            select(Example).where(Example.id == example_id)
        )
        return result.scalar_one_or_none()
    
    async def get_list(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Example], int]:
        """Get paginated list of examples."""
        query = select(Example)
        
        if is_active is not None:
            query = query.where(Example.is_active == is_active)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        # Apply pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(query)
        return result.scalars().all(), total or 0
    
    async def create(
        self, 
        db: AsyncSession, 
        data: ExampleCreate
    ) -> Example:
        """Create a new example."""
        example = Example(**data.model_dump())
        db.add(example)
        await db.commit()
        await db.refresh(example)
        return example
    
    async def update(
        self,
        db: AsyncSession,
        example: Example,
        data: ExampleUpdate,
    ) -> Example:
        """Update an existing example."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(example, field, value)
        await db.commit()
        await db.refresh(example)
        return example
    
    async def delete(self, db: AsyncSession, example: Example) -> None:
        """Delete an example."""
        await db.delete(example)
        await db.commit()


example_service = ExampleService()
```

### API Route

```python
# backend/app/api/examples.py
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.example import (
    ExampleCreate,
    ExampleListResponse,
    ExampleResponse,
    ExampleUpdate,
)
from app.services.example_service import example_service

router = APIRouter(prefix="/examples", tags=["examples"])


@router.get("", response_model=ExampleListResponse)
async def list_examples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List examples with pagination and filtering."""
    items, total = await example_service.get_list(
        db, page=page, page_size=page_size, is_active=is_active
    )
    return ExampleListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single example by ID."""
    example = await example_service.get_by_id(db, example_id)
    if not example:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Example with id {example_id} not found",
        )
    return example


@router.post("", response_model=ExampleResponse, status_code=status.HTTP_201_CREATED)
async def create_example(
    data: ExampleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new example."""
    example = await example_service.create(db, data)
    return example


@router.patch("/{example_id}", response_model=ExampleResponse)
async def update_example(
    example_id: UUID,
    data: ExampleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an example."""
    example = await example_service.get_by_id(db, example_id)
    if not example:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Example with id {example_id} not found",
        )
    return await example_service.update(db, example, data)


@router.delete("/{example_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_example(
    example_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an example."""
    example = await example_service.get_by_id(db, example_id)
    if not example:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Example with id {example_id} not found",
        )
    await example_service.delete(db, example)
```

### TypeScript Types

```typescript
// frontend/src/types/example.ts
export interface Example {
  id: string;
  name: string;
  description: string | null;
  relatedId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExampleCreate {
  name: string;
  description?: string;
  relatedId: string;
}

export interface ExampleUpdate {
  name?: string;
  description?: string;
}

export interface ExampleListResponse {
  items: Example[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExampleFilters {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}
```

### API Client Function

```typescript
// frontend/src/api/examples.ts
import { apiClient } from './client';
import type { 
  Example, 
  ExampleCreate, 
  ExampleUpdate, 
  ExampleListResponse,
  ExampleFilters 
} from '@/types/example';

export const examplesApi = {
  list: async (filters: ExampleFilters = {}): Promise<ExampleListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('page_size', String(filters.pageSize));
    if (filters.isActive !== undefined) params.set('is_active', String(filters.isActive));
    
    return apiClient.get(`/examples?${params}`);
  },

  get: async (id: string): Promise<Example> => {
    return apiClient.get(`/examples/${id}`);
  },

  create: async (data: ExampleCreate): Promise<Example> => {
    return apiClient.post('/examples', data);
  },

  update: async (id: string, data: ExampleUpdate): Promise<Example> => {
    return apiClient.patch(`/examples/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/examples/${id}`);
  },
};
```

### React Query Hook

```typescript
// frontend/src/hooks/useExamples.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examplesApi } from '@/api/examples';
import type { ExampleCreate, ExampleFilters, ExampleUpdate } from '@/types/example';

export const exampleKeys = {
  all: ['examples'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  list: (filters: ExampleFilters) => [...exampleKeys.lists(), filters] as const,
  details: () => [...exampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...exampleKeys.details(), id] as const,
};

export function useExamples(filters: ExampleFilters = {}) {
  return useQuery({
    queryKey: exampleKeys.list(filters),
    queryFn: () => examplesApi.list(filters),
  });
}

export function useExample(id: string) {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn: () => examplesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateExample() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ExampleCreate) => examplesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}

export function useUpdateExample(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ExampleUpdate) => examplesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}

export function useDeleteExample() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => examplesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
```

### React Component

```tsx
// frontend/src/components/examples/ExampleCard.tsx
import { Building, MapPin } from 'lucide-react';
import type { Example } from '@/types/example';

interface ExampleCardProps {
  example: Example;
  onSelect?: (example: Example) => void;
  selected?: boolean;
}

export function ExampleCard({ example, onSelect, selected }: ExampleCardProps) {
  return (
    <div
      className={`
        rounded-lg border bg-white p-4 transition-all
        ${selected ? 'border-qed-green ring-2 ring-qed-green/20' : 'border-gray-200'}
        ${onSelect ? 'cursor-pointer hover:border-gray-300 hover:shadow-md' : ''}
      `}
      onClick={() => onSelect?.(example)}
    >
      <h3 className="font-semibold text-gray-900">{example.name}</h3>
      
      {example.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {example.description}
        </p>
      )}
      
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className={`
          inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
          ${example.isActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
          }
        `}>
          {example.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
```

---

## Common Mistakes to Avoid

- [ ] Don't skip input validation (use Pydantic for backend, zod for frontend)
- [ ] Don't hardcode configuration values (use environment variables)
- [ ] Don't forget to handle the empty/null case
- [ ] Don't create circular imports (use TYPE_CHECKING for type hints)
- [ ] Don't forget database migrations for schema changes
- [ ] Don't skip error handling (use HTTPException with proper status codes)
- [ ] Don't forget to invalidate React Query cache after mutations
- [ ] Don't use `any` type in TypeScript (define proper types)
- [ ] Don't forget loading and error states in UI
- [ ] Don't skip tests for new functionality

## Database Migration Workflow

When adding/modifying database schema:

```bash
# 1. Make changes to SQLAlchemy model

# 2. Generate migration
alembic revision --autogenerate -m "add_example_table"

# 3. Review generated migration in alembic/versions/

# 4. Apply migration
alembic upgrade head

# 5. Test the changes
pytest tests/
```

## File Checklist for New Feature

| File | Purpose |
|------|---------|
| `backend/app/models/<entity>.py` | SQLAlchemy model |
| `backend/app/schemas/<entity>.py` | Pydantic schemas |
| `backend/app/services/<entity>_service.py` | Business logic |
| `backend/app/api/<entity>.py` | API routes |
| `backend/tests/unit/test_<entity>_service.py` | Service tests |
| `backend/tests/integration/test_<entity>_api.py` | API tests |
| `alembic/versions/<migration>.py` | Database migration |
| `frontend/src/types/<entity>.ts` | TypeScript types |
| `frontend/src/api/<entity>.ts` | API client |
| `frontend/src/hooks/use<Entity>.ts` | React Query hooks |
| `frontend/src/components/<entity>/` | UI components |
