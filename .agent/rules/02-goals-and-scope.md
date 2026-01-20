# Goals and Scope

## Primary Objectives

1. **Reduce proposal creation time** from 3+ hours to under 30 minutes
2. **Centralize venue tracking** — 100% of venues tracked in-app vs scattered spreadsheets
3. **Ensure user adoption** — all QED event managers using within 1 month of launch
4. **Maintain quality** — PDF output matches or exceeds current manual output

## Success Criteria

- [ ] Event manager can create a project and add venues in under 5 minutes
- [ ] Outreach status for all venues is visible at a glance
- [ ] Response data (pricing, availability) is captured in structured fields
- [ ] PDF proposal generates with correct branding, photos, and pricing
- [ ] All project activity is logged for accountability
- [ ] Venue database is searchable by city, capacity, and facilities

## In Scope

### Core Features (MVP)
- User authentication (email/password login)
- Venue database management (CRUD operations)
- Photo upload and management for venues
- Project creation with event requirements
- Adding/removing venues from projects
- Outreach status tracking (Draft → Sent → Awaiting → Responded → Declined)
- Recording venue responses (availability, pricing, room allocation)
- PDF proposal generation with QED branding
- Activity logging for audit trail

### AI Features (Phase 2)
- AI-generated inquiry emails
- AI-generated venue descriptions for proposals
- AI-suggested pros/cons based on venue data

### Enhanced Features (Phase 3)
- Catering provider management
- Email integration (send directly from app)
- Historical analytics (pricing trends, venue usage)
- Advanced PDF customization

## Explicitly Out of Scope

These features are **NOT** part of this project:

| Feature | Reason |
|---------|--------|
| Payment processing | Invoicing handled separately |
| Contract management / e-signatures | Out of workflow scope |
| Attendee registration | Different system |
| Calendar integration | Beyond storing event dates |
| Public venue directory / SEO | Internal tool only |
| Venue booking confirmation workflows | Manual process retained |
| Multi-language support | English only for MVP |
| Mobile-native app | Web responsive is sufficient |

## Constraints

### Technical Constraints
- Must use PostgreSQL for relational data
- Must generate PDF that matches existing QED proposal format
- Must support photo uploads to cloud storage
- Authentication must be simple but secure

### Business Constraints
- **Timeline**: MVP needed for active use
- **Users**: Small team (~5 event managers) — no need for complex permissions
- **Budget**: Standard cloud hosting, no expensive enterprise services

### Data Constraints
- Initial venue data will be imported from existing Google Sheet (~50 venues)
- Photos must be stored in cloud storage (not database BLOBs)
- All prices in EUR, no multi-currency support needed

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Page load under 2 seconds, PDF generation under 10 seconds |
| **Scale** | Support 5 concurrent users, 500 venues, 100 active projects |
| **Security** | Password hashing, session management, no sensitive data exposure |
| **Availability** | Standard web hosting uptime, no 24/7 SLA required |
| **Accessibility** | Basic accessibility (semantic HTML, keyboard navigation) |
| **Browser Support** | Modern browsers (Chrome, Firefox, Safari, Edge) |
| **Mobile** | Responsive design, works on tablet for on-site visits |
