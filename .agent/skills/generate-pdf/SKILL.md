---
name: generate-pdf
description: Generates branded venue proposal PDFs using WeasyPrint. Use when working on PDF generation, proposal templates, or export functionality.
---

# PDF Generation Skill

## Overview

The Venue Mapping AI generates branded PDF proposals using WeasyPrint (HTML/CSS → PDF). This skill covers the PDF structure, styling rules based on QED brand guidelines, and implementation patterns.

## PDF Structure

The proposal PDF has four sections:

```
┌────────────────────────────────────────────────┐
│                 1. COVER PAGE                   │
│  - QED logo, event name, dates, attendees      │
│  - "All prices excluding VAT" disclaimer       │
├────────────────────────────────────────────────┤
│              2. VENUE PAGES                     │
│  For each included venue:                      │
│  - Header bar with name + availability dates   │
│  - Photos (2-4 images)                         │
│  - Location line                               │
│  - Description paragraph                       │
│  - Pros/Cons box                               │
├────────────────────────────────────────────────┤
│              3. PRICING PAGES                   │
│  For each included venue:                      │
│  - Venue name header                           │
│  - Meeting rooms table                         │
│  - Catering description                        │
│  - Total price                                 │
├────────────────────────────────────────────────┤
│              4. STATUS PAGE                     │
│  - "Waiting for answers from:" list            │
│  - "Venues checked and declined:" list         │
└────────────────────────────────────────────────┘
```

## Brand Colors

```css
:root {
  /* Primary */
  --qed-dark-blue: #1B2B4B;
  --qed-blue: #2E4A7D;
  --qed-green: #2EC4A0;
  
  /* Accents */
  --qed-ciel: #3B9FD8;
  --qed-turquoise: #2AA89A;
  --qed-red: #E85A5A;
  --qed-orange: #E8944A;
  
  /* Neutrals */
  --qed-dark-grey: #4A5568;
  --qed-light-grey: #E2E8F0;
  --qed-background: #F7FAFC;
  --qed-white: #FFFFFF;
}
```

## Typography

- **Font**: Inter (with system fallbacks)
- **Venue name (header)**: 18pt, Bold, White on dark blue
- **Section heading**: 14pt, Semibold, Dark Blue
- **Body text**: 11pt, Regular, Dark Grey
- **Caption/small**: 9pt, Regular, Medium Grey
- **Price numbers**: 12pt, Semibold, Dark Grey
- **Total price**: 14pt, Bold, White on green

## Page Setup

```css
@page {
  size: A4;
  margin: 20mm 25mm;
}

@page :first {
  margin: 0;  /* Cover page is full bleed */
}
```

---

## Implementation

### Service Structure

```python
# backend/app/services/pdf_generator.py
from pathlib import Path
from typing import Optional
from uuid import UUID
import io

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.project_venue import ProjectVenue
from app.models.enums import OutreachStatus


class PDFGenerator:
    """Generates branded venue proposal PDFs."""
    
    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates" / "proposal"
        self.env = Environment(loader=FileSystemLoader(template_dir))
        self.base_css = self._load_base_css()
    
    def _load_base_css(self) -> str:
        """Load the base PDF stylesheet."""
        css_path = Path(__file__).parent.parent / "templates" / "proposal" / "styles.css"
        return css_path.read_text()
    
    async def generate_proposal(
        self,
        db: AsyncSession,
        project: Project,
    ) -> bytes:
        """Generate a complete proposal PDF for a project.
        
        Args:
            db: Database session
            project: The project to generate proposal for
            
        Returns:
            PDF file as bytes
        """
        # Get venue data
        included_venues = [
            pv for pv in project.project_venues 
            if pv.include_in_proposal
        ]
        awaiting_venues = [
            pv for pv in project.project_venues
            if pv.outreach_status == OutreachStatus.AWAITING
        ]
        declined_venues = [
            pv for pv in project.project_venues
            if pv.outreach_status == OutreachStatus.DECLINED
        ]
        
        # Render HTML
        template = self.env.get_template("proposal.html")
        html_content = template.render(
            project=project,
            included_venues=included_venues,
            awaiting_venues=awaiting_venues,
            declined_venues=declined_venues,
        )
        
        # Generate PDF
        html = HTML(string=html_content)
        css = CSS(string=self.base_css)
        
        pdf_buffer = io.BytesIO()
        html.write_pdf(pdf_buffer, stylesheets=[css])
        
        return pdf_buffer.getvalue()


pdf_generator = PDFGenerator()
```

### HTML Template Structure

```html
<!-- backend/app/templates/proposal/proposal.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ project.event_name }} - Venue Proposal</title>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-content">
      <img src="data:image/svg+xml,..." alt="QED" class="logo">
      
      <div class="cover-divider"></div>
      
      <p class="cover-subtitle">Brief presentation of possible venues</p>
      
      <div class="cover-divider"></div>
      
      <h1 class="cover-title">{{ project.event_name }}</h1>
      <p class="cover-date">{{ project.event_date_range }}</p>
      <p class="cover-attendees">{{ project.attendee_count }} attendees</p>
      
      <div class="cover-divider"></div>
      
      <p class="cover-disclaimer">All prices are excluding VAT</p>
    </div>
  </div>
  
  <!-- Venue Pages -->
  {% for pv in included_venues %}
  <div class="venue-page">
    <!-- Header Bar -->
    <div class="venue-header">
      <span class="venue-name">{{ pv.venue.name }}</span>
      {% if pv.availability_dates %}
      <span class="venue-dates">{{ pv.availability_dates }}</span>
      {% endif %}
    </div>
    
    <!-- Photos -->
    <div class="venue-photos">
      {% for photo in pv.venue.photos[:4] %}
      <img src="{{ photo.url }}" alt="{{ photo.caption or pv.venue.name }}" 
           class="venue-photo {% if loop.first %}venue-photo-primary{% endif %}">
      {% endfor %}
    </div>
    
    <!-- Location -->
    <p class="venue-location">
      <span class="icon">📍</span>
      {{ pv.venue.address }}, {{ pv.venue.city }}
    </p>
    
    <!-- Description -->
    <div class="venue-description">
      {{ pv.final_description or pv.ai_description or pv.venue.description_template }}
    </div>
    
    <!-- Pros/Cons -->
    {% if pv.pros or pv.cons %}
    <div class="pros-cons-box">
      <div class="pros-section">
        <h4 class="pros-title">PROS</h4>
        <p class="pros-content">{{ pv.pros }}</p>
      </div>
      <div class="cons-section">
        <h4 class="cons-title">CONS</h4>
        <p class="cons-content">{{ pv.cons }}</p>
      </div>
    </div>
    {% endif %}
  </div>
  {% endfor %}
  
  <!-- Pricing Pages -->
  {% for pv in included_venues %}
  <div class="pricing-page">
    <h2 class="pricing-venue-name">{{ pv.venue.name }}</h2>
    
    {% if pv.room_allocation %}
    <div class="pricing-section">
      <h3>Meeting Rooms</h3>
      <p>{{ pv.room_allocation }}</p>
    </div>
    {% endif %}
    
    {% if pv.catering_description %}
    <div class="pricing-section">
      <h3>Catering</h3>
      <p>{{ pv.catering_description }}</p>
    </div>
    {% endif %}
    
    {% if pv.quoted_price %}
    <div class="pricing-total">
      <span class="total-label">Total for event</span>
      <span class="total-amount">€{{ "{:,.2f}".format(pv.quoted_price) }}</span>
    </div>
    {% endif %}
  </div>
  {% endfor %}
  
  <!-- Status Page -->
  {% if awaiting_venues or declined_venues %}
  <div class="status-page">
    {% if awaiting_venues %}
    <div class="status-section">
      <h3>Waiting for answers from:</h3>
      <ul>
        {% for pv in awaiting_venues %}
        <li>{{ pv.venue.name }}</li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}
    
    {% if declined_venues %}
    <div class="status-section">
      <h3>Venues checked and declined:</h3>
      <ul>
        {% for pv in declined_venues %}
        <li>{{ pv.venue.name }}{% if pv.notes %} - {{ pv.notes }}{% endif %}</li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}
  </div>
  {% endif %}
  
  <!-- Footer (appears on all pages except cover) -->
  <div class="page-footer">
    QED Event Management | {{ project.event_name }} | 
    <span class="page-number"></span>
  </div>
</body>
</html>
```

### CSS Stylesheet

```css
/* backend/app/templates/proposal/styles.css */

/* ========== Page Setup ========== */
@page {
  size: A4;
  margin: 20mm 25mm 25mm 25mm;
  
  @bottom-center {
    content: "QED Event Management | " attr(data-event-name) " | Page " counter(page) " of " counter(pages);
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    color: #718096;
  }
}

@page :first {
  margin: 0;
  @bottom-center { content: none; }
}

/* ========== Base Styles ========== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #4A5568;
}

/* ========== Cover Page ========== */
.cover-page {
  page: cover;
  width: 210mm;
  height: 297mm;
  background-color: #1B2B4B;
  display: flex;
  align-items: center;
  justify-content: center;
  page-break-after: always;
}

.cover-content {
  text-align: center;
  color: #FFFFFF;
  padding: 40mm;
}

.cover-page .logo {
  width: 80px;
  height: auto;
  margin-bottom: 30px;
}

.cover-divider {
  width: 60%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 25px auto;
}

.cover-subtitle {
  font-size: 16pt;
  font-weight: 400;
  opacity: 0.9;
}

.cover-title {
  font-size: 28pt;
  font-weight: 700;
  margin-bottom: 15px;
}

.cover-date {
  font-size: 18pt;
  font-weight: 400;
  margin-bottom: 10px;
}

.cover-attendees {
  font-size: 14pt;
  opacity: 0.9;
}

.cover-disclaimer {
  font-size: 11pt;
  font-style: italic;
  opacity: 0.8;
}

/* ========== Venue Header Bar ========== */
.venue-header {
  background-color: #1B2B4B;
  color: #FFFFFF;
  padding: 12px 32px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.venue-name {
  font-size: 18pt;
  font-weight: 700;
}

.venue-dates {
  font-size: 14pt;
  font-weight: 400;
  opacity: 0.9;
}

/* ========== Venue Photos ========== */
.venue-photos {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto auto;
  gap: 12px;
  margin-bottom: 16px;
}

.venue-photo {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.venue-photo-primary {
  grid-row: span 2;
  height: 200px;
}

.venue-photo:not(.venue-photo-primary) {
  height: 94px;
}

/* ========== Venue Location ========== */
.venue-location {
  font-size: 13pt;
  color: #4A5568;
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.venue-location .icon {
  font-size: 14pt;
}

/* ========== Venue Description ========== */
.venue-description {
  font-size: 11pt;
  line-height: 1.7;
  color: #4A5568;
  margin: 16px 0;
}

/* ========== Pros/Cons Box ========== */
.pros-cons-box {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding: 16px;
  background-color: #F7FAFC;
  border-radius: 8px;
  border-left: 4px solid #2EC4A0;
}

.pros-section,
.cons-section {
  flex: 1;
}

.pros-title,
.cons-title {
  font-size: 12pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.pros-title {
  color: #047857;
}

.cons-title {
  color: #B91C1C;
}

.pros-content,
.cons-content {
  font-size: 11pt;
  color: #4A5568;
  line-height: 1.5;
}

/* ========== Pricing Page ========== */
.pricing-page {
  page-break-before: always;
}

.pricing-venue-name {
  font-size: 18pt;
  font-weight: 700;
  color: #1B2B4B;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E2E8F0;
}

.pricing-section {
  margin-bottom: 20px;
}

.pricing-section h3 {
  font-size: 14pt;
  font-weight: 600;
  color: #1B2B4B;
  margin-bottom: 8px;
}

.pricing-section p {
  font-size: 11pt;
  color: #4A5568;
}

/* Pricing Table */
.pricing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11pt;
  margin: 16px 0;
}

.pricing-table th {
  background-color: #1B2B4B;
  color: #FFFFFF;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
}

.pricing-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #E2E8F0;
}

.pricing-table tr:nth-child(even) {
  background-color: #F7FAFC;
}

/* Total Price Box */
.pricing-total {
  background-color: #2EC4A0;
  color: #FFFFFF;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.total-label {
  font-size: 14pt;
  font-weight: 600;
}

.total-amount {
  font-size: 18pt;
  font-weight: 700;
}

/* ========== Status Page ========== */
.status-page {
  page-break-before: always;
}

.status-section {
  margin-bottom: 32px;
}

.status-section h3 {
  font-size: 14pt;
  font-weight: 600;
  color: #1B2B4B;
  margin-bottom: 12px;
}

.status-section ul {
  list-style: none;
  padding-left: 0;
}

.status-section li {
  font-size: 11pt;
  color: #4A5568;
  padding: 8px 0;
  border-bottom: 1px solid #E2E8F0;
}

.status-section li:last-child {
  border-bottom: none;
}

/* ========== Page Breaks ========== */
.venue-page {
  page-break-after: always;
}

.venue-page:last-of-type {
  page-break-after: auto;
}

/* ========== Print-specific ========== */
@media print {
  .venue-header {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .cover-page {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .pricing-total {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

### API Endpoint

```python
# backend/app/api/projects.py (PDF generation endpoint)
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.pdf_generator import pdf_generator
from app.services.project_service import project_service
from app.services.activity_service import activity_service
from app.models.activity_log import ActivityLog

router = APIRouter()


@router.get("/{project_id}/pdf")
async def generate_project_pdf(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download the venue proposal PDF."""
    # Get project with related data
    project = await project_service.get_by_id_with_venues(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    
    # Check if there are venues to include
    included_count = sum(1 for pv in project.project_venues if pv.include_in_proposal)
    if included_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No venues marked for inclusion in proposal",
        )
    
    # Generate PDF
    pdf_bytes = await pdf_generator.generate_proposal(db, project)
    
    # Log activity
    await activity_service.log_action(
        db,
        project_id=project_id,
        user_id=current_user.id,
        action=ActivityLog.PDF_GENERATED,
        venues_included=included_count,
    )
    
    # Return as downloadable file
    filename = f"{project.client_name}_{project.event_name}_proposal.pdf".replace(" ", "_")
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
```

---

## Testing PDF Generation

```python
# backend/tests/unit/test_pdf_generator.py
import pytest
from unittest.mock import MagicMock, AsyncMock

from app.services.pdf_generator import pdf_generator
from app.models.project import Project
from app.models.venue import Venue
from app.models.project_venue import ProjectVenue
from app.models.enums import OutreachStatus


@pytest.fixture
def sample_project():
    """Create a sample project with venues for testing."""
    venue = MagicMock(spec=Venue)
    venue.name = "Test Venue"
    venue.address = "123 Test Street"
    venue.city = "Brussels"
    venue.photos = []
    
    project_venue = MagicMock(spec=ProjectVenue)
    project_venue.venue = venue
    project_venue.include_in_proposal = True
    project_venue.outreach_status = OutreachStatus.RESPONDED
    project_venue.availability_dates = "23/06 to 26/06"
    project_venue.final_description = "A great venue for events."
    project_venue.pros = "Central location"
    project_venue.cons = "Limited parking"
    project_venue.quoted_price = 15000.00
    
    project = MagicMock(spec=Project)
    project.client_name = "CEMA"
    project.event_name = "CEMA 2025"
    project.event_date_range = "23/06/2025 - 26/06/2025"
    project.attendee_count = 150
    project.project_venues = [project_venue]
    
    return project


@pytest.mark.asyncio
async def test_generate_proposal_returns_pdf_bytes(sample_project):
    """Test that PDF generation returns valid bytes."""
    db = AsyncMock()
    
    result = await pdf_generator.generate_proposal(db, sample_project)
    
    assert isinstance(result, bytes)
    assert len(result) > 0
    # Check PDF magic bytes
    assert result[:4] == b'%PDF'


@pytest.mark.asyncio
async def test_generate_proposal_with_no_included_venues():
    """Test behavior when no venues are included."""
    project = MagicMock(spec=Project)
    project.project_venues = []
    
    db = AsyncMock()
    
    # Should still generate (empty proposal)
    result = await pdf_generator.generate_proposal(db, project)
    assert isinstance(result, bytes)
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Missing fonts | Inter not installed | Install font or use CSS fallback |
| Image not loading | URL not accessible | Ensure photos are publicly accessible or use base64 |
| Page breaks wrong | CSS page-break rules | Adjust `page-break-before/after` properties |
| Colors not printing | Print CSS | Add `print-color-adjust: exact` |
| PDF too large | High-res images | Compress images before upload |

### WeasyPrint Installation

```bash
# Ubuntu/Debian
sudo apt-get install libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0

# macOS
brew install pango

# Then install WeasyPrint
pip install weasyprint
```

### Testing Locally

```python
# Quick test script
from app.services.pdf_generator import pdf_generator

# Generate test PDF
with open("test_proposal.pdf", "wb") as f:
    pdf_bytes = await pdf_generator.generate_proposal(db, project)
    f.write(pdf_bytes)
```
