# Project Context

## Project Identity

| Property | Value |
|----------|-------|
| **Name** | Venue Mapping AI |
| **Client** | QED Event Management |
| **Repository** | TBD (internal) |
| **Domain** | Event venue sourcing and proposal generation |

## One-Sentence Summary

A web application that helps QED event managers find venues, track outreach, collect pricing, and generate polished client-facing PDF proposals — replacing scattered spreadsheets and manual formatting.

## Background

QED is an event management company handling approximately 5 corporate events per month, primarily in Brussels for European associations. Their current workflow involves:

1. Searching through a Google Sheet of venues, filtering by memory
2. Losing track of which venues were contacted and their response status
3. Writing similar venue descriptions from scratch for every proposal
4. Spending hours formatting the same PDF layout repeatedly
5. Having no central record of past projects, pricing history, or venue performance

This application centralizes the entire venue sourcing workflow into a single tool. Event managers can create projects, search the venue database, track outreach status, record responses, generate AI-written content, and export branded PDF proposals.

The target users are QED event coordinators who need to move quickly but produce professional, polished client deliverables. The system must be simple enough to adopt immediately while providing significant time savings.

## Current Phase

| Property | Value |
|----------|-------|
| **Phase** | MVP Development |
| **Focus** | Core functionality - venue CRUD, project management, outreach tracking, PDF generation |
| **Target Users** | QED event managers (internal tool) |
| **Timeline** | MVP first, AI features second, polish third |

## MVP Scope (Phase 1)

- User authentication (simple email/password)
- Venue database (CRUD + photos)
- Project creation and management
- Add venues to project
- Outreach status tracking
- Record venue responses (manual entry)
- PDF generation (basic template)

## Future Phases

**Phase 2 - AI Enhancement:**
- AI-generated inquiry emails
- AI-generated venue descriptions
- AI-suggested pros/cons

**Phase 3 - Polish & Scale:**
- Activity logging
- Catering provider management
- Advanced PDF customization
- Email integration (send from app)
- Historical analytics

## Key Stakeholders

| Role | Context |
|------|---------|
| Event Managers | Primary users, create projects, manage venue outreach |
| Admin | Manages venue database, user accounts |
| Clients | Receive the PDF proposals (external, never access the system) |

## Important Constraints

1. **All users can view/edit all projects** — no ownership restrictions, activity logged for accountability
2. **English only for MVP** — multi-language support is explicitly out of scope
3. **Brussels-focused** — most venues are in Brussels for European associations
4. **Internal tool** — not a public venue directory, no SEO requirements
5. **Professional output** — PDF quality must match or exceed current manual output
