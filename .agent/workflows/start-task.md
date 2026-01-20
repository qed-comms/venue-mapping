---
description: Initializes a new development task with proper planning and documentation. Run this workflow when starting any new feature, bug fix, or improvement.
---

# Start New Task Workflow

Follow these steps in order when beginning a new task:

## Step 1: Clarify the Task

- [ ] Summarize what needs to be built in your own words
- [ ] List any assumptions you're making
- [ ] Identify if this task is in-scope (check `02-goals-and-scope.md`)
- [ ] Ask clarifying questions if requirements are ambiguous

**Questions to consider:**
- What is the user trying to accomplish?
- What is the expected outcome?
- Are there edge cases to handle?
- Does this affect existing functionality?

## Step 2: Check Current Project State

- [ ] Read `docs/PROJECT.md` for current project status
- [ ] Identify relevant existing code and patterns
- [ ] Note any blockers or dependencies
- [ ] Check if related work is in progress

**Key files to review:**
- `docs/PROJECT.md` — Current state
- `docs/TASK-LOG.md` — Recent tasks
- `docs/DECISIONS.md` — Architecture decisions that might apply

## Step 3: Determine Affected Areas

Identify which layers will be impacted:

| Layer | Affected? | Files |
|-------|-----------|-------|
| Database schema | ☐ | `backend/app/models/`, migrations |
| API endpoints | ☐ | `backend/app/api/` |
| Services/Logic | ☐ | `backend/app/services/` |
| Frontend components | ☐ | `frontend/src/components/` |
| Frontend pages | ☐ | `frontend/src/pages/` |
| Tests | ☐ | `backend/tests/`, `frontend/src/**/*.test.tsx` |

## Step 4: Create Implementation Plan

Generate a plan with:

1. **Files to create** (list with brief purpose)
2. **Files to modify** (list with what changes)
3. **Database migrations** (if needed)
4. **API changes** (new endpoints, modified responses)
5. **Frontend changes** (new components, modified UI)
6. **Tests to write** (unit, integration)

**Estimate complexity:**
- [ ] Small (< 2 hours, single file changes)
- [ ] Medium (2-8 hours, multiple files)
- [ ] Large (> 8 hours, architectural changes)

## Step 5: Review Domain Terms

Check `05-domain-glossary.md` for relevant terms:

- Are you using entity names correctly? (Project, Venue, ProjectVenue)
- Is the outreach workflow being followed? (draft → sent → awaiting → responded)
- Are status enums correct? (ProjectStatus, OutreachStatus)

## Step 6: Update Task Log

Add entry to `docs/TASK-LOG.md`:

```markdown
## [YYYY-MM-DD] - [Task Title]

**Status**: In Progress
**Assigned To**: [Agent/Human]
**Ticket**: [Link if applicable]

**Goal**: 
[One sentence describing what needs to be accomplished]

**Approach**:
[Brief outline of how to implement]

**Files to Change**:
- `path/to/file.py` — [What will change]
- `path/to/other.tsx` — [What will change]

**Blockers/Dependencies**:
- [Any blockers or things that need to happen first]
```

## Step 7: Wait for Approval

Present the implementation plan and wait for user confirmation before writing code.

**Plan Template:**

```
## Implementation Plan: [Task Title]

### Summary
[One paragraph explaining what will be built]

### Changes

**Backend:**
- [ ] Create `app/models/new_model.py`
- [ ] Add endpoint `POST /api/v1/resource`
- [ ] Add migration for new table

**Frontend:**
- [ ] Create `NewComponent.tsx`
- [ ] Update `ExistingPage.tsx`

**Tests:**
- [ ] Unit tests for new service
- [ ] Integration tests for new endpoint
- [ ] Component tests

### Risks/Considerations
- [Any potential issues or things to watch out for]

### Estimated Time
[X hours]

Ready to proceed?
```

---

## Quick Checklist

Before starting implementation:

- [ ] Task is clearly understood
- [ ] Task is in-scope
- [ ] Current project state is known
- [ ] Affected areas are identified
- [ ] Implementation plan is created
- [ ] Task log is updated
- [ ] Plan is approved
