# Domain Glossary

## Core Entities

### User

- **Definition**: A person who can log into the system and perform actions
- **Code Representation**: `User` model, `users` table
- **Key Attributes**:
  - `name`: Display name
  - `email`: Login identifier (unique)
  - `role`: Either `event_manager` or `admin`
  - `signature_block`: Email signature used in generated inquiry emails
- **Relationships**: Creates Projects, recorded in ActivityLogs
- **Business Rules**: All users can view/edit all projects (no ownership restrictions)

### Venue

- **Definition**: A physical location that can host events
- **Code Representation**: `Venue` model, `venues` table
- **Key Attributes**:
  - `name`: Venue name (e.g., "Event Lounge")
  - `city`: Location city (e.g., "Brussels")
  - `capacity`: Maximum attendees
  - `facilities`: Array of features (e.g., `["Wi-Fi", "AV equipment", "Parking"]`)
  - `event_types`: Array of supported event types (e.g., `["Conferences", "Gala dinners"]`)
  - `contact_email`: Primary contact for inquiries
  - `description_template`: Base description for AI to enhance
- **Relationships**: Has many Photos, included in many Projects via ProjectVenue
- **Business Rules**: Soft delete only (preserve for historical projects)

### Photo

- **Definition**: An image associated with a venue
- **Code Representation**: `Photo` model, `photos` table
- **Key Attributes**:
  - `url`: Cloud storage URL
  - `caption`: Optional description (e.g., "Main Hall")
  - `display_order`: Determines order in UI and PDF (0 = primary)
- **Relationships**: Belongs to one Venue
- **Business Rules**: 2-4 photos typically shown per venue in PDF

### Project

- **Definition**: An event sourcing effort for a specific client event
- **Code Representation**: `Project` model, `projects` table
- **Key Attributes**:
  - `client_name`: The organization hosting the event (e.g., "CEMA")
  - `event_name`: The event title (e.g., "CEMA 2025 Annual Conference")
  - `event_date_start` / `event_date_end`: Event date range
  - `attendee_count`: Expected number of participants
  - `budget`: Optional budget in EUR
  - `location_preference`: Preferred city/area (e.g., "Brussels")
  - `requirements`: Array of needs (e.g., `["Plenary room", "Breakout room", "Exhibition space"]`)
  - `status`: One of `active`, `completed`, `cancelled`
- **Relationships**: Created by User, contains many ProjectVenues, has many ActivityLogs
- **Business Rules**: Status progresses from active → completed OR cancelled

### ProjectVenue

- **Definition**: A junction connecting a venue to a project, tracking outreach and response
- **Code Representation**: `ProjectVenue` model, `project_venues` table
- **Key Attributes**:
  - `outreach_status`: Current communication status (see Outreach Workflow)
  - `availability_dates`: Dates the venue is available (e.g., "23/06 to 26/06")
  - `is_available`: Whether the venue confirmed availability
  - `quoted_price`: Total price quoted by venue in EUR
  - `room_allocation`: How rooms map to event needs (e.g., "Studio = Plenary")
  - `catering_description`: Catering details for PDF
  - `pros` / `cons`: Advantages and disadvantages
  - `ai_description`: AI-generated venue description
  - `final_description`: User-approved description for PDF
  - `include_in_proposal`: Whether to include in PDF output
- **Relationships**: Belongs to one Project, belongs to one Venue, optionally links to CateringProvider
- **Business Rules**: Unique constraint on (project_id, venue_id)

### CateringProvider

- **Definition**: An external catering company that can be linked to venue proposals
- **Code Representation**: `CateringProvider` model, `catering_providers` table
- **Key Attributes**:
  - `name`: Provider name
  - `price_per_person`: Base rate in EUR
  - `menu_options`: JSON structure with package details
- **Relationships**: Can be linked to many ProjectVenues
- **Business Rules**: Soft delete via `is_active` flag

### ActivityLog

- **Definition**: An audit trail entry recording actions taken on a project
- **Code Representation**: `ActivityLog` model, `activity_logs` table
- **Key Attributes**:
  - `action`: Type of action (see Action Types below)
  - `details`: JSON with additional context
- **Relationships**: Belongs to Project, recorded by User
- **Business Rules**: Insert-only, never updated or deleted

## Business Processes

### Project Lifecycle

```
1. CREATE PROJECT
   ↓ Event manager enters client name, dates, requirements
2. FIND VENUES
   ↓ Filter by city, capacity, facilities
3. OUTREACH & TRACK
   ↓ Contact venues, track responses
4. COLLECT RESPONSES
   ↓ Record availability, pricing, room details
5. FINALIZE CONTENT
   ↓ Generate/edit descriptions, add pros/cons
6. GENERATE PDF
   ↓ Export branded proposal
7. CLOSE PROJECT
   → Mark completed or cancelled
```

### Outreach Workflow

The `outreach_status` field tracks communication with each venue:

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `draft` | Venue added but not yet contacted | Generate inquiry email, mark as sent |
| `sent` | Inquiry email was sent | Wait for response |
| `awaiting` | Waiting for venue response | Follow up or mark as responded/declined |
| `responded` | Venue has responded with info | Enter response data, include or decline |
| `declined` | Venue unavailable or rejected | No further action |

**Status Transitions:**
```
draft → sent → awaiting → responded
                       ↘ declined
```

### PDF Generation Process

1. **Trigger**: User clicks "Generate PDF" on project
2. **Data Collection**: 
   - Gather all ProjectVenues where `include_in_proposal = true`
   - Load venue details and photos
   - Get awaiting/declined venues for status section
3. **Content Assembly**:
   - Use `final_description` if set, else `ai_description`
   - Format pricing data
   - Apply QED branding
4. **Render**: HTML template → WeasyPrint → PDF file
5. **Output**: PDF available for download

### AI Content Generation

**Inquiry Email**:
- Input: Project details + Venue details + User signature
- Output: Professional email requesting availability and pricing

**Venue Description**:
- Input: Venue data (name, facilities, notes) + Project context (requirements, attendee count)
- Output: 2-3 paragraph description highlighting relevant features

## Domain-Specific Terms

| Term | Definition | Example |
|------|------------|---------|
| **Plenary** | Main session room for all attendees | "The plenary will be in the Grand Hall" |
| **Breakout room** | Smaller room for parallel sessions | "We need 3 breakout rooms for workshops" |
| **Exhibition space** | Area for sponsor booths/displays | "Exhibition space in the foyer" |
| **Room allocation** | How venue spaces map to event needs | "Studio = Plenary, Aquarium = Breakout" |
| **Outreach** | Process of contacting venues | "Start outreach to shortlisted venues" |
| **Proposal** | PDF document sent to client with venue options | "Generate the proposal for CEMA" |
| **Quote** | Price provided by venue | "Waiting for quotes from 3 venues" |
| **VAT** | Value Added Tax (excluded from prices) | "All prices excluding VAT" |

## Acronyms & Abbreviations

| Acronym | Expansion | Context |
|---------|-----------|---------|
| QED | QED Event Management | The client company |
| EU | European Union | Most clients are EU associations |
| AV | Audio-Visual | Equipment for presentations |
| F&B | Food and Beverage | Catering services |
| pax | Persons / Attendees | "Capacity: 150 pax" |
| EUR / € | Euros | All prices in EUR |

## User Roles & Permissions

| Role | Description | Can Do | Cannot Do |
|------|-------------|--------|-----------|
| `event_manager` | Primary system user | Create/edit projects, manage venues, generate PDFs, all standard operations | Manage users, access admin settings |
| `admin` | System administrator | Everything event_manager can do + manage users, edit venue database settings | N/A (full access) |

**Note**: All users can view and edit ALL projects regardless of who created them. This is by design for a small team where everyone needs visibility.

## Activity Log Action Types

| Action | Description | Details Payload |
|--------|-------------|-----------------|
| `project_created` | New project created | `{client_name, event_name}` |
| `project_updated` | Project details changed | `{changed_fields}` |
| `project_status_changed` | Status changed | `{old_status, new_status}` |
| `venue_added` | Venue added to project | `{venue_id, venue_name}` |
| `venue_removed` | Venue removed from project | `{venue_id, venue_name}` |
| `outreach_status_changed` | Outreach status updated | `{venue_id, old_status, new_status}` |
| `response_recorded` | Venue response entered | `{venue_id, is_available, quoted_price}` |
| `description_generated` | AI description created | `{venue_id}` |
| `description_edited` | Description manually edited | `{venue_id}` |
| `pdf_generated` | PDF proposal generated | `{venues_included}` |

## Standard Facilities

Common values for the `facilities` array:

- Wi-Fi
- AV equipment
- Catering
- Parking
- Wheelchair accessible
- Outdoor space
- Industrial aesthetic
- Historic building
- Central location
- Accommodation
- Press facilities
- Natural lighting
- Air conditioning
- Stage/Platform

## Standard Event Types

Common values for the `event_types` array:

- Conferences
- Gala dinners
- Seminars
- Receptions
- Corporate events
- Exhibitions
- Award ceremonies
- Product launches
- Weddings
- Press events
- Workshops
- Board meetings
- Networking events

## Standard Requirements

Common values for project `requirements` array:

- Plenary room
- Breakout room
- Exhibition space
- Outdoor space
- Dinner venue
- Cocktail area
- Registration desk
- VIP room
- Press room
- Technical rehearsal space
