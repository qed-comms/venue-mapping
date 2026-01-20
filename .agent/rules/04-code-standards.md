# Code Standards

## Formatting

### Python (Backend)

| Rule | Value |
|------|-------|
| **Formatter** | Black |
| **Line Length** | 88 characters |
| **Indentation** | 4 spaces |
| **Quotes** | Double quotes (`"`) |
| **Imports** | Sorted with isort (Black-compatible profile) |
| **Type Hints** | Required for all function signatures |

```bash
# Format command
black . && isort .

# Check command
black --check . && isort --check .
```

### TypeScript (Frontend)

| Rule | Value |
|------|-------|
| **Formatter** | Prettier |
| **Line Length** | 100 characters |
| **Indentation** | 2 spaces |
| **Quotes** | Single quotes (`'`) |
| **Semicolons** | Yes |
| **Trailing Commas** | ES5 (arrays, objects) |

```bash
# Format command
pnpm prettier --write .

# Check command
pnpm prettier --check .
```

### Linting

| Tool | Config File |
|------|-------------|
| **Python** | Ruff (`ruff.toml`) |
| **TypeScript** | ESLint (`.eslintrc.js`) |

## Naming Conventions

### Python

| Element | Convention | Example |
|---------|------------|---------|
| Files/Modules | snake_case | `project_venue.py` |
| Classes | PascalCase | `ProjectVenue` |
| Functions | snake_case | `get_venue_by_id` |
| Variables | snake_case | `venue_count` |
| Constants | SCREAMING_SNAKE | `MAX_PHOTO_SIZE` |
| Private | Leading underscore | `_calculate_price` |
| SQLAlchemy Models | PascalCase, singular | `Venue`, `Project` |
| Pydantic Schemas | PascalCase with suffix | `VenueCreate`, `VenueResponse` |

### TypeScript

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `VenueCard.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Components | PascalCase | `VenueCard` |
| Functions | camelCase | `getVenueById` |
| Variables | camelCase | `venueCount` |
| Constants | SCREAMING_SNAKE | `MAX_PHOTO_SIZE` |
| Interfaces/Types | PascalCase | `Venue`, `ProjectVenue` |
| Props interfaces | PascalCase with Props | `VenueCardProps` |
| Hooks | camelCase with use prefix | `useVenues` |

### Database

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `venues`, `project_venues` |
| Columns | snake_case | `event_date_start` |
| Primary Keys | `id` | `id` |
| Foreign Keys | `<table>_id` | `venue_id`, `project_id` |
| Indexes | `idx_<table>_<columns>` | `idx_venues_city` |
| Constraints | `chk_<table>_<rule>` | `chk_project_dates` |
| Enums | snake_case | `outreach_status` |

## Documentation Requirements

### Python Docstrings (Google Style)

```python
def get_venues_for_project(
    project_id: UUID,
    include_declined: bool = False,
) -> list[ProjectVenue]:
    """Retrieve all venues associated with a project.

    Args:
        project_id: The UUID of the project.
        include_declined: Whether to include declined venues. Defaults to False.

    Returns:
        List of ProjectVenue objects for the project.

    Raises:
        ProjectNotFoundError: If the project doesn't exist.
    """
```

### TypeScript JSDoc

```typescript
/**
 * Fetches venues matching the given filters.
 * @param filters - Filter criteria for venue search
 * @returns Promise resolving to array of venues
 * @throws {ApiError} If the request fails
 */
export async function getVenues(filters: VenueFilters): Promise<Venue[]> {
```

### Required Documentation

| Element | Requirement |
|---------|-------------|
| API endpoints | Docstring with description, params, returns |
| Service functions | Docstring with business logic explanation |
| Complex algorithms | Inline comments explaining approach |
| React components | JSDoc for props interface |
| Utility functions | JSDoc with examples |
| Database models | Column comments for non-obvious fields |

## Error Handling

### Python Backend

```python
# Use custom exceptions for business logic errors
class VenueMappingError(Exception):
    """Base exception for application errors."""
    pass

class VenueNotFoundError(VenueMappingError):
    """Raised when a venue doesn't exist."""
    pass

class ProjectNotFoundError(VenueMappingError):
    """Raised when a project doesn't exist."""
    pass

# In API routes, use HTTPException
from fastapi import HTTPException, status

@router.get("/venues/{venue_id}")
async def get_venue(venue_id: UUID, db: AsyncSession = Depends(get_db)):
    venue = await venue_service.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venue with id {venue_id} not found"
        )
    return venue
```

### TypeScript Frontend

```typescript
// Use try-catch with typed errors
try {
  const venue = await api.getVenue(venueId);
  return venue;
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      toast.error('Venue not found');
    } else {
      toast.error('Failed to load venue');
    }
  }
  throw error;
}
```

### Logging

```python
import logging

logger = logging.getLogger(__name__)

# Log levels
logger.debug("Detailed debugging info")       # Development only
logger.info("Normal operation events")        # Happy path
logger.warning("Something unexpected")        # Recoverable issues
logger.error("Operation failed", exc_info=True)  # Errors with stack trace
```

## Testing Requirements

### Coverage Targets

| Type | Minimum Coverage |
|------|------------------|
| Unit tests | 80% |
| Integration tests | Critical paths covered |
| E2E tests | Happy path for core features |

### Test File Structure

**Python:**
```
tests/
├── conftest.py              # Shared fixtures
├── unit/
│   ├── test_services/
│   │   ├── test_venue_service.py
│   │   └── test_pdf_generator.py
│   └── test_models/
├── integration/
│   ├── test_api/
│   │   ├── test_venues_api.py
│   │   └── test_projects_api.py
│   └── test_database/
└── fixtures/
    └── sample_data.py
```

**TypeScript:**
```
src/
├── components/
│   └── VenueCard/
│       ├── VenueCard.tsx
│       └── VenueCard.test.tsx   # Co-located tests
└── utils/
    ├── formatDate.ts
    └── formatDate.test.ts
```

### Test Naming

```python
# Python: test_<function>_<scenario>_<expected_result>
def test_get_venue_by_id_when_exists_returns_venue():
def test_get_venue_by_id_when_not_found_raises_error():
def test_create_project_with_valid_data_creates_project():
```

```typescript
// TypeScript: describe block with it statements
describe('VenueCard', () => {
  it('renders venue name and city', () => {});
  it('displays capacity badge when capacity provided', () => {});
  it('calls onSelect when clicked', () => {});
});
```

### Mocking Strategy

- Use `pytest-mock` for Python mocking
- Use `vitest` with `vi.mock()` for TypeScript
- Mock external services (S3, Claude API) in tests
- Use factory functions for test data creation

## Git Conventions

### Branch Naming

```
<type>/<short-description>

Types:
- feature/   New feature
- fix/       Bug fix
- refactor/  Code refactoring
- docs/      Documentation
- test/      Adding tests
- chore/     Maintenance tasks

Examples:
- feature/venue-photo-upload
- fix/pdf-generation-timeout
- refactor/project-service-async
```

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer]

Types: feat, fix, docs, style, refactor, test, chore

Examples:
- feat(venues): add photo upload endpoint
- fix(pdf): resolve timeout for large proposals
- docs(api): add OpenAPI descriptions for project endpoints
- refactor(auth): extract JWT logic to service
- test(venues): add integration tests for search
```

### Pull Request Requirements

- [ ] Title follows conventional commit format
- [ ] Description explains what and why
- [ ] All tests pass
- [ ] Code formatted (Black, Prettier)
- [ ] Linting passes (Ruff, ESLint)
- [ ] No console.log or print statements
- [ ] New features have tests
- [ ] Breaking changes documented

## Forbidden Patterns

| Pattern | Why | Instead |
|---------|-----|---------|
| `# type: ignore` without comment | Hides real issues | Fix the type or add explanation |
| `any` type in TypeScript | Defeats type safety | Use proper types or `unknown` |
| Bare `except:` in Python | Catches everything | Catch specific exceptions |
| `console.log` in production | Clutters console | Use proper logging or remove |
| SQL string concatenation | SQL injection risk | Use parameterized queries |
| Hardcoded secrets | Security risk | Use environment variables |
| `*` imports | Namespace pollution | Import specific names |
| Mutating function parameters | Unexpected side effects | Return new objects |
| `setTimeout` for loading states | Unreliable | Use proper async state |
| `!important` in CSS | Specificity issues | Fix the cascade properly |
