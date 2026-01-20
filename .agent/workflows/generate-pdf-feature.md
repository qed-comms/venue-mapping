---
description: Specific workflow for PDF-related changes, including styling, content structure, and template modifications. Use when working on venue proposal PDF generation.
---

# PDF Feature Workflow

Use this workflow when making changes to the venue proposal PDF generation system.

## PDF System Overview

The PDF proposal is generated using:
- **WeasyPrint** — HTML/CSS to PDF conversion
- **Jinja2** — HTML templating
- **Brand Guide** — Colors, typography, layout (see `brand-guide.md`)

**Key files:**
- `backend/app/services/pdf_generator.py` — Generation service
- `backend/app/templates/proposal/proposal.html` — Main template
- `backend/app/templates/proposal/styles.css` — PDF stylesheet
- `backend/app/api/projects.py` — Download endpoint

## Step 1: Understand the Change

Identify what type of PDF change this is:

| Change Type | Files Affected | Complexity |
|-------------|----------------|------------|
| Content change | `proposal.html` | Low |
| Styling change | `styles.css` | Low-Medium |
| New section | `proposal.html`, `styles.css` | Medium |
| Data change | `pdf_generator.py`, template | Medium |
| Layout restructure | All PDF files | High |

## Step 2: Review Brand Guidelines

Before making changes, review the brand guide (`brand-guide.md`):

### Colors
```css
--qed-dark-blue: #1B2B4B;   /* Headers, backgrounds */
--qed-green: #2EC4A0;       /* Accents, totals */
--qed-dark-grey: #4A5568;   /* Body text */
```

### Typography
| Element | Size | Weight |
|---------|------|--------|
| Venue name | 18pt | Bold |
| Section heading | 14pt | Semibold |
| Body text | 11pt | Regular |
| Caption | 9pt | Regular |

### Layout Rules
- Page: A4 (210mm × 297mm)
- Margins: 20mm top/bottom, 25mm left/right
- Cover page: Full bleed, no margins

## Step 3: Development Environment

### Local Testing Setup

```python
# Quick test script - backend/scripts/test_pdf.py
import asyncio
from app.services.pdf_generator import pdf_generator
from app.database import async_session
from app.services.project_service import project_service

async def test_pdf():
    async with async_session() as db:
        project = await project_service.get_by_id_with_venues(
            db, 
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"  # Test project ID
        )
        if project:
            pdf_bytes = await pdf_generator.generate_proposal(db, project)
            with open("test_proposal.pdf", "wb") as f:
                f.write(pdf_bytes)
            print("PDF generated: test_proposal.pdf")

asyncio.run(test_pdf())
```

### Live Reload for Styling

For rapid CSS iteration:

```python
# Modify pdf_generator.py temporarily
def _load_base_css(self) -> str:
    # Re-read CSS on every generation during development
    css_path = Path(__file__).parent.parent / "templates" / "proposal" / "styles.css"
    return css_path.read_text()
```

## Step 4: Implementation Checklist

### For Content Changes

- [ ] Update `proposal.html` template
- [ ] Verify Jinja2 variables exist in context
- [ ] Test with real data (not just mock data)
- [ ] Check all conditional blocks render correctly

### For Styling Changes

- [ ] Update `styles.css`
- [ ] Test print preview in browser first (faster iteration)
- [ ] Verify `-webkit-print-color-adjust: exact` for background colors
- [ ] Check page breaks don't split content awkwardly
- [ ] Test with venues that have varying amounts of content

### For New Sections

- [ ] Add HTML structure to template
- [ ] Add corresponding CSS styles
- [ ] Update `pdf_generator.py` to pass required data
- [ ] Add page break rules if needed
- [ ] Test with 0, 1, and many items

## Step 5: Testing

### Visual Testing Checklist

| Element | Check |
|---------|-------|
| Cover page | Logo centered, text readable, full bleed |
| Venue header | Pill shape, name + dates visible |
| Photos | Correct size, no stretching, rounded corners |
| Description | Proper line spacing, no orphans |
| Pros/Cons | Green border on left, columns balanced |
| Pricing | Table headers dark blue, total green |
| Page breaks | No content cut in half |
| Footer | Shows on all pages except cover |

### Test Cases

1. **Single venue** — Basic functionality
2. **Multiple venues** — Page breaks work
3. **Venue with no photos** — Graceful handling
4. **Venue with 6+ photos** — Limit to 4
5. **Long description** — Text doesn't overflow
6. **No pricing data** — Section hidden
7. **All statuses** — Awaiting/declined lists render
8. **Empty proposal** — Error message (no venues included)

### PDF Validation

```python
# Verify PDF is valid
def test_pdf_is_valid():
    pdf_bytes = await pdf_generator.generate_proposal(db, project)
    
    # Check magic bytes
    assert pdf_bytes[:4] == b'%PDF'
    
    # Check reasonable size (not empty, not huge)
    assert 10_000 < len(pdf_bytes) < 10_000_000
```

## Step 6: Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Colors not showing | Print CSS | Add `-webkit-print-color-adjust: exact` |
| Images not loading | URL not accessible | Ensure public URLs or embed as base64 |
| Fonts look wrong | Font not installed | Use web-safe fallbacks in font-family |
| Page breaks wrong | CSS rules | Use `page-break-before: always` |
| Content cut off | Fixed heights | Use min-height or remove fixed heights |
| PDF too large | High-res images | Compress images before upload |
| Timeout | Too many images | Limit photos per venue |

## Step 7: WeasyPrint-Specific Notes

### Supported CSS

WeasyPrint supports most CSS 2.1 and some CSS 3:
- ✅ Flexbox (basic)
- ✅ Grid (basic)
- ✅ @page rules
- ✅ CSS columns
- ❌ CSS transforms
- ❌ Animations
- ❌ JavaScript

### Page Break Control

```css
/* Always start venue on new page */
.venue-page {
  page-break-before: always;
}

/* Don't break inside pros/cons box */
.pros-cons-box {
  page-break-inside: avoid;
}

/* Keep header with content */
.venue-header {
  page-break-after: avoid;
}
```

### Print Colors

```css
/* Required for background colors to show */
.venue-header,
.cover-page,
.pricing-total {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

## Step 8: Update Documentation

After completing PDF changes:

- [ ] Update `docs/PROJECT.md` if PDF structure changed
- [ ] Add entry to `docs/TASK-LOG.md`
- [ ] Screenshot new PDF for reference
- [ ] Update `brand-guide.md` if new styles added

## Quick Reference: Template Variables

Available in `proposal.html`:

```jinja2
{{ project.client_name }}
{{ project.event_name }}
{{ project.event_date_range }}
{{ project.attendee_count }}

{% for pv in included_venues %}
  {{ pv.venue.name }}
  {{ pv.venue.address }}
  {{ pv.venue.city }}
  {{ pv.venue.capacity }}
  {{ pv.availability_dates }}
  {{ pv.final_description or pv.ai_description }}
  {{ pv.pros }}
  {{ pv.cons }}
  {{ pv.quoted_price }}
  {{ pv.room_allocation }}
  {{ pv.catering_description }}
  {% for photo in pv.venue.photos[:4] %}
    {{ photo.url }}
    {{ photo.caption }}
  {% endfor %}
{% endfor %}

{% for pv in awaiting_venues %}
  {{ pv.venue.name }}
{% endfor %}

{% for pv in declined_venues %}
  {{ pv.venue.name }}
  {{ pv.notes }}
{% endfor %}
```
