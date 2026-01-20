# Venue CSV Upload Feature - Implementation Plan

## Overview
Add the ability to bulk upload venues via CSV file, with a downloadable template and clear instructions for users.

## User Stories
1. As a user, I want to download a CSV template so I can fill in venue data offline
2. As a user, I want to upload a CSV file with multiple venues so I can add them in bulk
3. As a user, I want to see validation errors if my CSV has issues so I can fix them
4. As a user, I want to manually add a single venue through a form as an alternative

## Features to Implement

### 1. CSV Template Download
- Provide a downloadable CSV template with:
  - Header row with all required/optional fields
  - Example row showing sample data
  - Comments/instructions (if supported by CSV viewer)

### 2. CSV Upload Endpoint
- Accept CSV file upload
- Validate CSV structure and data
- Parse and create venues in bulk
- Return success/error report

### 3. Manual Venue Creation Form
- Modal/page with form for single venue entry
- All fields from VenueCreate schema
- Real-time validation
- Success/error feedback

### 4. UI Components
- Upload button in Venue Gallery
- Drag-and-drop CSV upload area
- Template download link
- Progress indicator during upload
- Results summary (X venues created, Y errors)

## CSV Template Structure

```csv
name,city,capacity,facilities,event_types,contact_email,contact_phone,website,address,description_template,notes
"Example Venue","Brussels",200,"WiFi,Projector,Catering","Conference,Workshop","contact@venue.com","+32 2 123 4567","https://venue.com","123 Main St, Brussels","A beautiful venue in the heart of Brussels","Parking available"
```

### Field Specifications

| Field | Required | Type | Format | Example |
|-------|----------|------|--------|---------|
| name | Yes | String | Max 255 chars | "Grand Hotel Brussels" |
| city | Yes | String | Max 100 chars | "Brussels" |
| capacity | Yes | Integer | > 0 | 200 |
| facilities | No | Array | Comma-separated | "WiFi,Projector,Catering" |
| event_types | No | Array | Comma-separated | "Conference,Workshop" |
| contact_email | No | Email | Valid email | "contact@venue.com" |
| contact_phone | No | String | Max 50 chars | "+32 2 123 4567" |
| website | No | URL | Max 500 chars | "https://venue.com" |
| address | No | Text | Any length | "123 Main St, Brussels" |
| description_template | No | Text | Any length | "A beautiful venue..." |
| notes | No | Text | Any length | "Parking available" |

## Implementation Steps

### Phase 1: Backend - CSV Processing

#### 1.1 Create CSV Schema
**File**: `backend/app/schemas/venue.py`
- Add `VenueCSVRow` schema for CSV validation
- Add `VenueUploadResult` schema for response

#### 1.2 Create CSV Service
**File**: `backend/app/services/csv_service.py`
- Parse CSV file
- Validate each row
- Convert to VenueCreate objects
- Handle errors gracefully

#### 1.3 Add Upload Endpoint
**File**: `backend/app/api/venues.py`
- POST `/venues/upload-csv` endpoint
- Accept multipart/form-data with CSV file
- Return upload results with success/error counts

#### 1.4 Add Template Endpoint
**File**: `backend/app/api/venues.py`
- GET `/venues/csv-template` endpoint
- Return CSV template file with headers and example

### Phase 2: Frontend - UI Components

#### 2.1 Create Upload Modal
**File**: `frontend/src/components/venues/VenueUploadModal.tsx`
- Drag-and-drop zone
- File input
- Template download link
- Upload progress
- Results display

#### 2.2 Create Manual Entry Form
**File**: `frontend/src/components/venues/VenueCreateForm.tsx`
- Form with all venue fields
- Validation
- Submit handler

#### 2.3 Update Venue Gallery
**File**: `frontend/app.js`
- Add "Upload CSV" button
- Add "Add Venue" button
- Wire up modals

### Phase 3: Testing & Documentation

#### 3.1 Backend Tests
- Test CSV parsing with valid data
- Test CSV validation with invalid data
- Test bulk creation
- Test error handling

#### 3.2 Frontend Tests
- Test file upload
- Test form validation
- Test success/error states

#### 3.3 Documentation
- Update API docs
- Create user guide for CSV upload
- Document CSV format requirements

## Files to Create/Modify

### Backend
- [ ] `backend/app/schemas/venue.py` - Add CSV schemas
- [ ] `backend/app/services/csv_service.py` - New CSV processing service
- [ ] `backend/app/api/venues.py` - Add upload and template endpoints
- [ ] `backend/tests/unit/test_csv_service.py` - Unit tests
- [ ] `backend/tests/integration/test_venue_upload.py` - Integration tests

### Frontend
- [ ] `frontend/src/components/venues/VenueUploadModal.tsx` - Upload UI (if using React)
- [ ] `frontend/src/components/venues/VenueCreateForm.tsx` - Manual entry form (if using React)
- [ ] `frontend/app.js` - Update venue gallery view
- [ ] `frontend/style.css` - Add upload component styles

### Assets
- [ ] `backend/app/static/venue_template.csv` - Template file

## API Endpoints

### POST /api/venues/upload-csv
Upload CSV file with venues

**Request**:
```
Content-Type: multipart/form-data
file: <CSV file>
```

**Response**:
```json
{
  "total_rows": 10,
  "successful": 8,
  "failed": 2,
  "created_venues": [
    {
      "id": "uuid",
      "name": "Venue Name",
      "city": "Brussels"
    }
  ],
  "errors": [
    {
      "row": 3,
      "field": "capacity",
      "message": "Capacity must be greater than 0"
    }
  ]
}
```

### GET /api/venues/csv-template
Download CSV template

**Response**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="venue_template.csv"

<CSV template content>
```

## Validation Rules

### CSV File
- Must be valid CSV format
- Must have header row
- Max file size: 5MB
- Max rows: 1000

### Per Row
- Name: Required, 1-255 characters
- City: Required, 1-100 characters
- Capacity: Required, integer > 0
- Email: Valid email format (if provided)
- Website: Valid URL format (if provided)
- Arrays: Comma-separated, trimmed

## Error Handling

### CSV Parsing Errors
- Invalid CSV format → 400 Bad Request
- Missing required headers → 400 Bad Request
- File too large → 413 Payload Too Large
- Too many rows → 400 Bad Request

### Row Validation Errors
- Collect all errors
- Continue processing other rows
- Return summary with errors

### Database Errors
- Duplicate venue names → Warning, skip row
- Database connection error → 500 Internal Server Error
- Transaction rollback on critical errors

## UI/UX Considerations

### Upload Flow
1. User clicks "Upload CSV" button
2. Modal opens with drag-and-drop zone
3. User downloads template (optional)
4. User selects/drops CSV file
5. File uploads with progress indicator
6. Results displayed:
   - Success: "8 venues created successfully"
   - Partial: "8 created, 2 failed. See errors below."
   - Failure: "Upload failed. See errors below."
7. User can download error report or close modal

### Manual Entry Flow
1. User clicks "Add Venue" button
2. Modal/page opens with form
3. User fills in fields
4. Real-time validation feedback
5. Submit button enabled when valid
6. Success message and venue appears in gallery

### Visual Design
- Use QED brand colors (green for success, red for errors)
- Pill-shaped buttons
- Card-based layout for upload zone
- Clear typography and spacing
- Loading states with spinners
- Error messages in red with icons

## Success Criteria

- [ ] Users can download a CSV template
- [ ] Users can upload a valid CSV and create multiple venues
- [ ] Validation errors are clearly displayed
- [ ] Users can manually add a single venue
- [ ] Upload progress is visible
- [ ] Results summary is clear and actionable
- [ ] All tests pass
- [ ] API documentation is updated

## Future Enhancements

- Support for updating existing venues via CSV
- Photo URLs in CSV (download and attach photos)
- Async processing for large files (job queue)
- Email notification when upload completes
- CSV export of existing venues
- Duplicate detection and merge suggestions

---

**Status**: Ready for Implementation  
**Priority**: High  
**Estimated Effort**: 8-12 hours
