---
name: testing
description: Testing strategy and patterns for Venue Mapping AI. Use when writing tests, setting up test infrastructure, or debugging test failures.
---

# Testing Skill

## Overview

The Venue Mapping AI uses:
- **Backend**: pytest with pytest-asyncio for async tests
- **Frontend**: Vitest with React Testing Library
- **Coverage**: 80% minimum for unit tests

## Test Structure

```
backend/
├── tests/
│   ├── conftest.py              # Shared fixtures
│   ├── unit/
│   │   ├── test_services/
│   │   │   ├── test_venue_service.py
│   │   │   ├── test_project_service.py
│   │   │   └── test_pdf_generator.py
│   │   └── test_models/
│   │       └── test_project.py
│   ├── integration/
│   │   ├── test_api/
│   │   │   ├── test_venues_api.py
│   │   │   ├── test_projects_api.py
│   │   │   └── test_auth_api.py
│   │   └── test_database/
│   └── fixtures/
│       ├── sample_data.py
│       └── factories.py

frontend/
├── src/
│   ├── components/
│   │   └── VenueCard/
│   │       ├── VenueCard.tsx
│   │       └── VenueCard.test.tsx   # Co-located
│   └── utils/
│       ├── formatDate.ts
│       └── formatDate.test.ts
└── vitest.config.ts
```

---

## Backend Testing

### Setup (pytest)

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx factory-boy

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_services/test_venue_service.py

# Run tests matching pattern
pytest -k "test_create"

# Verbose output
pytest -v
```

### Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
filterwarnings = [
    "ignore::DeprecationWarning",
]

[tool.coverage.run]
source = ["app"]
omit = ["app/migrations/*", "app/tests/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

### Shared Fixtures (`conftest.py`)

```python
# backend/tests/conftest.py
import asyncio
from typing import AsyncGenerator
from uuid import uuid4

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.models import Base
from app.models.user import User
from app.models.enums import UserRole
from app.api.deps import get_db, get_current_user
from app.services.auth import create_access_token

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/venue_mapping_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
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
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create fresh database session for each test."""
    session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        id=uuid4(),
        name="Test User",
        email=f"test-{uuid4()}@example.com",
        password_hash="$2b$12$dummy_hash",
        role=UserRole.EVENT_MANAGER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin test user."""
    user = User(
        id=uuid4(),
        name="Admin User",
        email=f"admin-{uuid4()}@example.com",
        password_hash="$2b$12$dummy_hash",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Create authentication headers for a test user."""
    token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def client(
    db_session: AsyncSession,
    test_user: User,
) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client with database override."""
    
    async def override_get_db():
        yield db_session
    
    async def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client
    
    app.dependency_overrides.clear()
```

### Test Factories

```python
# backend/tests/fixtures/factories.py
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

from app.models.venue import Venue
from app.models.project import Project
from app.models.project_venue import ProjectVenue
from app.models.enums import ProjectStatus, OutreachStatus


class VenueFactory:
    """Factory for creating test venues."""
    
    @staticmethod
    def build(**kwargs) -> Venue:
        defaults = {
            "id": uuid4(),
            "name": "Test Venue",
            "address": "123 Test Street",
            "city": "Brussels",
            "capacity": 200,
            "contact_name": "Test Contact",
            "contact_email": "contact@test.com",
            "facilities": ["Wi-Fi", "AV equipment"],
            "event_types": ["Conferences"],
            "is_deleted": False,
        }
        defaults.update(kwargs)
        return Venue(**defaults)


class ProjectFactory:
    """Factory for creating test projects."""
    
    @staticmethod
    def build(created_by: str, **kwargs) -> Project:
        defaults = {
            "id": uuid4(),
            "client_name": "Test Client",
            "event_name": "Test Event 2025",
            "event_date_start": date.today() + timedelta(days=30),
            "event_date_end": date.today() + timedelta(days=32),
            "attendee_count": 150,
            "budget": Decimal("50000.00"),
            "location_preference": "Brussels",
            "requirements": ["Plenary room", "Breakout room"],
            "status": ProjectStatus.ACTIVE,
            "created_by": created_by,
        }
        defaults.update(kwargs)
        return Project(**defaults)


class ProjectVenueFactory:
    """Factory for creating test project venues."""
    
    @staticmethod
    def build(project_id: str, venue_id: str, **kwargs) -> ProjectVenue:
        defaults = {
            "id": uuid4(),
            "project_id": project_id,
            "venue_id": venue_id,
            "outreach_status": OutreachStatus.DRAFT,
            "include_in_proposal": False,
        }
        defaults.update(kwargs)
        return ProjectVenue(**defaults)
```

### Unit Test Examples

```python
# backend/tests/unit/test_services/test_venue_service.py
import pytest
from uuid import uuid4

from app.services.venue_service import venue_service
from tests.fixtures.factories import VenueFactory


@pytest.mark.asyncio
async def test_get_venue_by_id_when_exists(db_session):
    """Test getting a venue by ID when it exists."""
    # Arrange
    venue = VenueFactory.build(name="Event Lounge", capacity=900)
    db_session.add(venue)
    await db_session.commit()
    
    # Act
    result = await venue_service.get_by_id(db_session, venue.id)
    
    # Assert
    assert result is not None
    assert result.name == "Event Lounge"
    assert result.capacity == 900


@pytest.mark.asyncio
async def test_get_venue_by_id_when_not_found(db_session):
    """Test getting a venue by ID when it doesn't exist."""
    # Act
    result = await venue_service.get_by_id(db_session, uuid4())
    
    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_get_venues_filtered_by_city(db_session):
    """Test filtering venues by city."""
    # Arrange
    db_session.add(VenueFactory.build(name="Brussels Venue", city="Brussels"))
    db_session.add(VenueFactory.build(name="Antwerp Venue", city="Antwerp"))
    await db_session.commit()
    
    # Act
    venues, total = await venue_service.get_list(
        db_session, 
        city="Brussels"
    )
    
    # Assert
    assert total == 1
    assert len(venues) == 1
    assert venues[0].name == "Brussels Venue"


@pytest.mark.asyncio
async def test_get_venues_filtered_by_min_capacity(db_session):
    """Test filtering venues by minimum capacity."""
    # Arrange
    db_session.add(VenueFactory.build(name="Small", capacity=100))
    db_session.add(VenueFactory.build(name="Large", capacity=500))
    await db_session.commit()
    
    # Act
    venues, total = await venue_service.get_list(
        db_session, 
        min_capacity=200
    )
    
    # Assert
    assert total == 1
    assert venues[0].name == "Large"


@pytest.mark.asyncio
async def test_soft_delete_venue(db_session):
    """Test that deleting a venue is a soft delete."""
    # Arrange
    venue = VenueFactory.build()
    db_session.add(venue)
    await db_session.commit()
    
    # Act
    await venue_service.delete(db_session, venue)
    
    # Assert
    await db_session.refresh(venue)
    assert venue.is_deleted == True
    
    # Verify it's excluded from normal queries
    venues, _ = await venue_service.get_list(db_session)
    assert venue not in venues
```

### Integration Test Examples

```python
# backend/tests/integration/test_api/test_venues_api.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_venues_returns_empty_list(client: AsyncClient):
    """Test listing venues when none exist."""
    response = await client.get("/api/v1/venues")
    
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_create_venue_success(client: AsyncClient):
    """Test creating a new venue."""
    venue_data = {
        "name": "Test Venue",
        "city": "Brussels",
        "capacity": 200,
        "facilities": ["Wi-Fi"],
    }
    
    response = await client.post("/api/v1/venues", json=venue_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Venue"
    assert data["city"] == "Brussels"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_venue_validation_error(client: AsyncClient):
    """Test validation error when creating venue with missing required fields."""
    venue_data = {
        "name": "Test Venue",
        # Missing required 'city' and 'capacity'
    }
    
    response = await client.post("/api/v1/venues", json=venue_data)
    
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_get_venue_not_found(client: AsyncClient):
    """Test getting a venue that doesn't exist."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    response = await client.get(f"/api/v1/venues/{fake_id}")
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_venue_partial(client: AsyncClient, db_session):
    """Test partial update of a venue."""
    # Create a venue first
    from tests.fixtures.factories import VenueFactory
    venue = VenueFactory.build()
    db_session.add(venue)
    await db_session.commit()
    
    # Update only the capacity
    response = await client.patch(
        f"/api/v1/venues/{venue.id}",
        json={"capacity": 500}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["capacity"] == 500
    assert data["name"] == venue.name  # Unchanged
```

---

## Frontend Testing

### Setup (Vitest)

```bash
# Install test dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Run tests
pnpm test

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup

```typescript
// frontend/src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Component Test Examples

```tsx
// frontend/src/components/venues/VenueCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VenueCard } from './VenueCard';
import type { Venue } from '@/types/venue';

const mockVenue: Venue = {
  id: '123',
  name: 'Event Lounge',
  city: 'Brussels',
  capacity: 900,
  address: '123 Test Street',
  contactEmail: 'test@test.com',
  facilities: ['Wi-Fi', 'AV equipment'],
  eventTypes: ['Conferences'],
  isDeleted: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('VenueCard', () => {
  it('renders venue name and city', () => {
    render(<VenueCard venue={mockVenue} />);
    
    expect(screen.getByText('Event Lounge')).toBeInTheDocument();
    expect(screen.getByText('Brussels')).toBeInTheDocument();
  });

  it('displays capacity', () => {
    render(<VenueCard venue={mockVenue} />);
    
    expect(screen.getByText(/900/)).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    
    render(<VenueCard venue={mockVenue} onSelect={handleSelect} />);
    fireEvent.click(screen.getByRole('article'));
    
    expect(handleSelect).toHaveBeenCalledWith(mockVenue);
  });

  it('shows selected state when selected prop is true', () => {
    render(<VenueCard venue={mockVenue} selected />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveClass('border-qed-green');
  });

  it('renders facilities as badges', () => {
    render(<VenueCard venue={mockVenue} />);
    
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument();
    expect(screen.getByText('AV equipment')).toBeInTheDocument();
  });
});
```

### Hook Test Examples

```tsx
// frontend/src/hooks/useVenues.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVenues } from './useVenues';
import { venuesApi } from '@/api/venues';

// Mock the API
vi.mock('@/api/venues');

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useVenues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns venues from API', async () => {
    const mockVenues = {
      items: [{ id: '1', name: 'Venue 1' }],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    
    vi.mocked(venuesApi.list).mockResolvedValue(mockVenues);
    
    const { result } = renderHook(() => useVenues(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockVenues);
  });

  it('handles API errors', async () => {
    vi.mocked(venuesApi.list).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useVenues(), { wrapper });
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toBeDefined();
  });

  it('passes filters to API', async () => {
    vi.mocked(venuesApi.list).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    
    renderHook(() => useVenues({ city: 'Brussels', minCapacity: 100 }), { wrapper });
    
    await waitFor(() => {
      expect(venuesApi.list).toHaveBeenCalledWith({
        city: 'Brussels',
        minCapacity: 100,
      });
    });
  });
});
```

### Utility Test Examples

```typescript
// frontend/src/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateRange } from './formatDate';

describe('formatDate', () => {
  it('formats ISO date string to DD/MM/YYYY', () => {
    expect(formatDate('2025-06-23')).toBe('23/06/2025');
  });

  it('handles Date objects', () => {
    const date = new Date(2025, 5, 23); // June 23, 2025
    expect(formatDate(date)).toBe('23/06/2025');
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });
});

describe('formatDateRange', () => {
  it('formats date range correctly', () => {
    expect(formatDateRange('2025-06-23', '2025-06-26'))
      .toBe('23/06/2025 - 26/06/2025');
  });

  it('shows single date when start equals end', () => {
    expect(formatDateRange('2025-06-23', '2025-06-23'))
      .toBe('23/06/2025');
  });
});
```

---

## Test Naming Convention

```
test_<function_name>_<scenario>_<expected_result>
```

Examples:
- `test_get_venue_by_id_when_exists_returns_venue`
- `test_get_venue_by_id_when_not_found_returns_none`
- `test_create_project_with_invalid_dates_raises_error`
- `test_generate_pdf_with_no_venues_returns_empty_pdf`

---

## Running Tests in CI

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: venue_mapping_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov httpx
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/venue_mapping_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      
      - name: Run tests
        run: |
          cd frontend
          pnpm test --coverage
```

---

## Test Checklist

Before submitting code:

- [ ] All existing tests pass
- [ ] New functionality has tests
- [ ] Unit tests cover edge cases (null, empty, error states)
- [ ] Integration tests cover happy path
- [ ] Tests are deterministic (no random failures)
- [ ] Tests are fast (< 1 second for unit, < 5 seconds for integration)
- [ ] No console.log or print statements in tests
- [ ] Test names describe what's being tested
