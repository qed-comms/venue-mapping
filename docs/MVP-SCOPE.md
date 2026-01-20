# MVP Scope (Phase 1) - Venue Mapping AI

## Overview
This document defines the **Minimum Viable Product (MVP)** scope for the Venue Mapping AI platform. The MVP focuses on the core workflow: Create project → Find venues → Track outreach → Record responses → Generate PDF.

## In-Scope Features

### 1. User Authentication
- Simple email/password login
- Two roles:
  - **Event Manager**: Full project access
  - **Admin**: Full access + settings
- JWT-based authentication with bcrypt password hashing

### 2. Venue Database (CRUD + Photos)
- **List all venues** with search and filtering:
  - Filter by city
  - Filter by capacity
  - Filter by facilities
  - Filter by event types
- **Add/edit venue details**:
  - Name, address, city
  - Capacity, contact info, website
  - Facilities (multi-select)
  - Event types (multi-select)
  - Description template
  - Internal notes
- **Upload multiple photos** per venue:
  - Photo captions
  - Photo ordering
- **Soft delete venues** (preserve for historical projects)

### 3. Project Creation & Management
- **Create project** with:
  - Client name
  - Event name
  - Date range (start/end)
  - Attendee count
  - Budget (optional)
  - Location preference
  - Requirements
- **Project statuses**: Active, Completed, Cancelled
- **Dashboard** showing all projects with:
  - Status indicators
  - Quick stats (venues contacted, responded, included)
- **Search/filter projects** by:
  - Status
  - Client name
  - Event name

### 4. Add Venues to Project
- Search venue database filtered by project requirements
- Add venues to a project (creates ProjectVenue junction record)
- Prevent duplicate venues in same project
- View toggle: Cards vs List view

### 5. Outreach Status Tracking
- Track status per venue:
  - **Draft** → **Sent** → **Awaiting** → **Responded** → **Included** or **Declined**
- Visual status badges throughout the UI
- Log timestamp when marked as sent

### 6. Record Venue Responses (Manual Entry)
When marking as "Responded", capture:
- Available? (Yes/No)
- Available dates (free text)
- Quoted price
- Room allocation notes
- Catering details
- Notes

Mark venues as:
- "Include in Proposal"
- "Declined"

### 7. PDF Generation (Basic Template)
Generate downloadable PDF proposals with:
- **Cover page**:
  - QED logo
  - Event name
  - Dates
  - Attendee count
  - VAT disclaimer
- **Venue pages**:
  - Header bar with name + dates
  - 2-4 photos
  - Location
  - Description
  - Pros/cons
- **Pricing pages**:
  - Room tables
  - Catering
  - Totals
- **Status page**:
  - "Waiting for answers from" list
  - "Declined" list

## Explicitly OUT of MVP Scope

### Phase 2 Features (Not in MVP)
- AI-generated content (venue descriptions, inquiry emails)
- Email integration
- Advanced search/filtering

### Phase 3 Features (Not in MVP)
- **Activity logging** (audit trail)
- **Analytics/reporting** (dashboards, charts, metrics)
- **Availability calendar/management system**
- Catering provider management
- Payment processing
- Contract management
- Attendee registration
- Multi-language support

## Technical Constraints

### MVP Tech Stack
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **PDF Generation**: WeasyPrint
- **Authentication**: JWT tokens with bcrypt

### Database Schema
The MVP uses the following core models:
- `User` (authentication)
- `Venue` (venue database)
- `VenuePhoto` (venue images)
- `Project` (event projects)
- `ProjectVenue` (junction table with outreach tracking)

### API Endpoints
All endpoints follow RESTful conventions with pagination support:
- `/api/v1/auth/*` - Authentication
- `/api/v1/venues/*` - Venue CRUD
- `/api/v1/projects/*` - Project CRUD
- `/api/v1/projects/{id}/venues/*` - Project-venue association

## Success Criteria

The MVP is considered complete when:
1. ✅ Users can log in and manage their account
2. ✅ Users can create and manage a venue database with photos
3. ✅ Users can create projects and add venues to them
4. ✅ Users can track outreach status for each venue
5. ✅ Users can manually record venue responses
6. ✅ Users can generate a professional PDF proposal
7. ✅ All core workflows are tested and bug-free

## Next Steps After MVP

After MVP completion, development will proceed to:
- **Phase 2**: AI content generation (Claude API integration)
- **Phase 3**: Analytics, activity logging, advanced features
