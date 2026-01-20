---
description: Finalizes a completed task with verification, documentation, and cleanup. Run this workflow when finishing any development task.
---

# Complete Task Workflow

Follow these steps in order when completing a task:

## Step 1: Verify Implementation

### Code Quality Checks

```bash
# Backend
cd backend
black --check .           # Formatting
isort --check .           # Import sorting
ruff check .              # Linting
mypy app/                 # Type checking

# Frontend
cd frontend
pnpm lint                 # ESLint
pnpm typecheck            # TypeScript
```

### Run Tests

```bash
# Backend tests
cd backend
pytest -v

# Frontend tests
cd frontend
pnpm test
```

### Manual Verification

- [ ] Feature works as expected (happy path)
- [ ] Edge cases handled (empty states, errors)
- [ ] No console errors in browser
- [ ] API responses are correct (check OpenAPI docs)
- [ ] UI matches design requirements

## Step 2: Update Documentation

### Update `docs/PROJECT.md`

If the system state changed:

- [ ] Add new features to "What's Working" section
- [ ] Update API endpoints list if new endpoints added
- [ ] Update database schema summary if tables changed
- [ ] Add any new environment variables
- [ ] Move completed items from "In Progress"

### Update `docs/TASK-LOG.md`

Update the task entry:

```markdown
## [YYYY-MM-DD] - [Task Title]

**Status**: Complete
**Completed**: [YYYY-MM-DD]

**Goal**: 
[Original goal]

**Summary**:
[What was actually built]

**Files Changed**:
- `path/to/file.py` — [What changed]
- `path/to/other.tsx` — [What changed]

**Tests Added**:
- `tests/unit/test_new_service.py`
- `src/components/NewComponent.test.tsx`

**Learnings**:
- [Anything useful to remember for next time]
```

### Update `docs/DECISIONS.md`

If any architectural decisions were made:

```markdown
## [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Accepted
**Context**: [Why this decision was needed]
**Decision**: [What was decided]
**Consequences**: [What this means for the project]
```

## Step 3: Generate Commit Message

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```
feat(venues): add photo upload endpoint

- Add POST /api/v1/venues/{id}/photos endpoint
- Support multiple file upload
- Store photos in S3
- Add display_order for photo sorting

Closes #123
```

```
fix(pdf): resolve timeout for large proposals

The PDF generator was timing out when venues had many photos.
Now limits photos to 4 per venue and optimizes image loading.
```

## Step 4: Create Summary for User

Provide a clear summary:

```markdown
## Task Complete: [Title]

### What was built
[Brief description of the feature/fix]

### How to test it
1. [Step 1]
2. [Step 2]
3. [Expected result]

### Files changed
- `file1.py` — [brief description]
- `file2.tsx` — [brief description]

### Follow-up tasks identified
- [ ] [Any related work that was discovered]
- [ ] [Technical debt to address later]

### Notes
[Any important notes for future reference]
```

## Step 5: Clean Up

- [ ] Remove any debugging code
- [ ] Remove any `console.log` or `print` statements
- [ ] Remove any TODO comments that are now resolved
- [ ] Remove any unused imports
- [ ] Ensure no secrets are hardcoded

---

## Quick Checklist

Before marking a task complete:

- [ ] All tests pass
- [ ] Code is formatted and linted
- [ ] Manual testing confirms feature works
- [ ] `docs/PROJECT.md` is updated
- [ ] `docs/TASK-LOG.md` is updated
- [ ] Commit message follows conventions
- [ ] No debugging code left behind
- [ ] Summary provided to user
