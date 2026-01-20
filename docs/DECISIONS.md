# Architecture Decision Records

This document tracks significant architectural and technical decisions for the Venue Mapping AI project.

---

## ADR Template

```markdown
## ADR-[NUMBER]: [Title]

**Date**: YYYY-MM-DD  
**Status**: [Proposed / Accepted / Deprecated / Superseded]  
**Deciders**: [Who was involved]

### Context

[What is the issue that we're seeing that motivates this decision?]

### Decision

[What is the change that we're proposing and/or doing?]

### Consequences

**Positive:**
- [Good outcome]

**Negative:**
- [Trade-off or downside]

**Neutral:**
- [Neither good nor bad, just a fact]
```

---

## Decisions

### ADR-001: Use FastAPI for Backend Framework

**Date**: 2025-01  
**Status**: Accepted  
**Deciders**: Project team

#### Context

We needed to choose a Python web framework for the backend API. Options considered were Django, Flask, and FastAPI.

#### Decision

Use FastAPI for the backend REST API.

#### Consequences

**Positive:**
- Native async support for database operations
- Automatic OpenAPI documentation generation
- Built-in request validation via Pydantic
- Modern Python type hints throughout
- Good performance for IO-bound operations

**Negative:**
- Smaller ecosystem than Django
- No built-in admin interface
- Team needs to learn FastAPI patterns

**Neutral:**
- Still uses SQLAlchemy (familiar ORM)

---

### ADR-002: Use WeasyPrint for PDF Generation

**Date**: 2025-01  
**Status**: Accepted  
**Deciders**: Project team

#### Context

We need to generate branded PDF proposals. Options considered were WeasyPrint, Puppeteer/Playwright, ReportLab, and wkhtmltopdf.

#### Decision

Use WeasyPrint for HTML-to-PDF conversion.

#### Consequences

**Positive:**
- Pure Python, no external browser dependency
- Good CSS support (flexbox, grid basics)
- Easy to template with Jinja2
- Print-specific CSS features (@page, page-break)

**Negative:**
- No JavaScript support in templates
- Some advanced CSS3 features not supported
- May need custom fonts installed

**Neutral:**
- Requires learning print CSS conventions

---

### ADR-003: Soft Delete for Venues

**Date**: 2025-01  
**Status**: Accepted  
**Deciders**: Project team

#### Context

Venues may be referenced in historical projects. If a venue is deleted, those project records would have broken references.

#### Decision

Implement soft delete for venues using an `is_deleted` boolean flag. Deleted venues are excluded from search results but remain in the database.

#### Consequences

**Positive:**
- Historical project data remains intact
- Can restore accidentally deleted venues
- Audit trail preserved

**Negative:**
- Must filter `is_deleted = False` in all venue queries
- Database grows over time (no hard deletes)

**Neutral:**
- Standard pattern for preserving referential integrity

---

### ADR-004: All Users Can Access All Projects

**Date**: 2025-01  
**Status**: Accepted  
**Deciders**: Project team, QED stakeholders

#### Context

QED has a small team (~5 event managers). We needed to decide on project ownership and access control.

#### Decision

No project ownership restrictions. All authenticated users can view and edit all projects. Activity is logged for accountability.

#### Consequences

**Positive:**
- Simple permission model
- Team members can cover for each other
- No access issues when someone is out

**Negative:**
- No privacy between team members
- Risk of accidental edits by others

**Neutral:**
- Activity logs provide accountability

---

### ADR-005: Store Photos in S3-Compatible Storage

**Date**: 2025-01  
**Status**: Accepted  
**Deciders**: Project team

#### Context

Venue photos need to be stored somewhere. Options were database BLOBs, local filesystem, or cloud object storage.

#### Decision

Use S3-compatible object storage (AWS S3, MinIO, or Cloudflare R2).

#### Consequences

**Positive:**
- Scalable storage independent of database
- CDN-friendly URLs for fast delivery
- Standard API (works with multiple providers)
- No database bloat

**Negative:**
- Additional service to manage
- Requires CORS configuration
- Cost considerations for storage/bandwidth

**Neutral:**
- Need to handle upload presigned URLs or proxy uploads

---

### ADR-006: JWT for Authentication

**Date**: 2025-01  
**Status**: Accepted  
**Deciders**: Project team

#### Context

Need to authenticate API requests. Options were session-based auth or token-based auth (JWT).

#### Decision

Use JWT (JSON Web Tokens) for stateless authentication.

#### Consequences

**Positive:**
- Stateless - no server-side session storage
- Works well with SPA frontend
- Easy horizontal scaling
- Standard approach for REST APIs

**Negative:**
- Tokens can't be easily invalidated
- Must handle token refresh
- Token size larger than session cookie

**Neutral:**
- Standard security practices apply (short expiry, HTTPS only)

---

_Add new decisions above this line_
