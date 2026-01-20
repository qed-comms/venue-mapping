# Venue Mapping AI — Project Status

> **Last Updated**: [Date]  
> **Updated By**: [Agent/Human]

---

## Current State

### What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| User authentication | 🔴 Not Started | Email/password login |
| Venue database (CRUD) | 🔴 Not Started | Create, read, update, soft delete |
| Photo uploads | 🔴 Not Started | Multiple photos per venue |
| Project creation | 🔴 Not Started | Event details, requirements |
| Add venues to project | 🔴 Not Started | Search and add from database |
| Outreach tracking | 🔴 Not Started | Status workflow |
| Record responses | 🔴 Not Started | Pricing, availability |
| PDF generation | 🔴 Not Started | Branded proposal export |
| AI inquiry emails | 🔴 Not Started | Phase 2 |
| AI descriptions | 🔴 Not Started | Phase 2 |
| Activity logging | 🔴 Not Started | Phase 3 |

**Legend**: 🟢 Complete | 🟡 In Progress | 🔴 Not Started | ⚪ Blocked

### What's In Progress

_None currently_

### What's Blocked

_None currently_

---

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   FastAPI       │────▶│   PostgreSQL    │
│   (Vite)        │◀────│   Backend       │◀────│   Database      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                     ┌───────────┼───────────┐
                     ▼           ▼           ▼
               ┌─────────┐ ┌─────────┐ ┌─────────┐
               │ Claude  │ │   S3    │ │WeasyPrint│
               │  API    │ │ Storage │ │  (PDF)  │
               └─────────┘ └─────────┘ └─────────┘
```

---

## Database Schema Summary

### Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | System users | 🔴 |
| `venues` | Venue database | 🔴 |
| `photos` | Venue images | 🔴 |
| `catering_providers` | External caterers | 🔴 |
| `projects` | Event projects | 🔴 |
| `project_venues` | Project-venue junction | 🔴 |
| `activity_logs` | Audit trail | 🔴 |

### Key Relationships

- User → creates → Projects
- Venue → has many → Photos
- Project → has many → ProjectVenues → links to → Venue
- ProjectVenue → optionally links to → CateringProvider

---

## API Endpoints

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| **Auth** |
| POST | `/api/v1/auth/login` | User login | 🔴 |
| POST | `/api/v1/auth/logout` | User logout | 🔴 |
| GET | `/api/v1/auth/me` | Current user | 🔴 |
| **Venues** |
| GET | `/api/v1/venues` | List venues | 🔴 |
| POST | `/api/v1/venues` | Create venue | 🔴 |
| GET | `/api/v1/venues/{id}` | Get venue | 🔴 |
| PATCH | `/api/v1/venues/{id}` | Update venue | 🔴 |
| DELETE | `/api/v1/venues/{id}` | Delete venue | 🔴 |
| POST | `/api/v1/venues/{id}/photos` | Upload photos | 🔴 |
| **Projects** |
| GET | `/api/v1/projects` | List projects | 🔴 |
| POST | `/api/v1/projects` | Create project | 🔴 |
| GET | `/api/v1/projects/{id}` | Get project | 🔴 |
| PATCH | `/api/v1/projects/{id}` | Update project | 🔴 |
| DELETE | `/api/v1/projects/{id}` | Delete project | 🔴 |
| GET | `/api/v1/projects/{id}/pdf` | Generate PDF | 🔴 |
| **Project Venues** |
| POST | `/api/v1/projects/{id}/venues` | Add venue | 🔴 |
| DELETE | `/api/v1/projects/{id}/venues/{venue_id}` | Remove venue | 🔴 |
| PATCH | `/api/v1/projects/{id}/venues/{venue_id}` | Update status | 🔴 |
| **AI** |
| POST | `/api/v1/ai/inquiry-email` | Generate email | 🔴 |
| POST | `/api/v1/ai/venue-description` | Generate description | 🔴 |
| POST | `/api/v1/ai/pros-cons` | Generate pros/cons | 🔴 |

---

## Environment Variables

| Variable | Purpose | Required | Set |
|----------|---------|----------|-----|
| `DATABASE_URL` | PostgreSQL connection | Yes | ☐ |
| `SECRET_KEY` | JWT signing | Yes | ☐ |
| `S3_BUCKET` | Photo storage bucket | Yes | ☐ |
| `S3_ENDPOINT` | S3 endpoint URL | Yes | ☐ |
| `S3_ACCESS_KEY` | S3 access key | Yes | ☐ |
| `S3_SECRET_KEY` | S3 secret key | Yes | ☐ |
| `ANTHROPIC_API_KEY` | Claude API | Phase 2 | ☐ |

---

## Known Issues

_None currently_

---

## Technical Debt

- [ ] _None recorded yet_

---

## Recent Changes

| Date | Change | By |
|------|--------|-----|
| _Project initialized_ | | |

---

## Next Steps

1. Set up development environment
2. Create database schema and run migrations
3. Implement user authentication
4. Build venue CRUD endpoints
5. Build project management endpoints
6. Implement PDF generation
7. Add AI content features
